// Professional Meeting Management Service
import { Meeting, ActionItem, Participant, MeetingAttachment, MeetingResolution } from '@/types';

class ProfessionalMeetingService {
  private meetings: Meeting[] = [];
  private readonly STORAGE_KEY = 'professional_meetings_v1';
  
  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.meetings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading professional meetings from storage:', error);
      this.meetings = [];
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.meetings));
    } catch (error) {
      console.error('Error saving professional meetings to storage:', error);
    }
  }

  // پاکسازی کامل داده‌های جلسات حرفه‌ای
  cleanupAllData(): void {
    // پاک کردن blob URLs
    this.meetings.forEach(meeting => {
      if (meeting.audio_url && meeting.audio_url.startsWith('blob:')) {
        URL.revokeObjectURL(meeting.audio_url);
      }
      if (meeting.video_url && meeting.video_url.startsWith('blob:')) {
        URL.revokeObjectURL(meeting.video_url);
      }
      meeting.attachments?.forEach(attachment => {
        if (attachment.file_url && attachment.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.file_url);
        }
      });
    });
    
    // پاک کردن آرایه
    this.meetings = [];
    
    // پاک کردن localStorage
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('meeting_tracking_data');
    localStorage.removeItem('professional_meeting_analytics');
  }
  
  async createMeeting(title: string): Promise<Meeting> {
    const meeting: Meeting = {
      id: crypto.randomUUID(),
      title,
      date: new Date().toISOString(),
      duration: 0,
      participants: [],
      action_items: [],
      organization: 'Professional',
      minutes_status: 'draft',
      attachments: [],
      resolutions: []
    };
    
    this.meetings.push(meeting);
    await this.saveToStorage();
    
    return meeting;
  }
  
  async startRecording(meetingId: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    console.log('Professional recording started for meeting:', meetingId);
  }
  
  async stopRecording(meetingId: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    meeting.duration = this.calculateDuration(meeting.date);
    await this.processRecording(meeting);
    await this.saveToStorage();
  }
  
  private async processRecording(meeting: Meeting): Promise<void> {
    console.log('Processing professional recording for meeting:', meeting.id);
    
    // Extract action items from title/content for now
    meeting.action_items = this.extractActionItems(meeting.title);
    
    // Generate participants data
    meeting.participants = this.generateParticipants();
    
    // Set basic summary
    meeting.summary = `جلسه کاری ${meeting.title} با مدت ${meeting.duration} دقیقه برگزار شد.`;
  }

  async processAudioTranscript(meetingId: string, audioBlob: Blob): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to speech-to-text service
      const response = await fetch(`https://jymajpnwthgqcghmkmam.supabase.co/functions/v1/speech-to-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        throw new Error('Speech-to-text failed');
      }

      const result = await response.json();
      meeting.transcript = result.text;
      
      // Enhanced action item extraction from transcript
      if (result.text) {
        meeting.action_items = this.extractActionItems(result.text);
      }
      
      // Generate enhanced summary
      meeting.summary = `جلسه کاری ${meeting.title}: ${result.text.substring(0, 100)}...`;
      
      await this.saveToStorage();
      console.log('Professional transcript processed successfully');
      
    } catch (error) {
      console.error('Error processing professional audio transcript:', error);
      meeting.transcript = `خطا در پردازش صوت جلسه کاری ${meeting.title}`;
      await this.saveToStorage();
    }
  }
  
  private extractActionItems(text: string): ActionItem[] {
    const actionItems: ActionItem[] = [];
    const keywords = ['پیگیری', 'اقدام', 'تهیه', 'آماده', 'بررسی', 'انجام', 'ارسال', 'تولید', 'طراحی', 'توسعه'];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        actionItems.push({
          id: crypto.randomUUID(),
          description: `${keyword} موضوع مطرح شده در جلسه کاری`,
          assignee: 'نامشخص',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          priority: 'medium'
        });
      }
    });
    
    return actionItems;
  }
  
  private generateParticipants(): Participant[] {
    const professionalRoles = ['مدیر پروژه', 'تحلیلگر', 'توسعه‌دهنده', 'طراح', 'مشاور'];
    return professionalRoles.map(role => ({
      id: crypto.randomUUID(),
      name: `${role} نمونه`,
      role,
      email: `${role.toLowerCase().replace(' ', '.')}@company.com`,
      speaking_time: Math.floor(Math.random() * 15) + 5,
      attention_score: Math.floor(Math.random() * 30) + 70
    }));
  }
  
  private calculateDuration(startTime: string): number {
    const start = new Date(startTime);
    const end = new Date();
    return Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
  }
  
  async updateMeetingMedia(meetingId: string, mediaUrl: string, mimeType?: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    if (mimeType?.startsWith('audio/')) {
      meeting.audio_url = mediaUrl;
    } else {
      meeting.video_url = mediaUrl;
    }
    
    await this.saveToStorage();
  }

  async getMeetings(): Promise<Meeting[]> {
    return this.meetings;
  }
  
  async deleteMeeting(meetingId: string): Promise<void> {
    const meetingIndex = this.meetings.findIndex(m => m.id === meetingId);
    if (meetingIndex === -1) throw new Error('Meeting not found');
    
    const meeting = this.meetings[meetingIndex];
    
    if (meeting.audio_url && meeting.audio_url.startsWith('blob:')) {
      URL.revokeObjectURL(meeting.audio_url);
    }
    if (meeting.video_url && meeting.video_url.startsWith('blob:')) {
      URL.revokeObjectURL(meeting.video_url);
    }
    
    this.meetings.splice(meetingIndex, 1);
    await this.saveToStorage();
    
    console.log('Professional meeting deleted successfully:', meetingId);
  }

  async generateMinutes(meetingId: string, template: 'formal' | 'action' | 'executive' = 'action'): Promise<string> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    const date = new Date(meeting.date).toLocaleDateString('fa-IR');
    
    switch (template) {
      case 'formal':
        return this.generateFormalMinutes(meeting, date);
      case 'action':
        return this.generateActionMinutes(meeting, date);
      case 'executive':
        return this.generateExecutiveMinutes(meeting, date);
      default:
        return this.generateActionMinutes(meeting, date);
    }
  }

  private generateFormalMinutes(meeting: Meeting, date: string): string {
    let minutes = `صورت جلسه کاری\n`;
    minutes += `${'='.repeat(50)}\n\n`;
    minutes += `عنوان جلسه: ${meeting.title}\n`;
    minutes += `تاریخ برگزاری: ${date}\n`;
    minutes += `مدت جلسه: ${meeting.duration} دقیقه\n`;
    minutes += `تعداد شرکت‌کنندگان: ${meeting.participants.length} نفر\n\n`;
    
    if (meeting.participants.length > 0) {
      minutes += `شرکت‌کنندگان:\n`;
      meeting.participants.forEach((p, i) => {
        minutes += `${i + 1}. ${p.name} - ${p.role}\n`;
      });
      minutes += `\n`;
    }
    
    if (meeting.summary) {
      minutes += `خلاصه مذاکرات:\n${meeting.summary}\n\n`;
    }
    
    if (meeting.action_items.length > 0) {
      minutes += `وظایف و اقدامات:\n`;
      meeting.action_items.forEach((item, index) => {
        minutes += `${index + 1}. ${item.description}\n`;
        minutes += `   مسئول: ${item.assignee}\n`;
        minutes += `   اولویت: ${item.priority}\n`;
        minutes += `   مهلت: ${new Date(item.due_date).toLocaleDateString('fa-IR')}\n\n`;
      });
    }
    
    return minutes;
  }

  private generateActionMinutes(meeting: Meeting, date: string): string {
    let minutes = `لیست اقدامات کاری - ${meeting.title}\n`;
    minutes += `${'='.repeat(40)}\n\n`;
    minutes += `جلسه: ${meeting.title}\n`;
    minutes += `تاریخ: ${date}\n\n`;
    
    minutes += `وظایف و اقدامات:\n`;
    minutes += `${'-'.repeat(30)}\n`;
    
    if (meeting.action_items.length > 0) {
      meeting.action_items.forEach((item, index) => {
        minutes += `\n${index + 1}. ${item.description}\n`;
        minutes += `   🎯 مسئول: ${item.assignee}\n`;
        minutes += `   📅 مهلت: ${new Date(item.due_date).toLocaleDateString('fa-IR')}\n`;
        minutes += `   ⚡ اولویت: ${item.priority === 'high' ? 'بالا' : item.priority === 'medium' ? 'متوسط' : 'پایین'}\n`;
        minutes += `   📊 وضعیت: ${item.status === 'pending' ? 'در انتظار' : item.status === 'in_progress' ? 'در حال انجام' : 'تکمیل شده'}\n`;
      });
    } else {
      minutes += `\nهیچ وظیفه‌ای تعریف نشده است.\n`;
    }
    
    return minutes;
  }

  private generateExecutiveMinutes(meeting: Meeting, date: string): string {
    let minutes = `گزارش اجرایی جلسه کاری\n`;
    minutes += `${'='.repeat(30)}\n\n`;
    minutes += `📋 ${meeting.title}\n`;
    minutes += `📅 ${date}\n`;
    minutes += `⏱️ ${meeting.duration} دقیقه\n`;
    minutes += `👥 ${meeting.participants.length} شرکت‌کننده\n\n`;
    
    if (meeting.summary) {
      minutes += `📝 خلاصه:\n${meeting.summary}\n\n`;
    }
    
    minutes += `📊 آمار جلسه:\n`;
    minutes += `• تعداد وظایف تعریف شده: ${meeting.action_items.length}\n`;
    
    if (meeting.action_items.length > 0) {
      minutes += `\n🎯 وظایف کلیدی:\n`;
      meeting.action_items.forEach((item, index) => {
        minutes += `${index + 1}. ${item.description} (${item.assignee})\n`;
      });
    }
    
    return minutes;
  }

  // Minutes text management
  async setMinutesText(meetingId: string, text: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    meeting.minutes_text = text;
    meeting.minutes_status = text ? 'completed' : 'draft';
    
    const resolutions = this.extractResolutionsFromText(text);
    meeting.resolutions = [...meeting.resolutions, ...resolutions];
    
    await this.saveToStorage();
  }

  async updateMinutesStatus(meetingId: string, status: Meeting['minutes_status']): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    meeting.minutes_status = status;
    await this.saveToStorage();
  }

  // Attachment management
  async addAttachmentRecord(
    meetingId: string, 
    partial: Pick<MeetingAttachment, 'file_name' | 'file_type' | 'file_size'> & { 
      storage_bucket?: string; 
      storage_path?: string; 
      file_url?: string 
    }
  ): Promise<MeetingAttachment> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const attachment: MeetingAttachment = {
      id: crypto.randomUUID(),
      meeting_id: meetingId,
      file_name: partial.file_name,
      file_type: partial.file_type,
      file_size: partial.file_size,
      file_url: partial.file_url || '',
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'current_user',
      storage_bucket: partial.storage_bucket,
      storage_path: partial.storage_path
    };

    meeting.attachments.push(attachment);
    await this.saveToStorage();
    return attachment;
  }

  async addAttachment(meetingId: string, file: File): Promise<MeetingAttachment> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const fileUrl = URL.createObjectURL(file);
    
    const attachment: MeetingAttachment = {
      id: crypto.randomUUID(),
      meeting_id: meetingId,
      file_name: file.name,
      file_type: file.type,
      file_url: fileUrl,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'current_user'
    };

    meeting.attachments.push(attachment);

    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      try {
        const text = await file.text();
        if (!meeting.minutes_text) {
          meeting.minutes_text = text;
          meeting.minutes_status = 'completed';
        }
      } catch (error) {
        console.error('Error reading text file:', error);
      }
    }

    await this.saveToStorage();
    return attachment;
  }

  async removeAttachment(meetingId: string, attachmentId: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const attachmentIndex = meeting.attachments.findIndex(a => a.id === attachmentId);
    if (attachmentIndex === -1) throw new Error('Attachment not found');

    const attachment = meeting.attachments[attachmentIndex];
    
    if (attachment.file_url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.file_url);
    }

    meeting.attachments.splice(attachmentIndex, 1);
    await this.saveToStorage();
  }

  // Resolution management
  async addResolution(meetingId: string, resolution: Omit<MeetingResolution, 'id' | 'meeting_id' | 'created_at' | 'updated_at'>): Promise<MeetingResolution> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const newResolution: MeetingResolution = {
      id: crypto.randomUUID(),
      meeting_id: meetingId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...resolution
    };

    meeting.resolutions.push(newResolution);
    await this.saveToStorage();
    return newResolution;
  }

  async updateResolution(meetingId: string, resolutionId: string, updates: Partial<MeetingResolution>): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const resolution = meeting.resolutions.find(r => r.id === resolutionId);
    if (!resolution) throw new Error('Resolution not found');

    Object.assign(resolution, updates, { updated_at: new Date().toISOString() });
    await this.saveToStorage();
  }

  async deleteResolution(meetingId: string, resolutionId: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    const resolutionIndex = meeting.resolutions.findIndex(r => r.id === resolutionId);
    if (resolutionIndex === -1) throw new Error('Resolution not found');

    meeting.resolutions.splice(resolutionIndex, 1);
    await this.saveToStorage();
  }

  private extractResolutionsFromText(text: string): MeetingResolution[] {
    const resolutions: MeetingResolution[] = [];
    const lines = text.split('\n');
    
    const resolutionKeywords = ['مصوب', 'تصویب', 'تصمیم', 'قرار', 'پیگیری', 'اقدام'];
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      resolutionKeywords.forEach(keyword => {
        if (lowerLine.includes(keyword)) {
          resolutions.push({
            id: crypto.randomUUID(),
            meeting_id: '',
            title: `مصوبه کاری: ${keyword}`,
            description: line.trim(),
            status: 'pending',
            priority: 'medium',
            responsible_party: 'نامشخص',
            responsible_parties: [],
            activity_log: [],
            comments: [],
            reminders: [],
            auto_create_task: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
    
    return resolutions;
  }

  async downloadMinutes(meetingId: string, format: 'txt' | 'json' = 'txt'): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'txt') {
      content = await this.generateMinutes(meetingId, 'action');
      filename = `professional-meeting-${meeting.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain;charset=utf-8';
    } else {
      content = JSON.stringify(meeting, null, 2);
      filename = `professional-meeting-${meeting.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

export const professionalMeetingService = new ProfessionalMeetingService();