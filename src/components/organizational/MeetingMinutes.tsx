import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Users, CheckSquare, Archive, Plus, X, Edit, Upload, Mic, Download, Settings, Search, List, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';
import type { Meeting } from '@/types';
import { MeetingTextEditor } from './MeetingTextEditor';
import { MeetingFileUploader } from './MeetingFileUploader';
import { MeetingAudioRecorder } from './MeetingAudioRecorder';
import { MeetingResolutionsManager } from './MeetingResolutionsManager';
import { MeetingTrackingDashboard } from './MeetingTrackingDashboard';
import { MeetingAgendaCreator } from './MeetingAgendaCreator';

interface MeetingMinutesProps {
  organizationName: string;
}

const MeetingMinutes: React.FC<MeetingMinutesProps> = ({ organizationName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeModal, setActiveModal] = useState<'text' | 'files' | 'audio' | 'resolutions' | 'agenda' | null>(null);
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: null as Date | null,
    meetingType: '',
    participants: [''],
    description: ''
  });

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      console.log('🔄 Loading meetings for organization:', organizationName);
      await meetingService.loadFromStorage();
      const orgKey = getOrganizationKey(organizationName);
      const orgMeetings = await meetingService.getMeetings(orgKey);
      console.log('📊 Loaded meetings:', orgMeetings.length);
      setMeetings(orgMeetings);
    } catch (error) {
      console.error('❌ Error loading meetings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری جلسات',
        variant: 'destructive'
      });
    }
  };

  const getOrganizationKey = (orgName: string): Meeting['organization'] => {
    console.log('🔍 Getting organization key for:', orgName);
    const orgMap: Record<string, Meeting['organization']> = {
      'خادم خلق': 'Association',
      'ورید هلث': 'Varid',
      'فرانگران': 'Frangaran', 
      'انجمن تولیدکنندگان': 'Association',
      'اتاق بازرگانی': 'Chamber'
    };
    const result = orgMap[orgName] || 'Association';
    console.log('✅ Mapped to organization key:', result);
    return result;
  };

  const handleCreateMeeting = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'خطا',
        description: 'عنوان جلسه الزامی است',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.meetingType) {
      toast({
        title: 'خطا', 
        description: 'نوع جلسه الزامی است',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const organizationKey = getOrganizationKey(organizationName);
      const meeting = await meetingService.createMeeting(formData.title, organizationKey);
      
      // Reset form
      setFormData({
        title: '',
        date: null,
        meetingType: '',
        participants: [''],
        description: ''
      });
      
      setIsCreateModalOpen(false);
      await loadMeetings();
      
      toast({
        title: 'موفقیت',
        description: 'جلسه با موفقیت ایجاد شد'
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ایجاد جلسه',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...formData.participants];
    newParticipants[index] = value;
    setFormData({ ...formData, participants: newParticipants });
  };

  const addParticipant = () => {
    setFormData({ ...formData, participants: [...formData.participants, ''] });
  };

  const removeParticipant = (index: number) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({ ...formData, participants: newParticipants });
  };

  // Empty state - no hardcoded test data
  const meetingMinutes: any[] = [];

  // Empty state - no hardcoded test data
  const resolutions: any[] = [];

  const getStatusBadge = (status: string) => {
    const variants = {
      'پیش‌نویس': { variant: 'outline' as const },
      'تصویب شده': { variant: 'default' as const },
      'آرشیو': { variant: 'secondary' as const },
      'درحال اجرا': { variant: 'secondary' as const },
      'معوق': { variant: 'destructive' as const },
      'تکمیل شده': { variant: 'default' as const }
    };
    return variants[status] || variants['پیش‌نویس'];
  };

  const getMeetingTypeColor = (type: string) => {
    const colors = {
      'هیئت مدیره': 'text-red-600',
      'کمیته': 'text-blue-600',
      'عادی': 'text-emerald-600',
      'فوق‌العاده': 'text-orange-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  const getMinutesStatusBadge = (status: Meeting['minutes_status']) => {
    const variants = {
      draft: 'secondary',
      completed: 'default',
      approved: 'default'
    } as const;

    const labels = {
      draft: 'پیش‌نویس',
      completed: 'تکمیل شده',
      approved: 'تایید شده'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const openModal = (meeting: Meeting, modalType: typeof activeModal) => {
    setSelectedMeeting(meeting);
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setSelectedMeeting(null);
    setActiveModal(null);
  };

  const handleModalUpdate = () => {
    loadMeetings();
  };

  const handleImportExport = (action: 'import' | 'export') => {
    if (action === 'import') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.csv,.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          toast({
            title: 'واردات فایل',
            description: `فایل ${file.name} انتخاب شد`,
          });
        }
      };
      input.click();
    } else {
      const dataStr = JSON.stringify(meetings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meetings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'خروجی فایل',
        description: 'فایل با موفقیت دانلود شد',
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'template':
        toast({
          title: 'قالب جلسه',
          description: 'قالب‌های آماده جلسه',
        });
        break;
      case 'agenda':
        setIsAgendaModalOpen(true);
        break;
      case 'tracking':
        // Switch to tracking tab
        break;
    }
  };

  // Filter meetings based on search
  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">مدیریت صورت‌جلسات</h1>
            <p className="text-muted-foreground">{organizationName} - ثبت جلسات، مصوبات و پیگیری اجرا</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleImportExport('import')}>
            <Upload className="w-4 h-4 ml-2" />
            واردات
          </Button>
          <Button variant="outline" onClick={() => handleImportExport('export')}>
            <Download className="w-4 h-4 ml-2" />
            خروجی
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            ثبت جلسه جدید
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-medium">جلسه جدید</span>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('template')}>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium">قالب جلسه</span>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('agenda')}>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <List className="h-5 w-5 text-green-600" />
            <span className="font-medium">دستور جلسه</span>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('tracking')}>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="font-medium">پیگیری</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meetings" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="meetings">تقویم جلسات</TabsTrigger>
          <TabsTrigger value="minutes">صورت‌جلسات</TabsTrigger>
          <TabsTrigger value="resolutions">مصوبات</TabsTrigger>
          <TabsTrigger value="tracking">پیگیری اجرا</TabsTrigger>
          <TabsTrigger value="archive">آرشیو</TabsTrigger>
        </TabsList>

        {/* Meeting Calendar */}
        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                تقویم جلسات برگزارشده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 border-2 border-dashed rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>تقویم جلسات</p>
                  <p className="text-sm">نمایش تاریخ و زمان جلسات برگزارشده و آینده</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meeting Minutes List */}
        <TabsContent value="minutes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>جستجو در صورت‌جلسات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو بر اساس عنوان، تاریخ یا نوع جلسه..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardContent>
          </Card>

          {filteredMeetings.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium">هیچ صورت‌جلسه‌ای وجود ندارد</h3>
                  <p className="text-muted-foreground mt-2">
                    برای شروع، اولین جلسه خود را ایجاد کنید
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    ایجاد جلسه جدید
                  </Button>
                  <Button variant="outline" onClick={() => handleImportExport('import')}>
                    <Upload className="h-4 w-4 mr-2" />
                    واردات از فایل
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{meeting.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{meeting.organization}</Badge>
                      {getMinutesStatusBadge(meeting.minutes_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1 mb-4">
                    <p>📅 {new Date(meeting.date).toLocaleDateString('fa-IR')}</p>
                    <p>👥 {meeting.participants?.length || 0} شرکت‌کننده</p>
                    <p>📋 {meeting.resolutions?.length || 0} مصوبه</p>
                    <p>📎 {meeting.attachments?.length || 0} فایل ضمیمه</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(meeting, 'text')}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      ثبت/ویرایش متن صورت‌جلسه
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(meeting, 'files')}
                      className="flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      آپلود فایل/ضمائم
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(meeting, 'audio')}
                      className="flex items-center gap-1"
                    >
                      <Mic className="h-3 w-3" />
                      ضبط/آپلود صوت
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(meeting, 'resolutions')}
                      className="flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      مدیریت مصوبات
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => meetingService.downloadMinutes(meeting.id)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      دانلود صورت‌جلسه
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Modal Renderers */}
        {selectedMeeting && activeModal === 'text' && (
          <MeetingTextEditor
            meeting={selectedMeeting}
            isOpen={true}
            onClose={closeModal}
            onUpdate={handleModalUpdate}
          />
        )}
        
        {selectedMeeting && activeModal === 'files' && (
          <MeetingFileUploader
            meeting={selectedMeeting}
            isOpen={true}
            onClose={closeModal}
            onUpdate={handleModalUpdate}
          />
        )}
        
        {selectedMeeting && activeModal === 'audio' && (
          <MeetingAudioRecorder
            meeting={selectedMeeting}
            isOpen={true}
            onClose={closeModal}
            onUpdate={handleModalUpdate}
          />
        )}
        
        {selectedMeeting && activeModal === 'resolutions' && (
          <MeetingResolutionsManager
            meeting={selectedMeeting}
            isOpen={true}
            onClose={closeModal}
            onUpdate={handleModalUpdate}
          />
        )}

        {/* Agenda Creator Modal */}
        <MeetingAgendaCreator
          isOpen={isAgendaModalOpen}
          onClose={() => setIsAgendaModalOpen(false)}
          onSave={(agenda) => {
            toast({
              title: "دستور جلسه ذخیره شد",
              description: `دستور جلسه با ${agenda.length} موضوع ایجاد شد`,
            });
          }}
        />

        {/* Resolutions */}
        <TabsContent value="resolutions" className="space-y-6">
          <div className="grid gap-6">
            {resolutions.map((resolution) => (
              <Card key={resolution.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{resolution.resolutionText}</CardTitle>
                      <CardDescription>
                        جلسه: {resolution.meetingTitle}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadge(resolution.status).variant}>
                      {resolution.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">مسئول اجرا:</span>
                        <p className="font-medium">{resolution.responsiblePerson}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">مهلت اجرا:</span>
                        <p className="font-medium">{resolution.deadline}</p>
                      </div>
                    </div>
                    
                    {resolution.implementationNotes && (
                      <div>
                        <span className="text-sm text-muted-foreground">یادداشت اجرا:</span>
                        <p className="text-sm mt-1 p-2 bg-muted rounded">{resolution.implementationNotes}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">ویرایش یادداشت</Button>
                      <Button size="sm">بروزرسانی وضعیت</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Implementation Tracking */}
        <TabsContent value="tracking" className="space-y-6">
          <MeetingTrackingDashboard 
            resolutions={resolutions} 
            onUpdateResolution={(id, updates) => {
              toast({
                title: 'بروزرسانی مصوبه',
                description: 'وضعیت مصوبه با موفقیت بروزرسانی شد',
              });
            }}
          />
        </TabsContent>

        {/* Archive */}
        <TabsContent value="archive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                آرشیو قابل جستجو
              </CardTitle>
              <CardDescription>
                جستجو در تمامی صورت‌جلسات و پیوست‌های آرشیو شده
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="جستجو در آرشیو..." />
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>آرشیو جلسات و پیوست‌ها</p>
                  <p className="text-sm">امکان جستجوی پیشرفته در تمامی اسناد</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Meeting Modal */}
      <ResponsiveDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="ثبت جلسه جدید"
        description="اطلاعات جلسه جدید را وارد کنید"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان جلسه *</Label>
            <Input
              id="title"
              placeholder="عنوان جلسه را وارد کنید"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">تاریخ برگزاری</Label>
            <PersianDatePicker
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              placeholder="تاریخ برگزاری را انتخاب کنید"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingType">نوع جلسه *</Label>
            <Select value={formData.meetingType} onValueChange={(value) => setFormData({ ...formData, meetingType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="نوع جلسه را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="هیئت مدیره">هیئت مدیره</SelectItem>
                <SelectItem value="کمیته">کمیته</SelectItem>
                <SelectItem value="عادی">عادی</SelectItem>
                <SelectItem value="فوق‌العاده">فوق‌العاده</SelectItem>
                <SelectItem value="شورا">شورا</SelectItem>
                <SelectItem value="هماهنگی">هماهنگی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>شرکت‌کنندگان</Label>
            <div className="space-y-2">
              {formData.participants.map((participant, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="نام شرکت‌کننده"
                    value={participant}
                    onChange={(e) => handleParticipantChange(index, e.target.value)}
                    className="text-right flex-1"
                  />
                  {formData.participants.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeParticipant(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParticipant}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                افزودن شرکت‌کننده
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              placeholder="توضیحات جلسه (اختیاری)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-right"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(false)}
            disabled={isLoading}
          >
            لغو
          </Button>
          <Button onClick={handleCreateMeeting} disabled={isLoading}>
            {isLoading ? 'در حال ایجاد...' : 'ایجاد جلسه'}
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
};

export default MeetingMinutes;