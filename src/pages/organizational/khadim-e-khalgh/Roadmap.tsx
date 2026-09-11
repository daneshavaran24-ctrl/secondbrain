import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Target, Clock, AlertCircle, Users, DollarSign, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { formatJalali, getDaysUntilDue } from '@/lib/date-utils';

interface Campaign {
  id: number;
  title: string;
  description: string;
  type: 'campaign' | 'program' | 'project';
  status: 'in-progress' | 'planned' | 'completed';
  startDate: string;
  endDate: string;
  budget: string;
  targetBeneficiaries: number;
  progress: number;
  priority: 'high' | 'medium' | 'low';
  milestones: Array<{
    title: string;
    date: string;
    completed: boolean;
  }>;
}

const programSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  type: z.enum(['campaign', 'program', 'project'], {
    required_error: 'نوع برنامه را انتخاب کنید'
  }),
  status: z.enum(['in-progress', 'planned', 'completed'], {
    required_error: 'وضعیت برنامه را انتخاب کنید'
  }),
  priority: z.enum(['high', 'medium', 'low'], {
    required_error: 'اولویت را انتخاب کنید'
  }),
  startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
  endDate: z.string().min(1, 'تاریخ پایان الزامی است'),
  budget: z.string().min(1, 'بودجه الزامی است'),
  targetBeneficiaries: z.coerce.number().min(1, 'تعداد بهره‌مندان باید حداقل ۱ باشد'),
  progress: z.coerce.number().min(0).max(100, 'پیشرفت باید بین ۰ تا ۱۰۰ باشد').default(0),
  milestones: z.array(z.object({
    title: z.string().min(1, 'عنوان نقطه عطف الزامی است'),
    date: z.string().min(1, 'تاریخ الزامی است'),
    completed: z.boolean().default(false)
  })).default([])
});

type ProgramFormData = z.infer<typeof programSchema>;

const Roadmap = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'campaign',
      status: 'planned',
      priority: 'medium',
      startDate: '',
      endDate: '',
      budget: '',
      targetBeneficiaries: 1,
      progress: 0,
      milestones: []
    }
  });

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } = useFieldArray({
    control: form.control,
    name: 'milestones'
  });

  // Edit form
  const editForm = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'campaign',
      status: 'planned',
      priority: 'medium',
      startDate: '',
      endDate: '',
      budget: '',
      targetBeneficiaries: 1,
      progress: 0,
      milestones: []
    }
  });

  const { fields: editMilestoneFields, append: appendEditMilestone, remove: removeEditMilestone } = useFieldArray({
    control: editForm.control,
    name: 'milestones'
  });

  const onSubmit = (data: ProgramFormData) => {
    const newProgram: Campaign = {
      id: campaigns.length + 1,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      targetBeneficiaries: data.targetBeneficiaries,
      progress: data.progress,
      milestones: data.milestones.map(m => ({
        title: m.title || '',
        date: m.date || '', 
        completed: m.completed || false
      }))
    };
    
    setCampaigns(prev => [...prev, newProgram]);
    
    toast.success('برنامه جدید با موفقیت اضافه شد');
    form.reset();
    setIsDialogOpen(false);
  };

  // Load from localStorage on mount with migration
  React.useEffect(() => {
    const saved = localStorage.getItem('roadmap-programs');
    if (saved) {
      try {
        const loadedCampaigns = JSON.parse(saved);
        // Migrate old status values to new ones
        const migratedCampaigns = loadedCampaigns.map((campaign: any) => ({
          ...campaign,
          status: campaign.status === 'active' ? 'in-progress' 
                : campaign.status === 'upcoming' ? 'planned'
                : campaign.status === 'planning' ? 'planned'
                : campaign.status
        }));
        setCampaigns(migratedCampaigns);
      } catch (error) {
        console.error('Error loading saved programs:', error);
      }
    }
  }, []);

  // Save to localStorage whenever campaigns change
  React.useEffect(() => {
    localStorage.setItem('roadmap-programs', JSON.stringify(campaigns));
  }, [campaigns]);

  const addMilestone = () => {
    appendMilestone({
      title: '',
      date: '',
      completed: false
    });
  };

  const addEditMilestone = () => {
    appendEditMilestone({
      title: '',
      date: '',
      completed: false
    });
  };

  const onEditSubmit = (data: ProgramFormData) => {
    if (!selectedCampaign) return;
    
    const updatedCampaign: Campaign = {
      ...selectedCampaign,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      targetBeneficiaries: data.targetBeneficiaries,
      progress: data.status === 'completed' ? 100 : data.progress,
      milestones: data.milestones.map(m => ({
        title: m.title || '',
        date: m.date || '', 
        completed: m.completed || false
      }))
    };
    
    setCampaigns(prev => prev.map(c => 
      c.id === selectedCampaign.id ? updatedCampaign : c
    ));
    
    toast.success('برنامه با موفقیت ویرایش شد');
    setIsEditOpen(false);
    setSelectedCampaign(null);
    editForm.reset();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">در حال اجرا</Badge>;
      case 'planned':
        return <Badge className="bg-yellow-100 text-yellow-800">برنامه‌ریزی شده</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">تکمیل شده</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const updateCampaignStatus = (campaignId: number, newStatus: 'in-progress' | 'planned' | 'completed') => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { 
            ...campaign, 
            status: newStatus,
            // Set progress to 100% when completed
            progress: newStatus === 'completed' ? 100 : campaign.progress
          }
        : campaign
    ));
    toast.success('وضعیت برنامه با موفقیت به‌روزرسانی شد');
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">بالا</Badge>;
      case 'medium':
        return <Badge variant="secondary">متوسط</Badge>;
      case 'low':
        return <Badge variant="outline">پایین</Badge>;
      default:
        return <Badge variant="secondary">نامشخص</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return <Target className="h-5 w-5 text-purple-600" />;
      case 'program':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'project':
        return <Calendar className="h-5 w-5 text-green-600" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const CampaignCard = ({ campaign }: { campaign: any }) => (
    <Card className="glass-card hover-lift transition-elegant">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 mb-2">
            {getTypeIcon(campaign.type)}
            <CardTitle className="text-xl">{campaign.title}</CardTitle>
          </div>
          <div className="flex gap-2 items-center">
            <Select 
              value={campaign.status} 
              onValueChange={(value: 'in-progress' | 'planned' | 'completed') => updateCampaignStatus(campaign.id, value)}
            >
              <SelectTrigger className="w-auto min-w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                <SelectItem value="in-progress">در حال اجرا</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
              </SelectContent>
            </Select>
            {getPriorityBadge(campaign.priority)}
          </div>
        </div>
        <CardDescription>{campaign.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>پیشرفت کلی:</span>
              <span>{campaign.progress}%</span>
            </div>
            <Progress value={campaign.progress} className="h-2" />
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{campaign.startDate} - {campaign.endDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{campaign.targetBeneficiaries} نفر هدف</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{campaign.budget} تومان</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="capitalize">{campaign.type}</span>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">نقاط عطف:</h4>
            <div className="space-y-2">
              {campaign.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2 rounded border ${
                    milestone.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${
                    milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <span className={`text-sm ${
                      milestone.completed ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {milestone.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {milestone.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedCampaign(campaign);
                setIsDetailsOpen(true);
              }}
            >
              مشاهده جزئیات
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedCampaign(campaign);
                editForm.reset({
                  title: campaign.title,
                  description: campaign.description,
                  type: campaign.type,
                  status: campaign.status,
                  priority: campaign.priority,
                  startDate: campaign.startDate,
                  endDate: campaign.endDate,
                  budget: campaign.budget,
                  targetBeneficiaries: campaign.targetBeneficiaries,
                  progress: campaign.progress,
                  milestones: campaign.milestones
                });
                setIsEditOpen(true);
              }}
            >
              ویرایش برنامه
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const inProgressCampaigns = campaigns.filter(c => c.status === 'in-progress');
  const plannedCampaigns = campaigns.filter(c => c.status === 'planned');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-7xl mx-auto spacing-relaxed">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">برنامه‌های در جریان و آتی</h1>
              <p className="text-muted-foreground">مدیریت برنامه‌ها و پویش‌های آینده</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                برنامه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ایجاد برنامه جدید</DialogTitle>
                <DialogDescription>
                  برنامه یا پویش جدید را تعریف کنید
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان برنامه</FormLabel>
                          <FormControl>
                            <Input placeholder="عنوان برنامه را وارد کنید" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Type */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع برنامه</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="نوع برنامه را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="campaign">پویش</SelectItem>
                              <SelectItem value="program">برنامه</SelectItem>
                              <SelectItem value="project">پروژه</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وضعیت</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="وضعیت را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                              <SelectItem value="in-progress">در حال اجرا</SelectItem>
                              <SelectItem value="completed">تکمیل شده</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Priority */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اولویت</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اولویت را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">پایین</SelectItem>
                              <SelectItem value="medium">متوسط</SelectItem>
                              <SelectItem value="high">بالا</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Start Date */}
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاریخ شروع</FormLabel>
                          <FormControl>
                            <Input placeholder="۱۴۰۳/۱۰/۰۱" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* End Date */}
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاریخ پایان</FormLabel>
                          <FormControl>
                            <Input placeholder="۱۴۰۳/۱۲/۳۰" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Budget */}
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>بودجه (تومان)</FormLabel>
                          <FormControl>
                            <Input placeholder="۵۰,۰۰۰,۰۰۰" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Beneficiaries */}
                    <FormField
                      control={form.control}
                      name="targetBeneficiaries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تعداد بهره‌مندان هدف</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="توضیحات کامل برنامه را وارد کنید..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Progress */}
                  <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>پیشرفت اولیه (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            min="0" 
                            max="100" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Milestones */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">نقاط عطف</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                        <Plus className="h-4 w-4 ml-2" />
                        افزودن نقطه عطف
                      </Button>
                    </div>
                    
                    {milestoneFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>عنوان</FormLabel>
                              <FormControl>
                                <Input placeholder="عنوان نقطه عطف" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.date`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>تاریخ</FormLabel>
                              <FormControl>
                                <Input placeholder="۱۴۰۳/۱۰/۰۱" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      لغو
                    </Button>
                    <Button type="submit" className="flex-1">
                      ایجاد برنامه
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{inProgressCampaigns.length}</div>
              <p className="text-sm text-muted-foreground">در حال اجرا</p>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{plannedCampaigns.length}</div>
              <p className="text-sm text-muted-foreground">برنامه‌ریزی شده</p>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{completedCampaigns.length}</div>
              <p className="text-sm text-muted-foreground">تکمیل شده</p>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {campaigns.reduce((sum, c) => sum + c.targetBeneficiaries, 0)}
              </div>
              <p className="text-sm text-muted-foreground">کل بهره‌مندان هدف</p>
            </CardContent>
          </Card>
        </div>

        {/* Programs Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">همه برنامه‌ها</TabsTrigger>
            <TabsTrigger value="in-progress">در حال اجرا</TabsTrigger>
            <TabsTrigger value="planned">برنامه‌ریزی شده</TabsTrigger>
            <TabsTrigger value="completed">تکمیل شده</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6">
              {campaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            <div className="grid gap-6">
              {inProgressCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="planned" className="space-y-6">
            <div className="grid gap-6">
              {plannedCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6">
              {completedCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dynamic Reminders */}
        <DynamicReminders campaigns={campaigns} />

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات برنامه</DialogTitle>
              <DialogDescription>
                مشاهده تمامی اطلاعات برنامه
              </DialogDescription>
            </DialogHeader>
            {selectedCampaign && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">عنوان</h4>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.title}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">نوع</h4>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedCampaign.type)}
                      <span className="text-sm capitalize">{selectedCampaign.type}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">وضعیت</h4>
                    {getStatusBadge(selectedCampaign.status)}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">اولویت</h4>
                    {getPriorityBadge(selectedCampaign.priority)}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">تاریخ شروع</h4>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.startDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">تاریخ پایان</h4>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.endDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">بودجه</h4>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.budget} تومان</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">تعداد بهره‌مندان</h4>
                    <p className="text-sm text-muted-foreground">{selectedCampaign.targetBeneficiaries} نفر</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">توضیحات</h4>
                  <p className="text-sm text-muted-foreground">{selectedCampaign.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">پیشرفت</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>درصد تکمیل:</span>
                      <span>{selectedCampaign.progress}%</span>
                    </div>
                    <Progress value={selectedCampaign.progress} className="h-2" />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">نقاط عطف</h4>
                  <div className="space-y-2">
                    {selectedCampaign.milestones.map((milestone, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded border ${
                          milestone.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${
                          milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${
                            milestone.completed ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {milestone.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {milestone.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailsOpen(false)}
                    className="flex-1"
                  >
                    بستن
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویرایش برنامه</DialogTitle>
              <DialogDescription>
                تغییر اطلاعات برنامه
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان برنامه</FormLabel>
                        <FormControl>
                          <Input placeholder="عنوان برنامه را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type */}
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع برنامه</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="نوع برنامه را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="campaign">پویش</SelectItem>
                            <SelectItem value="program">برنامه</SelectItem>
                            <SelectItem value="project">پروژه</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وضعیت</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="وضعیت را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planned">برنامه‌ریزی شده</SelectItem>
                            <SelectItem value="in-progress">در حال اجرا</SelectItem>
                            <SelectItem value="completed">تکمیل شده</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Priority */}
                  <FormField
                    control={editForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اولویت</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اولویت را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">پایین</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="high">بالا</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Date */}
                  <FormField
                    control={editForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ شروع</FormLabel>
                        <FormControl>
                          <Input placeholder="۱۴۰۳/۱۰/۰۱" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
                  <FormField
                    control={editForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ پایان</FormLabel>
                        <FormControl>
                          <Input placeholder="۱۴۰۳/۱۲/۳۰" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget */}
                  <FormField
                    control={editForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>بودجه (تومان)</FormLabel>
                        <FormControl>
                          <Input placeholder="۵۰,۰۰۰,۰۰۰" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Target Beneficiaries */}
                  <FormField
                    control={editForm.control}
                    name="targetBeneficiaries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تعداد بهره‌مندان هدف</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="توضیحات کامل برنامه را وارد کنید..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Progress */}
                <FormField
                  control={editForm.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>پیشرفت (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          min="0" 
                          max="100" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Milestones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">نقاط عطف</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addEditMilestone}>
                      <Plus className="h-4 w-4 ml-2" />
                      افزودن نقطه عطف
                    </Button>
                  </div>
                  
                  {editMilestoneFields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                      <FormField
                        control={editForm.control}
                        name={`milestones.${index}.title`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>عنوان</FormLabel>
                            <FormControl>
                              <Input placeholder="عنوان نقطه عطف" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name={`milestones.${index}.date`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>تاریخ</FormLabel>
                            <FormControl>
                              <Input placeholder="۱۴۰۳/۱۰/۰۱" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name={`milestones.${index}.completed`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="w-4 h-4"
                              />
                            </FormControl>
                            <FormLabel className="text-sm">تکمیل شده</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEditMilestone(index)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditOpen(false);
                      setSelectedCampaign(null);
                      editForm.reset();
                    }}
                    className="flex-1"
                  >
                    لغو
                  </Button>
                  <Button type="submit" className="flex-1">
                    ذخیره تغییرات
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
  };

// DynamicReminders Component
const DynamicReminders = ({ campaigns }: { campaigns: Campaign[] }) => {
  const reminders = useMemo(() => {
    const currentDate = new Date();
    const allReminders: Array<{
      id: string;
      title: string;
      description: string;
      date: Date;
      urgency: 'high' | 'medium' | 'low';
      type: 'start' | 'end' | 'milestone';
      campaignTitle: string;
    }> = [];

    campaigns.forEach((campaign) => {
      const startDate = new Date(campaign.startDate);
      const endDate = new Date(campaign.endDate);
      
      // Check for upcoming campaign starts (planned campaigns)
      if (campaign.status === 'planned') {
        const daysUntilStart = Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilStart > 0 && daysUntilStart <= 14) {
          allReminders.push({
            id: `start-${campaign.id}`,
            title: `شروع ${campaign.title}`,
            description: daysUntilStart <= 3 ? 'آماده‌سازی نهایی' : `تا ${daysUntilStart} روز دیگر`,
            date: startDate,
            urgency: daysUntilStart <= 3 ? 'high' : daysUntilStart <= 7 ? 'medium' : 'low',
            type: 'start',
            campaignTitle: campaign.title
          });
        }
      }

      // Check for upcoming campaign ends (in-progress campaigns)
      if (campaign.status === 'in-progress') {
        const daysUntilEnd = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilEnd > 0 && daysUntilEnd <= 14) {
          allReminders.push({
            id: `end-${campaign.id}`,
            title: `پایان ${campaign.title}`,
            description: daysUntilEnd <= 3 ? 'آماده‌سازی گزارش نهایی' : `تا ${daysUntilEnd} روز دیگر`,
            date: endDate,
            urgency: daysUntilEnd <= 3 ? 'high' : daysUntilEnd <= 7 ? 'medium' : 'low',
            type: 'end',
            campaignTitle: campaign.title
          });
        }
      }

      // Check for upcoming milestones
      campaign.milestones.forEach((milestone, idx) => {
        if (!milestone.completed) {
          const milestoneDate = new Date(milestone.date);
          const daysUntilMilestone = Math.ceil((milestoneDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilMilestone > 0 && daysUntilMilestone <= 7) {
            allReminders.push({
              id: `milestone-${campaign.id}-${idx}`,
              title: milestone.title,
              description: `${campaign.title} - ${daysUntilMilestone <= 1 ? 'امروز/فردا' : `تا ${daysUntilMilestone} روز دیگر`}`,
              date: milestoneDate,
              urgency: daysUntilMilestone <= 1 ? 'high' : daysUntilMilestone <= 3 ? 'medium' : 'low',
              type: 'milestone',
              campaignTitle: campaign.title
            });
          }
        }
      });
    });

    // Sort by urgency and date
    return allReminders.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.date.getTime() - b.date.getTime();
    }).slice(0, 5); // Show max 5 reminders
  }, [campaigns]);

  const getReminderId = (reminder: any) => {
    const urgencyColors = {
      high: { bg: 'bg-red-50', border: 'border-red-500', icon: 'text-red-600' },
      medium: { bg: 'bg-orange-50', border: 'border-orange-500', icon: 'text-orange-600' },
      low: { bg: 'bg-blue-50', border: 'border-blue-500', icon: 'text-blue-600' }
    };
    return urgencyColors[reminder.urgency];
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'start':
        return Clock;
      case 'end':
        return AlertCircle;
      case 'milestone':
        return Target;
      default:
        return Clock;
    }
  };

  return (
    <Card className="glass-card mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          یادآورهای مهم
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">در حال حاضر یادآوری مهمی وجود ندارد</p>
            <p className="text-sm text-muted-foreground mt-1">برنامه‌های جدید ایجاد کنید تا یادآورهای مرتبط نمایش داده شود</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const colors = getReminderId(reminder);
              const IconComponent = getIconForType(reminder.type);
              return (
                <div key={reminder.id} className={`flex items-center gap-3 p-3 ${colors.bg} rounded border-r-4 ${colors.border}`}>
                  <IconComponent className={`h-4 w-4 ${colors.icon}`} />
                  <div className="text-sm">
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-muted-foreground">{reminder.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Roadmap;