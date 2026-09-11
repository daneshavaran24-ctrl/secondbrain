import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { meetingService } from '@/services/meetingService';
import { MeetingTextEditor } from '@/components/organizational/MeetingTextEditor';
import { MeetingAudioRecorder } from '@/components/organizational/MeetingAudioRecorder';
import { MeetingFileUploader } from '@/components/organizational/MeetingFileUploader';
import { MeetingResolutionsManager } from '@/components/organizational/MeetingResolutionsManager';
import { MeetingAgendaCreator } from '@/components/organizational/MeetingAgendaCreator';
import { FileText, Mic, Upload, Target, Calendar, Download, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Meeting } from '@/types';

export const ProfessionalMeetingMinutes: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeModal, setActiveModal] = useState<'text' | 'audio' | 'files' | 'resolutions' | 'agenda' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await meetingService.getMeetings();
      setMeetings(data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری جلسات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalOpen = (meeting: Meeting, modalType: typeof activeModal) => {
    setSelectedMeeting(meeting);
    setActiveModal(modalType);
  };

  const handleModalClose = () => {
    setSelectedMeeting(null);
    setActiveModal(null);
    loadMeetings();
  };

  const getStatusBadge = (status: Meeting['minutes_status']) => {
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

  const downloadMinutes = async (meetingId: string) => {
    try {
      await meetingService.downloadMinutes(meetingId);
      toast({
        title: 'موفقیت',
        description: 'صورت‌جلسه دانلود شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در دانلود صورت‌جلسه',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {meetings.length === 0 ? (
          <Card>
            <CardContent className="text-center p-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">هنوز جلسه‌ای ثبت نشده است</p>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(meeting.date).toLocaleDateString('fa-IR')} • {meeting.duration} دقیقه
                    </p>
                  </div>
                  {getStatusBadge(meeting.minutes_status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModalOpen(meeting, 'text')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    ویرایش متن
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModalOpen(meeting, 'audio')}
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    ضبط صوت
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModalOpen(meeting, 'files')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    ضمائم
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModalOpen(meeting, 'resolutions')}
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    مصوبات
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModalOpen(meeting, 'agenda')}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    دستور جلسه
                  </Button>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>شرکت‌کنندگان: {meeting.participants.length}</span>
                    <span>مصوبات: {meeting.resolutions?.length || 0}</span>
                    <span>ضمائم: {meeting.attachments?.length || 0}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadMinutes(meeting.id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    دانلود
                  </Button>
                </div>
                
                {meeting.audio_url && (
                  <div className="mt-3 p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4" />
                      <span>ضبط صوتی موجود</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {selectedMeeting && activeModal === 'text' && (
        <MeetingTextEditor
          meeting={selectedMeeting}
          isOpen={true}
          onClose={handleModalClose}
          onUpdate={loadMeetings}
        />
      )}

      {selectedMeeting && activeModal === 'audio' && (
        <MeetingAudioRecorder
          meeting={selectedMeeting}
          isOpen={true}
          onClose={handleModalClose}
          onUpdate={loadMeetings}
        />
      )}

      {selectedMeeting && activeModal === 'files' && (
        <MeetingFileUploader
          meeting={selectedMeeting}
          isOpen={true}
          onClose={handleModalClose}
          onUpdate={loadMeetings}
        />
      )}

      {selectedMeeting && activeModal === 'resolutions' && (
        <MeetingResolutionsManager
          meeting={selectedMeeting}
          isOpen={true}
          onClose={handleModalClose}
          onUpdate={loadMeetings}
        />
      )}

      {selectedMeeting && activeModal === 'agenda' && (
        <MeetingAgendaCreator
          meeting={{
            id: selectedMeeting.id,
            title: selectedMeeting.title,
            date: selectedMeeting.date,
            startTime: selectedMeeting.date,
            endTime: new Date(new Date(selectedMeeting.date).getTime() + (selectedMeeting.duration * 60000)).toISOString(),
            location: 'محل برگزاری جلسه',
            participants: selectedMeeting.participants.map(p => p.name)
          }}
          isOpen={true}
          onClose={handleModalClose}
          onSave={(agenda) => {
            toast({
              title: 'دستور جلسه ذخیره شد',
              description: `دستور جلسه با ${agenda.length} موضوع ایجاد شد`,
            });
            handleModalClose();
          }}
        />
      )}
    </div>
  );
};