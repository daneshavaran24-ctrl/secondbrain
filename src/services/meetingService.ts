// Meeting Management Service
import { Meeting, ActionItem, Participant, MeetingAttachment, MeetingResolution, MeetingLocation } from '@/types';

class MeetingService {
  private meetings: Meeting[] = [];
  private readonly STORAGE_KEY = 'meetings_v3';
  
  constructor() {
    this.loadFromStorage();
    this.migrateFromProfessionalService();
  }
  
  async createMeeting(title: string, organization: Meeting['organization'], location?: MeetingLocation): Promise<Meeting> {
    const meeting: Meeting = {
      id: crypto.randomUUID(),
      title,
      date: new Date().toISOString(),
      duration: 0,
      participants: [],
      action_items: [],
      organization,
      minutes_status: 'draft',
      attachments: [],
      resolutions: [],
      location
    };
    
    this.meetings.push(meeting);
    await this.saveToStorage();
    
    return meeting;
  }
  
  async startRecording(meetingId: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    // Recording is now handled in the component
    console.log('Recording started for meeting:', meetingId);
  }
  
  async stopRecording(meetingId: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    // Stop recording and process
    meeting.duration = this.calculateDuration(meeting.date);
    await this.processRecording(meeting);
    await this.saveToStorage();
  }
  
  private async processRecording(meeting: Meeting): Promise<void> {
    console.log('Processing recording for meeting:', meeting.id);
    
    // Extract action items from title/content for now
    meeting.action_items = this.extractActionItems(meeting.title);
    
    // Generate participants data
    meeting.participants = this.generateParticipants();
    
    // Set basic summary
    meeting.summary = `جلسه ${meeting.title} با مدت ${meeting.duration} دقیقه برگزار شد.`;
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
      meeting.summary = `جلسه ${meeting.title}: ${result.text.substring(0, 100)}...`;
      
      await this.saveToStorage();
      console.log('Transcript processed successfully');
      
    } catch (error) {
      console.error('Error processing audio transcript:', error);
      // Set fallback transcript
      meeting.transcript = `خطا در پردازش صوت جلسه ${meeting.title}`;
      await this.saveToStorage();
    }
  }
  
  private extractActionItems(text: string): ActionItem[] {
    const actionItems: ActionItem[] = [];
    const keywords = ['پیگیری', 'اقدام', 'تهیه', 'آماده', 'بررسی', 'انجام', 'ارسال'];
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        actionItems.push({
          id: crypto.randomUUID(),
          description: `${keyword} موضوع مطرح شده در جلسه`,
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
    return [];
  }
  
  private calculateDuration(startTime: string): number {
    const start = new Date(startTime);
    const end = new Date();
    return Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
  }
  
  async updateMeetingMedia(meetingId: string, mediaUrl: string, mimeType?: string): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    // Set appropriate URL based on media type
    if (mimeType?.startsWith('audio/')) {
      meeting.audio_url = mediaUrl;
    } else {
      meeting.video_url = mediaUrl;
    }
    
    // No additional metadata needed - audio/video URLs are sufficient
    
    await this.saveToStorage();
  }

  async getMeetings(organization?: Meeting['organization']): Promise<Meeting[]> {
    if (organization) {
      return this.meetings.filter(m => m.organization === organization);
    }
    return this.meetings;
  }
  
  async deleteMeeting(meetingId: string): Promise<void> {
    const meetingIndex = this.meetings.findIndex(m => m.id === meetingId);
    if (meetingIndex === -1) throw new Error('Meeting not found');
    
    const meeting = this.meetings[meetingIndex];
    
    // Revoke blob URLs to free up memory
    if (meeting.audio_url && meeting.audio_url.startsWith('blob:')) {
      URL.revokeObjectURL(meeting.audio_url);
    }
    if (meeting.video_url && meeting.video_url.startsWith('blob:')) {
      URL.revokeObjectURL(meeting.video_url);
    }
    
    // Remove meeting from array
    this.meetings.splice(meetingIndex, 1);
    
    // Save to storage
    await this.saveToStorage();
    
    console.log('Meeting deleted successfully:', meetingId);
  }

  async generateMinutes(meetingId: string, template: 'formal' | 'action' | 'executive' = 'formal'): Promise<string> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    
    const date = new Date(meeting.date).toLocaleDateString('fa-IR');
    const orgInfo = meeting.organization === 'Varid' ? 'شرکت وارید' : 
                   meeting.organization === 'Frangaran' ? 'مجموعه فرانگاران' :
                   meeting.organization === 'Association' ? 'انجمن' :
                   meeting.organization === 'Chamber' ? 'اتاق بازرگانی' : meeting.organization;
    
    switch (template) {
      case 'formal':
        return this.generateFormalMinutes(meeting, date, orgInfo);
      case 'action':
        return this.generateActionMinutes(meeting, date, orgInfo);
      case 'executive':
        return this.generateExecutiveMinutes(meeting, date, orgInfo);
      default:
        return this.generateFormalMinutes(meeting, date, orgInfo);
    }
  }

  private generateFormalMinutes(meeting: Meeting, date: string, orgInfo: string): string {
    let minutes = `صورت جلسه رسمی\n`;
    minutes += `${'='.repeat(50)}\n\n`;
    minutes += `عنوان جلسه: ${meeting.title}\n`;
    minutes += `سازمان: ${orgInfo}\n`;
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
    
    if (meeting.transcript) {
      minutes += `متن کامل مذاکرات:\n${meeting.transcript}\n\n`;
    }
    
    if (meeting.action_items.length > 0) {
      minutes += `مصوبات و وظایف:\n`;
      meeting.action_items.forEach((item, index) => {
        minutes += `${index + 1}. ${item.description}\n`;
        minutes += `   مسئول: ${item.assignee}\n`;
        minutes += `   اولویت: ${item.priority}\n`;
        minutes += `   مهلت: ${new Date(item.due_date).toLocaleDateString('fa-IR')}\n\n`;
      });
    }
    
    minutes += `تهیه شده در تاریخ: ${new Date().toLocaleDateString('fa-IR')}\n`;
    return minutes;
  }

  private generateActionMinutes(meeting: Meeting, date: string, orgInfo: string): string {
    let minutes = `لیست اقدامات - ${meeting.title}\n`;
    minutes += `${'='.repeat(40)}\n\n`;
    minutes += `جلسه: ${meeting.title}\n`;
    minutes += `تاریخ: ${date}\n`;
    minutes += `سازمان: ${orgInfo}\n\n`;
    
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

  private generateExecutiveMinutes(meeting: Meeting, date: string, orgInfo: string): string {
    let minutes = `گزارش اجرایی جلسه\n`;
    minutes += `${'='.repeat(30)}\n\n`;
    minutes += `📋 ${meeting.title}\n`;
    minutes += `🏢 ${orgInfo}\n`;
    minutes += `📅 ${date}\n`;
    minutes += `⏱️ ${meeting.duration} دقیقه\n`;
    minutes += `👥 ${meeting.participants.length} شرکت‌کننده\n\n`;
    
    if (meeting.summary) {
      minutes += `📝 خلاصه:\n${meeting.summary}\n\n`;
    }
    
    minutes += `📊 آمار جلسه:\n`;
    minutes += `• مدت صحبت متوسط هر نفر: ${meeting.participants.length > 0 ? Math.round(meeting.duration / meeting.participants.length) : 0} دقیقه\n`;
    minutes += `• تعداد وظایف تعریف شده: ${meeting.action_items.length}\n`;
    
    if (meeting.participants.length > 0) {
      const avgAttention = meeting.participants.reduce((acc, p) => acc + p.attention_score, 0) / meeting.participants.length;
      minutes += `• میانگین توجه شرکت‌کنندگان: ${Math.round(avgAttention)}%\n`;
    }
    
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
    
    // Extract resolutions from text
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

  // New method for adding attachment record (without file processing)
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

  // Attachment management
  async addAttachment(meetingId: string, file: File): Promise<MeetingAttachment> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    // Create blob URL for local storage
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

    // If it's a text file, try to extract content
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
    
    // Revoke blob URL
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
    
    // Look for resolution patterns
    const resolutionKeywords = ['مصوب', 'تصویب', 'تصمیم', 'قرار', 'پیگیری'];
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      resolutionKeywords.forEach(keyword => {
        if (lowerLine.includes(keyword)) {
          resolutions.push({
            id: crypto.randomUUID(),
            meeting_id: '',
            title: `مصوبه استخراج شده: ${keyword}`,
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

  // Generate downloadable minutes
  async downloadMinutes(meetingId: string, format: 'txt' | 'json' = 'txt'): Promise<void> {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'txt') {
      content = await this.generateMinutes(meetingId);
      filename = `minutes-${meeting.title}-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain;charset=utf-8';
    } else {
      content = JSON.stringify(meeting, null, 2);
      filename = `meeting-${meeting.title}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
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
  
  private async saveToStorage(): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.meetings));
  }

  // Migration from professional service
  private migrateFromProfessionalService(): void {
    try {
      const professionalData = localStorage.getItem('professional_meetings_v1');
      if (professionalData) {
        const professionalMeetings = JSON.parse(professionalData);
        
        // Only migrate if we haven't already
        const migrationKey = 'professional_meetings_migrated';
        if (!localStorage.getItem(migrationKey)) {
          // Add professional meetings to current meetings (avoid duplicates)
          const existingIds = new Set(this.meetings.map(m => m.id));
          professionalMeetings.forEach((meeting: Meeting) => {
            if (!existingIds.has(meeting.id)) {
              this.meetings.push(meeting);
            }
          });
          
          this.saveToStorage();
          localStorage.setItem(migrationKey, 'true');
          console.log('Professional meetings migrated successfully');
        }
      }
    } catch (error) {
      console.error('Error migrating professional meetings:', error);
    }
  }

  // پاکسازی کامل داده‌های جلسات
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
    localStorage.removeItem('meetings');
    localStorage.removeItem('meeting_minutes');
    localStorage.removeItem('meeting_resolutions');
    localStorage.removeItem('professional_meetings_v1');
    localStorage.removeItem('meeting_tracking_data');
    localStorage.removeItem('professional_meeting_analytics');
  }
  
  async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.meetings = JSON.parse(stored).map((meeting: any) => ({
          ...meeting,
          participants: meeting.participants || [],
          action_items: meeting.action_items || [],
          attachments: meeting.attachments || [],
          resolutions: meeting.resolutions || [],
          responsible_parties: meeting.responsible_parties || [],
          activity_log: meeting.activity_log || [],
          comments: meeting.comments || [],
          reminders: meeting.reminders || []
        }));
      }
    } catch (error) {
      console.error('Error loading meetings from storage:', error);
      this.meetings = [];
    }
  }
}

export const meetingService = new MeetingService();