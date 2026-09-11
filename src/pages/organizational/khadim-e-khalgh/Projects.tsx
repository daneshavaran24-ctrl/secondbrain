import React, { useState, useEffect } from 'react';
import { Heart, Plus, Search, Calendar, Users, MapPin, FileText, Camera, Award, Eye, Edit, Upload, Download, Trash2, Image, Video, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/utils/signedUrlHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Service Project Type
interface ServiceProject {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
  location: string;
  beneficiaries: number;
  budget: string;
  progress: number;
  category: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    date: string;
    size?: number;
    storage_bucket?: string;
    storage_path?: string;
    file_url?: string;
  }>;
}

// Form Schema
const projectSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  status: z.enum(['planned', 'in-progress', 'completed'], {
    required_error: 'وضعیت الزامی است'
  }),
  startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
  endDate: z.string().min(1, 'تاریخ پایان الزامی است'),
  location: z.string().min(1, 'محل اجرا الزامی است'),
  beneficiaries: z.number().min(1, 'تعداد بهره‌مندان باید بیشتر از صفر باشد'),
  budget: z.string().min(1, 'بودجه الزامی است'),
  progress: z.number().min(0).max(100),
  category: z.string().min(1, 'دسته‌بندی الزامی است')
});

type ProjectFormData = z.infer<typeof projectSchema>;

const Projects = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<ServiceProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ServiceProject | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [editFiles, setEditFiles] = useState<File[]>([]);

  // File upload utility functions
  const uploadFileToSupabase = async (file: File, bucket = 'attachments') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      return {
        storage_bucket: bucket,
        storage_path: data.path
      };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const attachments = [];
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'خطا',
          description: `فایل ${file.name} بیش از حد مجاز (10MB) است`,
          variant: 'destructive'
        });
        continue;
      }

      let attachment: any = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: getFileType(file.type),
        date: new Date().toLocaleDateString('fa-IR'),
        size: file.size
      };

      // Try to upload to Supabase
      const uploadResult = await uploadFileToSupabase(file);
      
      if (uploadResult) {
        attachment = {
          ...attachment,
          storage_bucket: uploadResult.storage_bucket,
          storage_path: uploadResult.storage_path
        };
      } else {
        // Fallback to blob URL
        attachment = {
          ...attachment,
          file_url: URL.createObjectURL(file)
        };
      }

      attachments.push(attachment);
    }

    return attachments;
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'report';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'file';
  };

  const getAttachmentUrl = async (attachment: any) => {
    if (attachment.storage_path && attachment.storage_bucket) {
      try {
        const url = await getCachedSignedUrl(attachment.storage_bucket, attachment.storage_path);
        return url;
      } catch (error) {
        console.error('Error getting signed URL:', error);
      }
    }
    return attachment.file_url || null;
  };

  const openAttachment = async (attachment: any) => {
    const url = await getAttachmentUrl(attachment);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'خطا',
        description: 'امکان باز کردن فایل وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  const removeAttachment = async (projectId: string, attachmentId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const attachment = project.attachments?.find(a => a.id === attachmentId);
    if (!attachment) return;

    // Remove from Supabase Storage if it exists
    if (attachment.storage_path && attachment.storage_bucket) {
      try {
        await supabase.storage
          .from(attachment.storage_bucket)
          .remove([attachment.storage_path]);
      } catch (error) {
        console.error('Error removing file from storage:', error);
      }
    }

    // Remove from state
    setProjects(prev => 
      prev.map(p => 
        p.id === projectId 
          ? { ...p, attachments: p.attachments?.filter(a => a.id !== attachmentId) || [] }
          : p
      )
    );

    toast({
      title: 'موفقیت',
      description: 'فایل با موفقیت حذف شد'
    });
  };

  // Forms
  const newForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'planned',
      startDate: '',
      endDate: '',
      location: '',
      beneficiaries: 1,
      budget: '',
      progress: 0,
      category: ''
    }
  });

  const editForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema)
  });

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('khk_service_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
    // No initial sample data - start with empty state
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('khk_service_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Create new project
  const onCreateProject = async (data: ProjectFormData) => {
    try {
      let attachments = [];
      
      // Handle file uploads
      if (newFiles.length > 0) {
        attachments = await handleFileUpload(newFiles);
      }

      const newProject: ServiceProject = {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        beneficiaries: data.beneficiaries,
        budget: data.budget,
        category: data.category,
        progress: data.status === 'completed' ? 100 : data.status === 'planned' ? 0 : data.progress,
        attachments
      };
      
      setProjects(prev => [...prev, newProject]);
      newForm.reset();
      setNewFiles([]);
      setIsNewDialogOpen(false);
      toast({
        title: 'موفقیت',
        description: 'پروژه جدید با موفقیت ثبت شد'
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ثبت پروژه',
        variant: 'destructive'
      });
    }
  };

  // Edit project
  const onEditProject = async (data: ProjectFormData) => {
    if (!selectedProject) return;
    
    try {
      let newAttachments = [];
      
      // Handle new file uploads
      if (editFiles.length > 0) {
        newAttachments = await handleFileUpload(editFiles);
      }

      const updatedProject: ServiceProject = {
        ...selectedProject,
        ...data,
        progress: data.status === 'completed' ? 100 : data.status === 'planned' ? 0 : data.progress,
        attachments: [...(selectedProject.attachments || []), ...newAttachments]
      };
      
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
      setEditFiles([]);
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: 'موفقیت',
        description: 'پروژه با موفقیت ویرایش شد'
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ویرایش پروژه',
        variant: 'destructive'
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (project: ServiceProject) => {
    setSelectedProject(project);
    editForm.reset({
      title: project.title,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      location: project.location,
      beneficiaries: project.beneficiaries,
      budget: project.budget,
      progress: project.progress,
      category: project.category
    });
    setIsEditDialogOpen(true);
  };

  // Open details dialog
  const openDetailsDialog = (project: ServiceProject) => {
    setSelectedProject(project);
    setIsDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">تکمیل شده</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">در حال اجرا</Badge>;
      case 'planned':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">برنامه‌ریزی شده</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <Award className="h-4 w-4 text-yellow-600" />;
      case 'photo':
        return <Image className="h-4 w-4 text-blue-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-600" />;
      case 'report':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-green-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.includes(searchTerm) || project.description.includes(searchTerm)
  );

  const completedProjects = filteredProjects.filter(p => p.status === 'completed');
  const inProgressProjects = filteredProjects.filter(p => p.status === 'in-progress');
  const plannedProjects = filteredProjects.filter(p => p.status === 'planned');

  const ProjectCard = ({ project }: { project: ServiceProject }) => (
    <Card className="glass-card hover-lift transition-elegant">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
            <CardDescription className="mb-4">{project.description}</CardDescription>
            {getStatusBadge(project.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{project.startDate} - {project.endDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{project.beneficiaries} بهره‌مند</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>بودجه: {project.budget} تومان</span>
            </div>
          </div>

          {project.status !== 'planned' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>پیشرفت:</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          )}

          {project.attachments && project.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">مدارک ضمیمه:</h4>
              <div className="space-y-1">
                {project.attachments.map((attachment, idx) => (
                  <div key={attachment.id || idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded text-sm">
                    {getAttachmentIcon(attachment.type)}
                    <span className="flex-1">{attachment.name}</span>
                    <span className="text-muted-foreground text-xs">{attachment.date}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => openAttachment(attachment)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => openDetailsDialog(project)}
            >
              <Eye className="h-4 w-4 ml-1" />
              مشاهده جزئیات
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => openEditDialog(project)}
            >
              <Edit className="h-4 w-4 ml-1" />
              ویرایش
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-7xl mx-auto spacing-relaxed">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">دفتر اقدامات انجام‌شده</h1>
              <p className="text-muted-foreground">ثبت و پیگیری پروژه‌های خدمت‌رسانی</p>
            </div>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsNewDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            ثبت پروژه جدید
          </Button>
        </div>

        {/* New Project Dialog */}
        <ResponsiveDialog
          open={isNewDialogOpen}
          onOpenChange={setIsNewDialogOpen}
          title="ثبت پروژه خدمت‌رسانی جدید"
          description="اطلاعات پروژه جدید را وارد کنید"
          className="max-w-4xl"
        >
          <Form {...newForm}>
            <form onSubmit={newForm.handleSubmit(onCreateProject)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={newForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان پروژه</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="عنوان پروژه را وارد کنید" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته‌بندی</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="کمک مالی">کمک مالی</SelectItem>
                            <SelectItem value="آموزش">آموزش</SelectItem>
                            <SelectItem value="عمران">عمران</SelectItem>
                            <SelectItem value="تغذیه">تغذیه</SelectItem>
                            <SelectItem value="سلامت">سلامت</SelectItem>
                            <SelectItem value="فرهنگی">فرهنگی</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={newForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="توضیحات پروژه را وارد کنید" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={newForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="انتخاب وضعیت" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                            <SelectItem value="in-progress">در حال اجرا</SelectItem>
                            <SelectItem value="completed">تکمیل شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ شروع</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="تاریخ شروع (مثال: ۱۴۰۳/۰۶/۰۱)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ پایان</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="تاریخ پایان (مثال: ۱۴۰۳/۱۰/۰۱)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={newForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محل اجرا</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="محل اجرای پروژه" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="beneficiaries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تعداد بهره‌مندان</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="تعداد بهره‌مندان"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بودجه (تومان)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="بودجه پروژه" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={newForm.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>درصد پیشرفت: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        max={100}
                        step={5}
                        disabled={newForm.watch('status') === 'planned' || newForm.watch('status') === 'completed'}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">پیوست‌ها و مدارک</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <div className="text-sm text-muted-foreground mb-2">
                        فایل‌های خود را انتخاب کنید یا اینجا بکشید
                      </div>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setNewFiles(files);
                        }}
                        className="max-w-xs mx-auto"
                      />
                      <div className="text-xs text-muted-foreground mt-2">
                        حداکثر اندازه فایل: 10MB
                      </div>
                    </div>
                  </div>
                </div>

                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">فایل‌های انتخاب شده:</h4>
                    {newFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded text-sm">
                        {getAttachmentIcon(getFileType(file.type))}
                        <span className="flex-1">{file.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">
                  ثبت پروژه
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>

        {/* Edit Project Dialog */}
        <ResponsiveDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="ویرایش پروژه خدمت‌رسانی"
          description="اطلاعات پروژه را ویرایش کنید"
          className="max-w-4xl"
        >
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditProject)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان پروژه</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="عنوان پروژه را وارد کنید" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته‌بندی</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="کمک مالی">کمک مالی</SelectItem>
                            <SelectItem value="آموزش">آموزش</SelectItem>
                            <SelectItem value="عمران">عمران</SelectItem>
                            <SelectItem value="تغذیه">تغذیه</SelectItem>
                            <SelectItem value="سلامت">سلامت</SelectItem>
                            <SelectItem value="فرهنگی">فرهنگی</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="توضیحات پروژه را وارد کنید" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="انتخاب وضعیت" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                            <SelectItem value="in-progress">در حال اجرا</SelectItem>
                            <SelectItem value="completed">تکمیل شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ شروع</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="تاریخ شروع (مثال: ۱۴۰۳/۰۶/۰۱)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ پایان</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="تاریخ پایان (مثال: ۱۴۰۳/۱۰/۰۱)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محل اجرا</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="محل اجرای پروژه" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="beneficiaries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تعداد بهره‌مندان</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="تعداد بهره‌مندان"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بودجه (تومان)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="بودجه پروژه" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>درصد پیشرفت: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        max={100}
                        step={5}
                        disabled={editForm.watch('status') === 'planned' || editForm.watch('status') === 'completed'}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Existing Attachments Management */}
              {selectedProject?.attachments && selectedProject.attachments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">مدارک موجود:</h4>
                  <div className="space-y-2">
                    {selectedProject.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        {getAttachmentIcon(attachment.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{attachment.date}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openAttachment(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeAttachment(selectedProject.id, attachment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Files Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">افزودن پیوست‌های جدید</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <div className="text-sm text-muted-foreground mb-2">
                        فایل‌های جدید را انتخاب کنید
                      </div>
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEditFiles(files);
                        }}
                        className="max-w-xs mx-auto"
                      />
                      <div className="text-xs text-muted-foreground mt-2">
                        حداکثر اندازه فایل: 10MB
                      </div>
                    </div>
                  </div>
                </div>

                {editFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">فایل‌های جدید:</h4>
                    {editFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded text-sm">
                        {getAttachmentIcon(getFileType(file.type))}
                        <span className="flex-1">{file.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setEditFiles(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">
                  ذخیره تغییرات
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>

        {/* Project Details Dialog */}
        <ResponsiveDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          title="جزئیات پروژه"
          description="اطلاعات کامل پروژه"
          className="max-w-4xl"
        >
          {selectedProject && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">عنوان پروژه</h3>
                  <p className="text-muted-foreground">{selectedProject.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">وضعیت</h3>
                  {getStatusBadge(selectedProject.status)}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">توضیحات</h3>
                <p className="text-muted-foreground">{selectedProject.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">تاریخ شروع</h3>
                  <p className="text-muted-foreground">{selectedProject.startDate}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">تاریخ پایان</h3>
                  <p className="text-muted-foreground">{selectedProject.endDate}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">محل اجرا</h3>
                  <p className="text-muted-foreground">{selectedProject.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">تعداد بهره‌مندان</h3>
                  <p className="text-muted-foreground">{selectedProject.beneficiaries} نفر</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">بودجه</h3>
                  <p className="text-muted-foreground">{selectedProject.budget} تومان</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">دسته‌بندی</h3>
                  <p className="text-muted-foreground">{selectedProject.category}</p>
                </div>
              </div>

              {selectedProject.status !== 'planned' && (
                <div>
                  <h3 className="font-semibold mb-2">درصد پیشرفت</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>پیشرفت کلی:</span>
                      <span>{selectedProject.progress}%</span>
                    </div>
                    <Progress value={selectedProject.progress} className="h-3" />
                  </div>
                </div>
              )}

              {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">مدارک ضمیمه</h3>
                  <div className="space-y-2">
                    {selectedProject.attachments.map((attachment, idx) => (
                      <div key={attachment.id || idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        {getAttachmentIcon(attachment.type)}
                        <div className="flex-1">
                          <p className="font-medium">{attachment.name}</p>
                          <p className="text-sm text-muted-foreground">{attachment.date}</p>
                          {attachment.size && (
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAttachment(attachment)}
                        >
                          <Download className="h-4 w-4 ml-1" />
                          مشاهده
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  بستن
                </Button>
                <Button onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedProject);
                }}>
                  ویرایش پروژه
                </Button>
              </div>
            </div>
          )}
         </ResponsiveDialog>

        {/* Search */}
        <Card className="glass-card mb-8">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در پروژه‌ها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{completedProjects.length}</div>
              <p className="text-sm text-muted-foreground">پروژه تکمیل شده</p>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{inProgressProjects.length}</div>
              <p className="text-sm text-muted-foreground">پروژه در حال اجرا</p>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{plannedProjects.length}</div>
              <p className="text-sm text-muted-foreground">پروژه برنامه‌ریزی شده</p>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {projects.reduce((sum, p) => sum + p.beneficiaries, 0)}
              </div>
              <p className="text-sm text-muted-foreground">کل بهره‌مندان</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">همه پروژه‌ها</TabsTrigger>
            <TabsTrigger value="completed">تکمیل شده</TabsTrigger>
            <TabsTrigger value="in-progress">در حال اجرا</TabsTrigger>
            <TabsTrigger value="planned">برنامه‌ریزی شده</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6">
              {completedProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            <div className="grid gap-6">
              {inProgressProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="planned" className="space-y-6">
            <div className="grid gap-6">
              {plannedProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;