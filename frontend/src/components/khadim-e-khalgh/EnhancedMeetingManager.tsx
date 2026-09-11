import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Users, CheckSquare, Archive, Plus, X, Edit, Upload, Mic, Download, Settings, Video, Play, Clock, Search } from 'lucide-react';
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
import { MeetingTextEditor } from '@/components/organizational/MeetingTextEditor';
import { MeetingFileUploader } from '@/components/organizational/MeetingFileUploader';
import { MeetingAudioRecorder } from '@/components/organizational/MeetingAudioRecorder';
import { MeetingResolutionsManager } from '@/components/organizational/MeetingResolutionsManager';
import { MeetingRecorder } from '@/components/meetings/MeetingRecorder';
import { motion, AnimatePresence } from 'framer-motion';

const EnhancedMeetingManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeModal, setActiveModal] = useState<'text' | 'files' | 'audio' | 'resolutions' | null>(null);
  const [currentView, setCurrentView] = useState<'recorder' | 'calendar' | 'list'>('list');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: null as Date | null,
    meetingType: '',
    participants: [''],
    description: ''
  });

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMeetings, setCalendarMeetings] = useState<Meeting[]>([]);

  // Load meetings on component mount
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      await meetingService.loadFromStorage();
      const orgMeetings = await meetingService.getMeetings('Association');
      setMeetings(orgMeetings);
      setCalendarMeetings(orgMeetings);
    } catch (error) {
      console.error('Error loading meetings:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری جلسات',
        variant: 'destructive'
      });
    }
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
      const meeting = await meetingService.createMeeting(formData.title, 'Association');
      
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

  const handleMeetingCreated = () => {
    loadMeetings();
    toast({
      title: 'موفقیت',
      description: 'جلسه جدید ایجاد شد'
    });
  };

  // Filter meetings based on search
  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get meetings for selected date
  const getDayMeetings = (date: Date) => {
    return calendarMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return (
        meetingDate.getFullYear() === date.getFullYear() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getDate() === date.getDate()
      );
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayMeetings = getDayMeetings(currentDate);
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === selectedDate.getMonth(),
        meetings: dayMeetings,
        isToday: 
          currentDate.getFullYear() === new Date().getFullYear() &&
          currentDate.getMonth() === new Date().getMonth() &&
          currentDate.getDate() === new Date().getDate()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-subtle min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">مدیریت صورت‌جلسات خادم خلق</h1>
            <p className="text-muted-foreground">ضبط هوشمند، ثبت جلسات، مصوبات و پیگیری اجرا</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={currentView === 'recorder' ? 'default' : 'outline'}
            onClick={() => setCurrentView('recorder')}
            className="flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            ضبط جلسه
          </Button>
          <Button 
            variant={currentView === 'calendar' ? 'default' : 'outline'}
            onClick={() => setCurrentView('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            تقویم
          </Button>
          <Button 
            variant={currentView === 'list' ? 'default' : 'outline'}
            onClick={() => setCurrentView('list')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            فهرست
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 ml-2" />
            جلسه جدید
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'recorder' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  ضبط جلسه هوشمند
                </CardTitle>
                <CardDescription>
                  ضبط همزمان تصویر و صوت با پردازش خودکار متن و استخراج مصوبات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MeetingRecorder onMeetingCreated={handleMeetingCreated} />
              </CardContent>
            </Card>

            {/* Recent Meetings Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  جلسات اخیر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {meetings.slice(0, 3).map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                      <div>
                        <h4 className="font-medium">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meeting.date).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {getMinutesStatusBadge(meeting.minutes_status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    تقویم جلسات
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    >
                      ماه قبل
                    </Button>
                    <span className="font-semibold text-lg">
                      {selectedDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    >
                      ماه بعد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
                    <div key={day} className="text-center font-semibold p-2 text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className={`
                        p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                        ${day.isCurrentMonth ? 'bg-background border-border' : 'bg-muted/30 border-muted'}
                        ${day.isToday ? 'ring-2 ring-primary border-primary' : ''}
                        ${day.meetings.length > 0 ? 'bg-primary/5 border-primary/30' : ''}
                      `}
                      onClick={() => {
                        if (day.meetings.length > 0) {
                          // Show meetings for this day
                          console.log('Meetings for', day.date, ':', day.meetings);
                        }
                      }}
                    >
                      <div className={`text-sm ${day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {day.date.getDate()}
                      </div>
                      {day.meetings.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {day.meetings.slice(0, 2).map((meeting) => (
                            <div
                              key={meeting.id}
                              className="text-xs p-1 bg-primary/20 text-primary rounded truncate"
                              title={meeting.title}
                            >
                              {meeting.title}
                            </div>
                          ))}
                          {day.meetings.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{day.meetings.length - 2} جلسه دیگر
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس عنوان، تاریخ یا نوع جلسه..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Meetings List */}
            <div className="grid gap-6">
              {filteredMeetings.map((meeting) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{meeting.organization}</Badge>
                          {getMinutesStatusBadge(meeting.minutes_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1 mb-4">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(meeting.date).toLocaleDateString('fa-IR')}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {meeting.participants?.length || 0} شرکت‌کننده
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          {meeting.resolutions?.length || 0} مصوبه
                        </p>
                        <p className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {meeting.attachments?.length || 0} فایل ضمیمه
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(meeting, 'text')}
                          className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Edit className="h-3 w-3" />
                          ثبت/ویرایش متن
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(meeting, 'files')}
                          className="flex items-center gap-1 hover:bg-secondary hover:text-secondary-foreground"
                        >
                          <Upload className="h-3 w-3" />
                          آپلود فایل
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(meeting, 'audio')}
                          className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground"
                        >
                          <Mic className="h-3 w-3" />
                          ضبط صوت
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
                          دانلود
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Meeting Modal */}
      <ResponsiveDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="ایجاد جلسه جدید"
        description="اطلاعات جلسه را وارد کنید"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان جلسه</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="عنوان جلسه را وارد کنید..."
            />
          </div>

          <div>
            <Label htmlFor="date">تاریخ برگزاری</Label>
            <PersianDatePicker
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
            />
          </div>

          <div>
            <Label htmlFor="type">نوع جلسه</Label>
            <Select
              value={formData.meetingType}
              onValueChange={(value) => setFormData({ ...formData, meetingType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع جلسه را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="هیئت مدیره">هیئت مدیره</SelectItem>
                <SelectItem value="کمیته">کمیته</SelectItem>
                <SelectItem value="عادی">عادی</SelectItem>
                <SelectItem value="فوق‌العاده">فوق‌العاده</SelectItem>
                <SelectItem value="هماهنگی">هماهنگی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>شرکت‌کنندگان</Label>
            {formData.participants.map((participant, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <Input
                  value={participant}
                  onChange={(e) => handleParticipantChange(index, e.target.value)}
                  placeholder="نام شرکت‌کننده..."
                />
                {formData.participants.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeParticipant(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addParticipant} className="mt-2">
              <Plus className="h-4 w-4 ml-2" />
              افزودن شرکت‌کننده
            </Button>
          </div>

          <div>
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات اضافی..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreateMeeting} disabled={isLoading}>
              {isLoading ? 'در حال ایجاد...' : 'ایجاد جلسه'}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

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
    </div>
  );
};

export default EnhancedMeetingManager;