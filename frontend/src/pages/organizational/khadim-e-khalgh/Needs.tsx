import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, MapPin, Clock, AlertCircle, Eye, CheckCircle, Edit, Upload, FileText, X, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import ConfirmDialog from '@/components/ui/confirm-dialog';

// Types
interface SocialNeed {
  id: string;
  title: string;
  description?: string;
  category: string;
  area: string;
  priority: 'فوری' | 'بالا' | 'متوسط' | 'کم';
  status: 'planned' | 'in-progress' | 'completed';
  requestDate: string;
  beneficiaries: number;
  estimatedCost: number;
  image?: {
    storage_bucket?: string;
    storage_path?: string;
    file_url?: string;
  };
  attachments?: Array<{
    name: string;
    storage_bucket?: string;
    storage_path?: string;
    file_url?: string;
  }>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Form validation schema
const needFormSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().optional(),
  category: z.string().min(1, 'دسته‌بندی الزامی است'),
  area: z.string().min(1, 'منطقه الزامی است'),
  priority: z.enum(['فوری', 'بالا', 'متوسط', 'کم']),
  status: z.enum(['planned', 'in-progress', 'completed']),
  requestDate: z.string().min(1, 'تاریخ الزامی است'),
  beneficiaries: z.number().min(0, 'تعداد بهره‌مندان باید مثبت باشد'),
  estimatedCost: z.number().min(0, 'هزینه باید مثبت باشد'),
  notes: z.string().optional(),
});

const actionFormSchema = z.object({
  status: z.enum(['planned', 'in-progress', 'completed']),
  notes: z.string().optional(),
});

const Needs = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [needs, setNeeds] = useState<SocialNeed[]>([]);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<SocialNeed | null>(null);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [actionFiles, setActionFiles] = useState<File[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedNeeds = localStorage.getItem('khk_social_needs');
    if (savedNeeds) {
      try {
        const parsed = JSON.parse(savedNeeds);
        // Convert old status format to new format
        const convertedNeeds = parsed.map((need: any) => ({
          ...need,
          id: need.id.toString(),
          status: convertOldStatus(need.status),
          created_at: need.created_at || new Date().toISOString(),
          updated_at: need.updated_at || new Date().toISOString(),
        }));
        setNeeds(convertedNeeds);
      } catch (error) {
        console.error('Error loading needs:', error);
        setNeeds([]);
      }
    } else {
      setNeeds([]);
    }
  }, []);

  // Save to localStorage whenever needs change
  useEffect(() => {
    if (needs.length > 0) {
      localStorage.setItem('khk_social_needs', JSON.stringify(needs));
    }
  }, [needs]);

  const convertOldStatus = (oldStatus: string): 'planned' | 'in-progress' | 'completed' => {
    switch (oldStatus) {
      case 'در حال اجرا':
        return 'in-progress';
      case 'تأیید شده':
      case 'در انتظار بررسی':
      case 'در حال بررسی':
        return 'planned';
      default:
        return 'planned';
    }
  };


  // Forms
  const addForm = useForm<z.infer<typeof needFormSchema>>({
    resolver: zodResolver(needFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      area: '',
      priority: 'متوسط',
      status: 'planned',
      requestDate: '',
      beneficiaries: 0,
      estimatedCost: 0,
      notes: '',
    },
  });

  const editForm = useForm<z.infer<typeof needFormSchema>>({
    resolver: zodResolver(needFormSchema),
  });

  const actionForm = useForm<z.infer<typeof actionFormSchema>>({
    resolver: zodResolver(actionFormSchema),
  });

  // File upload utilities
  const uploadFileToSupabase = async (file: File, bucket: string = 'attachments'): Promise<{ storage_bucket: string; storage_path: string; file_url?: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `social-needs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      return {
        storage_bucket: bucket,
        storage_path: filePath,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const createBlobUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFileUpload = async (files: File[]): Promise<Array<{ name: string; storage_bucket?: string; storage_path?: string; file_url?: string }>> => {
    const uploadedFiles = [];
    
    for (const file of files) {
      try {
        const uploadResult = await uploadFileToSupabase(file);
        if (uploadResult) {
          uploadedFiles.push({
            name: file.name,
            ...uploadResult,
          });
        } else {
          // Fallback to blob URL
          uploadedFiles.push({
            name: file.name,
            file_url: createBlobUrl(file),
          });
        }
      } catch (error) {
        // Fallback to blob URL
        uploadedFiles.push({
          name: file.name,
          file_url: createBlobUrl(file),
        });
      }
    }
    
    return uploadedFiles;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'فوری': return 'bg-red-100 text-red-800 border-red-200';
      case 'بالا': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'متوسط': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'تکمیل شده';
      case 'in-progress': return 'در حال اجرا';
      case 'planned': return 'برنامه‌ریزی شده';
      default: return status;
    }
  };

  // Handlers
  const onAddSubmit = async (data: z.infer<typeof needFormSchema>) => {
    try {
      const attachments = uploadedFiles.length > 0 ? await handleFileUpload(uploadedFiles) : [];
      const image = uploadedImage ? (await handleFileUpload([uploadedImage]))[0] : undefined;

      const newNeed: SocialNeed = {
        id: Math.random().toString(36).substring(2),
        title: data.title,
        description: data.description,
        category: data.category,
        area: data.area,
        priority: data.priority,
        status: data.status,
        requestDate: data.requestDate,
        beneficiaries: data.beneficiaries,
        estimatedCost: data.estimatedCost,
        notes: data.notes,
        attachments,
        image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setNeeds(prev => [...prev, newNeed]);
      setIsAddDialogOpen(false);
      addForm.reset();
      setUploadedFiles([]);
      setUploadedImage(null);
      
      toast({
        title: 'موفقیت',
        description: 'نیاز جدید با موفقیت ثبت شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در ثبت نیاز خطایی رخ داد',
        variant: 'destructive',
      });
    }
  };

  const onEditSubmit = async (data: z.infer<typeof needFormSchema>) => {
    if (!selectedNeed) return;
    
    try {
      const attachments = uploadedFiles.length > 0 ? await handleFileUpload(uploadedFiles) : selectedNeed.attachments;
      const image = uploadedImage ? (await handleFileUpload([uploadedImage]))[0] : selectedNeed.image;

      const updatedNeed: SocialNeed = {
        ...selectedNeed,
        ...data,
        attachments,
        image,
        updated_at: new Date().toISOString(),
      };

      setNeeds(prev => prev.map(need => need.id === selectedNeed.id ? updatedNeed : need));
      setIsEditDialogOpen(false);
      setUploadedFiles([]);
      setUploadedImage(null);
      
      toast({
        title: 'موفقیت',
        description: 'نیاز با موفقیت ویرایش شد',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در ویرایش نیاز خطایی رخ داد',
        variant: 'destructive',
      });
    }
  };

  const onActionSubmit = async (data: z.infer<typeof actionFormSchema>) => {
    if (!selectedNeed) return;
    
    try {
      const newAttachments = actionFiles.length > 0 ? await handleFileUpload(actionFiles) : [];
      
      const updatedNeed: SocialNeed = {
        ...selectedNeed,
        status: data.status,
        notes: data.notes || selectedNeed.notes,
        attachments: [...(selectedNeed.attachments || []), ...newAttachments],
        updated_at: new Date().toISOString(),
      };

      setNeeds(prev => prev.map(need => need.id === selectedNeed.id ? updatedNeed : need));
      setIsActionDialogOpen(false);
      actionForm.reset();
      setActionFiles([]);
      
      const statusMessage = data.status === 'completed' ? 'نیاز با موفقیت تکمیل شد' : 'وضعیت نیاز بروزرسانی شد';
      toast({
        title: 'موفقیت',
        description: statusMessage,
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در بروزرسانی نیاز خطایی رخ داد',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    if (!selectedNeed) return;
    
    setNeeds(prev => prev.filter(need => need.id !== selectedNeed.id));
    setIsDeleteDialogOpen(false);
    setSelectedNeed(null);
    
    toast({
      title: 'موفقیت',
      description: 'نیاز با موفقیت حذف شد',
    });
  };

  const openDetailsDialog = (need: SocialNeed) => {
    setSelectedNeed(need);
    setIsDetailsDialogOpen(true);
  };

  const openEditDialog = (need: SocialNeed) => {
    setSelectedNeed(need);
    editForm.reset({
      title: need.title,
      description: need.description || '',
      category: need.category,
      area: need.area,
      priority: need.priority,
      status: need.status,
      requestDate: need.requestDate,
      beneficiaries: need.beneficiaries,
      estimatedCost: need.estimatedCost,
      notes: need.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const openActionDialog = (need: SocialNeed) => {
    setSelectedNeed(need);
    actionForm.reset({
      status: need.status,
      notes: need.notes || '',
    });
    setIsActionDialogOpen(true);
  };

  const filteredNeeds = needs.filter(need => {
    return (
      need.title.includes(searchTerm) ||
      (need.description && need.description.includes(searchTerm))
    ) &&
    (selectedArea === '' || selectedArea === 'all' || need.area === selectedArea) &&
    (selectedCategory === '' || selectedCategory === 'all' || need.category === selectedCategory) &&
    (selectedPriority === '' || selectedPriority === 'all' || need.priority === selectedPriority);
  });

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-7xl mx-auto spacing-relaxed">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">بانک نیازهای اجتماعی</h1>
              <p className="text-muted-foreground">شناسایی و مدیریت نیازهای مردم</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            ثبت نیاز جدید
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              جستجو و فیلتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در نیازها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="همه مناطق" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 shadow-md">
                  <SelectItem value="all">همه مناطق</SelectItem>
                  <SelectItem value="منطقه ۱">منطقه ۱</SelectItem>
                  <SelectItem value="منطقه ۲">منطقه ۲</SelectItem>
                  <SelectItem value="منطقه ۳">منطقه ۳</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="همه دسته‌ها" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 shadow-md">
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  <SelectItem value="سلامت">سلامت</SelectItem>
                  <SelectItem value="آموزش">آموزش</SelectItem>
                  <SelectItem value="تغذیه">تغذیه</SelectItem>
                  <SelectItem value="مسکن">مسکن</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="همه اولویت‌ها" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 shadow-md">
                  <SelectItem value="all">همه اولویت‌ها</SelectItem>
                  <SelectItem value="فوری">فوری</SelectItem>
                  <SelectItem value="بالا">بالا</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Needs List */}
        <div className="grid gap-6">
          {filteredNeeds.map((need) => (
            <Card key={need.id} className="glass-card hover-lift transition-elegant">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{need.title}</h3>
                    <p className="text-muted-foreground mb-4">{need.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className={getPriorityColor(need.priority)}>
                        <AlertCircle className="h-3 w-3 ml-1" />
                        {need.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(need.status)}>
                        {getStatusLabel(need.status)}
                      </Badge>
                      <Badge variant="secondary">
                        <MapPin className="h-3 w-3 ml-1" />
                        {need.area}
                      </Badge>
                      <Badge variant="secondary">{need.category}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{need.requestDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{need.beneficiaries} بهره‌مند</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>هزینه:</span>
                        <span className="font-medium">{need.estimatedCost.toLocaleString()} تومان</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailsDialog(need)}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      مشاهده
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => openActionDialog(need)}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" />
                      اقدام
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(need)}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      ویرایش
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNeeds.length === 0 && (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">نیازی یافت نشد</h3>
              <p className="text-muted-foreground">با تغییر فیلترها یا جستجوی جدید دوباره تلاش کنید</p>
            </CardContent>
          </Card>
        )}

        {/* Add Need Dialog */}
        <ResponsiveDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          title="ثبت نیاز جدید"
          description="اطلاعات نیاز اجتماعی جدید را وارد کنید"
        >
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان نیاز</FormLabel>
                    <FormControl>
                      <Input placeholder="عنوان نیاز را وارد کنید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea placeholder="توضیحات کامل نیاز را بنویسید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته‌بندی</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50 shadow-md">
                          <SelectItem value="سلامت">سلامت</SelectItem>
                          <SelectItem value="آموزش">آموزش</SelectItem>
                          <SelectItem value="تغذیه">تغذیه</SelectItem>
                          <SelectItem value="مسکن">مسکن</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>منطقه</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب منطقه" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50 shadow-md">
                          <SelectItem value="منطقه ۱">منطقه ۱</SelectItem>
                          <SelectItem value="منطقه ۲">منطقه ۲</SelectItem>
                          <SelectItem value="منطقه ۳">منطقه ۳</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اولویت</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب اولویت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50 shadow-md">
                          <SelectItem value="فوری">فوری</SelectItem>
                          <SelectItem value="بالا">بالا</SelectItem>
                          <SelectItem value="متوسط">متوسط</SelectItem>
                          <SelectItem value="کم">کم</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب وضعیت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50 shadow-md">
                          <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                          <SelectItem value="in-progress">در حال اجرا</SelectItem>
                          <SelectItem value="completed">تکمیل شده</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="requestDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ درخواست</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="۱۴۰۳/۰۸/۱۵"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="beneficiaries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تعداد بهره‌مندان</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="تعداد افراد" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>برآورد هزینه (تومان)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="برآورد هزینه" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>یادداشت</FormLabel>
                    <FormControl>
                      <Textarea placeholder="یادداشت اختیاری" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div>
                  <Label>تصویر شاخص</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadedImage(file);
                      }}
                    />
                    {uploadedImage && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {uploadedImage.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>پیوست‌ها</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedFiles(files);
                      }}
                    />
                    {uploadedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">ثبت نیاز</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    addForm.reset();
                    setUploadedFiles([]);
                    setUploadedImage(null);
                  }}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>

        {/* Details Dialog */}
        <ResponsiveDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          title="جزئیات نیاز"
          description="اطلاعات کامل نیاز اجتماعی"
        >
          {selectedNeed && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedNeed.title}</h3>
                <p className="text-muted-foreground">{selectedNeed.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getPriorityColor(selectedNeed.priority)}>
                  <AlertCircle className="h-3 w-3 ml-1" />
                  {selectedNeed.priority}
                </Badge>
                <Badge variant="outline" className={getStatusColor(selectedNeed.status)}>
                  {getStatusLabel(selectedNeed.status)}
                </Badge>
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 ml-1" />
                  {selectedNeed.area}
                </Badge>
                <Badge variant="secondary">{selectedNeed.category}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">تاریخ درخواست:</span>
                  <span className="mr-2">{selectedNeed.requestDate}</span>
                </div>
                <div>
                  <span className="font-medium">تعداد بهره‌مندان:</span>
                  <span className="mr-2">{selectedNeed.beneficiaries}</span>
                </div>
                <div>
                  <span className="font-medium">برآورد هزینه:</span>
                  <span className="mr-2">{selectedNeed.estimatedCost.toLocaleString()} تومان</span>
                </div>
              </div>

              {selectedNeed.notes && (
                <div>
                  <span className="font-medium">یادداشت:</span>
                  <p className="mt-1 text-muted-foreground">{selectedNeed.notes}</p>
                </div>
              )}

              {selectedNeed.attachments && selectedNeed.attachments.length > 0 && (
                <div>
                  <span className="font-medium">پیوست‌ها:</span>
                  <div className="mt-2 space-y-1">
                    {selectedNeed.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {attachment.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedNeed);
                }}>
                  <Edit className="h-4 w-4 ml-1" />
                  ویرایش
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  بستن
                </Button>
              </div>
            </div>
          )}
        </ResponsiveDialog>

        {/* Edit Dialog */}
        <ResponsiveDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="ویرایش نیاز"
          description="اطلاعات نیاز را ویرایش کنید"
        >
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان نیاز</FormLabel>
                    <FormControl>
                      <Input placeholder="عنوان نیاز را وارد کنید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea placeholder="توضیحات کامل نیاز را بنویسید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب وضعیت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50 shadow-md">
                          <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                          <SelectItem value="in-progress">در حال اجرا</SelectItem>
                          <SelectItem value="completed">تکمیل شده</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اولویت</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب اولویت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50 shadow-md">
                          <SelectItem value="فوری">فوری</SelectItem>
                          <SelectItem value="بالا">بالا</SelectItem>
                          <SelectItem value="متوسط">متوسط</SelectItem>
                          <SelectItem value="کم">کم</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">ذخیره تغییرات</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setSelectedNeed(null);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                >
                  حذف
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>

        {/* Action Dialog */}
        <ResponsiveDialog
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
          title="اقدام نسبت به نیاز"
          description="وضعیت نیاز را بروزرسانی کنید"
        >
          <Form {...actionForm}>
            <form onSubmit={actionForm.handleSubmit(onActionSubmit)} className="space-y-4">
              <FormField
                control={actionForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت جدید</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب وضعیت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50 shadow-md">
                        <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                        <SelectItem value="in-progress">در حال اجرا</SelectItem>
                        <SelectItem value="completed">تکمیل شده</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={actionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات اقدام</FormLabel>
                    <FormControl>
                      <Textarea placeholder="توضیحات انجام شده را بنویسید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>آپلود فایل</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setActionFiles(files);
                    }}
                  />
                  {actionFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {actionFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">ثبت اقدام</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsActionDialogOpen(false);
                    actionForm.reset();
                    setActionFiles([]);
                  }}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="حذف نیاز"
          description="آیا از حذف این نیاز اطمینان دارید؟ این عمل قابل بازگشت نیست."
          confirmText="حذف"
          cancelText="انصراف"
          onConfirm={handleDelete}
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default Needs;