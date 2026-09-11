import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, FileText, Download, Play, ChevronDown, Trash2, MapPin } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { meetingService } from '@/services/meetingService';
import { Meeting } from '@/types';
import { motion } from 'framer-motion';
import { useOrganizations } from '@/services/organizationService';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { MeetingUploadButton } from '@/components/meetings/MeetingUploadButton';
import { toast } from 'sonner';

interface MeetingListProps {
  refreshTrigger?: number;
}

export const MeetingList: React.FC<MeetingListProps> = ({ refreshTrigger }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Meeting['organization'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  
  const { organizations: dynamicOrganizations, isLoading: isLoadingOrgs } = useOrganizations();

  // Add "all organizations" option to the dynamic list
  const organizations = [
    { value: 'all', label: 'همه سازمان‌ها', icon: '📋' },
    ...dynamicOrganizations
  ];

  useEffect(() => {
    loadMeetings();
  }, [selectedOrg, refreshTrigger]);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      await meetingService.loadFromStorage();
      const allMeetings = await meetingService.getMeetings();
      
      const filteredMeetings = selectedOrg === 'all' 
        ? allMeetings 
        : allMeetings.filter(m => m.organization === selectedOrg);
      
      // Sort by date (newest first)
      filteredMeetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setMeetings(filteredMeetings);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMinutes = async (meeting: Meeting, template: 'formal' | 'action' | 'executive' = 'formal') => {
    try {
      const minutes = await meetingService.generateMinutes(meeting.id, template);
      
      const templateNames = {
        formal: 'رسمی',
        action: 'اقدامات',
        executive: 'اجرایی'
      };
      
      // Create and download text file
      const blob = new Blob([minutes], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `صورت-جلسه-${templateNames[template]}-${meeting.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to generate minutes:', error);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    
    try {
      await meetingService.deleteMeeting(meetingToDelete.id);
      await loadMeetings(); // Refresh the list
      toast.success('جلسه با موفقیت حذف شد');
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      toast.error('خطا در حذف جلسه');
    } finally {
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
    }
  };

  const openDeleteDialog = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  };

  const getOrganizationInfo = (org: Meeting['organization']) => {
    const orgInfo = organizations.find(o => o.value === org);
    return orgInfo || { icon: '📋', label: org };
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} دقیقه`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} ساعت${remainingMinutes > 0 ? ` و ${remainingMinutes} دقیقه` : ''}`;
  };

  return (
    <Card className="bg-glass border-elegant">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          جلسات اخیر
        </CardTitle>
        
        <Select 
          value={selectedOrg} 
          onValueChange={(value: Meeting['organization'] | 'all') => setSelectedOrg(value)}
        >
          <SelectTrigger className="bg-background/50 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {organizations.map(org => (
              <SelectItem key={org.value} value={org.value}>
                <span className="flex items-center gap-2">
                  <span>{org.icon}</span>
                  {org.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-muted-foreground">در حال بارگذاری...</div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">هنوز جلسه‌ای ثبت نشده است</p>
            <p className="text-sm text-muted-foreground mt-2">
              اولین جلسه خود را ضبط کنید
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting, index) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="bg-background/30 border-muted hover:border-primary/20 transition-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{getOrganizationInfo(meeting.organization).icon}</span>
                          <h3 className="font-medium text-foreground">{meeting.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getOrganizationInfo(meeting.organization).label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(meeting.date).toLocaleDateString('fa-IR')}
                          </span>
                          
                          {meeting.duration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(meeting.duration)}
                            </span>
                          )}
                          
                          {meeting.participants?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.participants.length} نفر
                            </span>
                          )}
                          
                          {meeting.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{meeting.location.place_name || meeting.location.address}</span>
                              {meeting.location.type === 'map' && meeting.location.map_url && (
                                <a 
                                  href={meeting.location.map_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-xs mr-1"
                                >
                                  (نقشه)
                                </a>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {meeting.summary && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {meeting.summary}
                      </p>
                    )}

                    {meeting.action_items?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">وظایف ({meeting.action_items.length}):</p>
                        <div className="space-y-1">
                          {meeting.action_items.slice(0, 3).map((item, itemIndex) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                              <span className="text-muted-foreground">
                                {item.description} - {item.assignee}
                              </span>
                            </div>
                          ))}
                          {meeting.action_items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              و {meeting.action_items.length - 3} وظیفه دیگر...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            صورت جلسه
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="start">
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => handleDownloadMinutes(meeting, 'formal')}
                            >
                              📋 قالب رسمی
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => handleDownloadMinutes(meeting, 'action')}
                            >
                              🎯 قالب اقدامات
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full justify-start"
                              onClick={() => handleDownloadMinutes(meeting, 'executive')}
                            >
                              📊 قالب اجرایی
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {meeting.transcript && (
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 ml-1" />
                          متن کامل
                        </Button>
                      )}
                      
                      {(meeting.audio_url || meeting.video_url) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const mediaUrl = meeting.video_url || meeting.audio_url!;
                            
                            // Create media element based on type
                            const mediaElement = meeting.video_url ? 
                              document.createElement('video') : 
                              document.createElement('audio');
                            
                            mediaElement.controls = true;
                            mediaElement.style.maxWidth = '100%';
                            
                            if (meeting.video_url) {
                              (mediaElement as HTMLVideoElement).style.maxHeight = '400px';
                            }
                            
                            // Handle different formats
                            const handleMediaLoad = () => {
                              console.log('Media loaded successfully');
                            };
                            
                            const handleMediaError = (e: Event) => {
                              console.error('Media error:', e);
                              const errorDiv = document.createElement('div');
                              errorDiv.style.padding = '20px';
                              errorDiv.style.textAlign = 'center';
                              errorDiv.style.color = '#666';
                              
                              // Use safe DOM APIs instead of innerHTML to prevent XSS
                              const errorText1 = document.createElement('p');
                              errorText1.textContent = 'خطا در پخش فایل';
                              
                              const errorText2 = document.createElement('p');
                              errorText2.textContent = 'فرمت فایل پشتیبانی نمی‌شود یا فایل خراب است';
                              
                              const closeButton = document.createElement('button');
                              closeButton.textContent = 'بستن';
                              closeButton.style.marginTop = '10px';
                              closeButton.style.padding = '8px 16px';
                              closeButton.addEventListener('click', () => {
                                dialog.close();
                                document.body.removeChild(dialog);
                              });
                              
                              errorDiv.appendChild(errorText1);
                              errorDiv.appendChild(errorText2);
                              errorDiv.appendChild(closeButton);
                              
                              dialog.innerHTML = '';
                              dialog.appendChild(errorDiv);
                            };
                            
                            mediaElement.addEventListener('loadeddata', handleMediaLoad);
                            mediaElement.addEventListener('error', handleMediaError);
                            mediaElement.src = mediaUrl;
                            
                            const dialog = document.createElement('dialog');
                            dialog.style.padding = '20px';
                            dialog.style.borderRadius = '8px';
                            dialog.style.border = 'none';
                            dialog.style.maxWidth = '90vw';
                            dialog.style.maxHeight = '90vh';
                            dialog.style.backgroundColor = 'white';
                            
                            const closeBtn = document.createElement('button');
                            closeBtn.textContent = 'بستن';
                            closeBtn.style.marginTop = '10px';
                            closeBtn.style.padding = '8px 16px';
                            closeBtn.style.borderRadius = '4px';
                            closeBtn.style.border = '1px solid #ddd';
                            closeBtn.style.cursor = 'pointer';
                            closeBtn.onclick = () => {
                              mediaElement.pause();
                              dialog.close();
                              document.body.removeChild(dialog);
                            };
                            
                            dialog.appendChild(mediaElement);
                            dialog.appendChild(closeBtn);
                            document.body.appendChild(dialog);
                            dialog.showModal();
                          }}
                        >
                          <Play className="h-3 w-3 ml-1" />
                          پخش ضبط شده
                        </Button>
                      )}
                      
                      <MeetingUploadButton
                        meeting={meeting}
                        label="آپلود فایل"
                        onUploaded={loadMeetings}
                      />
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDeleteDialog(meeting)}
                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="حذف جلسه"
        description={`آیا از حذف جلسه "${meetingToDelete?.title}" مطمئن هستید؟ این اقدام قابل بازگشت نیست.`}
        confirmText="حذف"
        cancelText="لغو"
        onConfirm={handleDeleteMeeting}
        variant="destructive"
      />
    </Card>
  );
};