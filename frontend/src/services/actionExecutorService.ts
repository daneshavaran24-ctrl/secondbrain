/**
 * Action Executor Service
 * Bridges AI assistant intents with app services
 */

import { supabase } from '@/integrations/supabase/client';
import { syncService } from './syncService';
import { offlineStorage } from './offlineStorageService';

export interface AssistantAction {
  function: string;
  params: Record<string, unknown>;
  status: 'pending' | 'completed' | 'failed' | 'needs_confirmation' | 'needs_info';
  result?: unknown;
  error?: string;
  feedback?: {
    location: string;
    details: string;
  };
}

export interface ActionResult {
  success: boolean;
  message: string;
  location?: string;
  timestamp?: Date;
  data?: unknown;
  error?: string;
}

class ActionExecutorService {
  // Track recently executed actions to prevent duplicates
  private recentActions: Map<string, number> = new Map();

  /**
   * Check if a similar record was recently created (within minutesWindow)
   */
  private async checkRecentDuplicate(
    table: string,
    userId: string,
    matchFields: Record<string, unknown>,
    minutesWindow: number = 5
  ): Promise<{ isDuplicate: boolean; existingTitle?: string }> {
    const cacheKey = `${table}:${userId}:${JSON.stringify(matchFields)}`;
    const lastExec = this.recentActions.get(cacheKey);
    if (lastExec && Date.now() - lastExec < minutesWindow * 60 * 1000) {
      return { isDuplicate: true, existingTitle: matchFields.title as string };
    }

    // Also check DB for recent duplicates
    const cutoff = new Date(Date.now() - minutesWindow * 60 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase.from(table as any).select('id, title').gte('created_at', cutoff);
    
    if (table !== 'health_metrics') {
      query = query.eq('user_id', userId);
    }
    
    for (const [key, value] of Object.entries(matchFields)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }

    const { data } = await query.limit(1);
    if (data && data.length > 0) {
      this.recentActions.set(cacheKey, Date.now());
      return { isDuplicate: true, existingTitle: (data[0] as Record<string, unknown>).title as string };
    }

    return { isDuplicate: false };
  }

  /**
   * Mark an action as recently executed
   */
  private markExecuted(table: string, userId: string, matchFields: Record<string, unknown>) {
    const cacheKey = `${table}:${userId}:${JSON.stringify(matchFields)}`;
    this.recentActions.set(cacheKey, Date.now());
    // Clean old entries every 100 items
    if (this.recentActions.size > 100) {
      const now = Date.now();
      for (const [key, time] of this.recentActions.entries()) {
        if (now - time > 10 * 60 * 1000) this.recentActions.delete(key);
      }
    }
  }

  /**
   * Execute an action from the assistant
   */
  async executeAction(action: AssistantAction): Promise<ActionResult> {
    console.log('[ActionExecutor] Executing action:', action.function, action.params);

    try {
      switch (action.function) {
        case 'create_meeting':
          return await this.createMeeting(action.params);
        case 'cancel_meeting':
          return await this.cancelMeeting(action.params);
        case 'update_meeting':
          return await this.updateMeeting(action.params);
        case 'create_task':
          return await this.createTask(action.params);
        case 'send_notification':
          return await this.sendNotification(action.params);
        case 'search_calendar':
          return await this.searchCalendar(action.params);
        case 'search_contacts':
          return await this.searchContacts(action.params);
        case 'create_reminder':
          return await this.createReminder(action.params);
        // Existing actions
        case 'save_journal_entry':
          return await this.saveJournalEntry(action.params);
        case 'save_gratitude':
          return await this.saveGratitude(action.params);
        case 'save_meeting_summary':
          return await this.saveMeetingSummary(action.params);
        case 'process_attachment':
          return await this.processAttachment(action.params);
        // NEW actions for file processing
        case 'create_contact':
          return await this.createContact(action.params);
        case 'save_meeting_recording':
          return await this.saveMeetingRecording(action.params);
        case 'create_tasks_batch':
          return await this.createTasksBatch(action.params);
        case 'import_contacts_batch':
          return await this.importContactsBatch(action.params);
        case 'request_missing_info':
          return await this.requestMissingInfo(action.params);
        case 'save_for_later':
          return await this.saveForLater(action.params);
        // NEW domain actions
        case 'save_health_metrics':
          return await this.saveHealthMetrics(action.params);
        case 'add_resume_item':
          return await this.addResumeItem(action.params);
        case 'create_csr_project':
          return await this.createCSRProject(action.params);
        case 'save_idea':
          return await this.saveIdea(action.params);
        case 'get_pending_tasks':
          return await this.getPendingTasks(action.params);
        case 'complete_habit':
          return await this.completeHabit(action.params);
        case 'save_knowledge':
          return await this.saveKnowledge(action.params);
        // NEW: Legal & Organization actions
        case 'create_legal_case':
          return await this.createLegalCase(action.params);
        case 'save_lawyer_note':
          return await this.saveLawyerNote(action.params);
        case 'create_organization_mission':
          return await this.createOrganizationMission(action.params);
        case 'send_sms':
          return await this.sendSms(action.params);
        default:
          return {
            success: false,
            message: `عملیات ناشناخته: ${action.function}`,
            error: 'UNKNOWN_ACTION'
          };
      }
    } catch (error) {
      console.error('[ActionExecutor] Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'خطای ناشناخته',
        error: 'EXECUTION_ERROR'
      };
    }
  }

  /**
   * Create a new meeting/appointment
   */
  private async createMeeting(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, date, time, duration, participants, location, description } = params;

    // Parse date and time
    const startDate = this.parseDateTime(date as string, time as string);
    const endDate = new Date(startDate.getTime() + ((duration as number) || 60) * 60 * 1000);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    // --- Check for duplicate (same title + same day) ---
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: duplicates } = await supabase
      .from('calendar_events')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('title', title as string)
      .gte('start_date', dayStart.toISOString())
      .lte('start_date', dayEnd.toISOString());

    if (duplicates && duplicates.length > 0) {
      return {
        success: false,
        message: `⚠️ قرار «${title}» قبلاً برای این روز ثبت شده است.`,
        error: 'DUPLICATE'
      };
    }

    // --- Check for time conflict ---
    const { data: conflicts } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, end_date')
      .eq('user_id', user.id)
      .lt('start_date', endDate.toISOString())
      .gt('end_date', startDate.toISOString());

    if (conflicts && conflicts.length > 0) {
      const conflictTitle = conflicts[0].title;
      const conflictTime = this.formatPersianDateTime(new Date(conflicts[0].start_date));
      return {
        success: false,
        message: `⚠️ تداخل زمانی! در این ساعت قرار «${conflictTitle}» (${conflictTime}) دارید. لطفاً ساعت دیگری انتخاب کنید.`,
        error: 'TIME_CONFLICT'
      };
    }

    const meetingData = {
      id: crypto.randomUUID(),
      title: title as string,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      description: description as string || '',
      venue_address: location as string || '',
      user_id: user.id,
      domain: (params.domain as string) || 'professional',
      event_type: 'meeting',
      color: '#3B82F6',
    };

    // Try to save to Supabase
    const { error } = await supabase
      .from('calendar_events')
      .insert(meetingData);

    const persianDate = this.formatPersianDateTime(startDate);

    if (error) {
      // Queue for offline sync
      await syncService.queueAction('create', 'calendar_event', meetingData.id, meetingData);
      return {
        success: true,
        message: `قرار "${title}" ایجاد شد (در انتظار همگام‌سازی)`,
        location: 'تقویم حرفه‌ای',
        timestamp: new Date(),
        data: meetingData
      };
    }

    // Mark as executed to prevent re-execution
    this.markExecuted('calendar_events', user.id, { title: title as string });

    return {
      success: true,
      message: `✅ قرار «${title}» در تقویم حرفه‌ای ثبت شد - ${persianDate}. یادآوری: ${persianDate} این قرار را دارید 📅`,
      location: 'تقویم حرفه‌ای',
      timestamp: new Date(),
      data: meetingData
    };
  }

  /**
   * Cancel/delete a meeting
   */
  private async cancelMeeting(params: Record<string, unknown>): Promise<ActionResult> {
    const { meeting_id, search_query, date, notify_participants } = params;

    let targetMeetingId = meeting_id as string;

    // If no direct ID, search for the meeting
    if (!targetMeetingId && search_query) {
      const { data: meetings } = await supabase
        .from('calendar_events')
        .select('id, title, start_date')
        .ilike('title', `%${search_query}%`)
        .order('start_date', { ascending: true })
        .limit(5);

      if (!meetings || meetings.length === 0) {
        return {
          success: false,
          message: `قراری با عنوان "${search_query}" پیدا نشد`,
          error: 'NOT_FOUND'
        };
      }

      if (meetings.length === 1) {
        targetMeetingId = meetings[0].id;
      } else {
        // Multiple matches - need clarification
        return {
          success: false,
          message: `چندین قرار پیدا شد. کدام را کنسل کنم؟`,
          data: meetings,
          error: 'MULTIPLE_MATCHES'
        };
      }
    }

    if (!targetMeetingId) {
      return {
        success: false,
        message: 'لطفاً مشخص کنید کدام قرار را می‌خواهید کنسل کنید',
        error: 'MISSING_INFO'
      };
    }

    // Delete the meeting
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', targetMeetingId);

    if (error) {
      await syncService.queueAction('delete', 'calendar_event', targetMeetingId, {});
      return {
        success: true,
        message: '✅ قرار از تقویم حرفه‌ای حذف شد (در انتظار همگام‌سازی)',
        location: 'تقویم حرفه‌ای',
        timestamp: new Date()
      };
    }

    return {
      success: true,
      message: '✅ قرار از تقویم حرفه‌ای حذف شد',
      location: 'تقویم حرفه‌ای',
      timestamp: new Date()
    };
  }

  /**
   * Update meeting details
   */
  private async updateMeeting(params: Record<string, unknown>): Promise<ActionResult> {
    const { meeting_id, search_query, updates } = params;
    
    // Similar logic to cancelMeeting for finding the meeting
    let targetMeetingId = meeting_id as string;

    if (!targetMeetingId && search_query) {
      const { data: meetings } = await supabase
        .from('calendar_events')
        .select('id, title')
        .ilike('title', `%${search_query}%`)
        .limit(1);

      if (meetings && meetings.length > 0) {
        targetMeetingId = meetings[0].id;
      }
    }

    if (!targetMeetingId) {
      return {
        success: false,
        message: 'قرار مورد نظر پیدا نشد',
        error: 'NOT_FOUND'
      };
    }

    const { error } = await supabase
      .from('calendar_events')
      .update(updates as Record<string, unknown>)
      .eq('id', targetMeetingId);

    if (error) {
      await syncService.queueAction('update', 'calendar_event', targetMeetingId, updates as Record<string, unknown>);
      return {
        success: true,
        message: '✅ تغییرات در تقویم حرفه‌ای ذخیره شد (در انتظار همگام‌سازی)',
        location: 'تقویم حرفه‌ای',
        timestamp: new Date()
      };
    }

    return {
      success: true,
      message: '✅ قرار در تقویم حرفه‌ای به‌روزرسانی شد',
      location: 'تقویم حرفه‌ای',
      timestamp: new Date()
    };
  }

  /**
   * Create a new task
   */
  private async createTask(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, description, due_date, priority, domain } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const parsedDueDate = due_date ? this.parseDateTime(due_date as string) : null;
    const domainLabel = domain === 'personal' ? 'شخصی' : 
                       domain === 'professional' ? 'حرفه‌ای' : 'سازمانی';

    // Save to local storage for the appropriate domain service
    const taskData = {
      id: crypto.randomUUID(),
      title: title as string,
      description: description as string || '',
      dueDate: parsedDueDate?.toISOString(),
      priority: (priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      status: 'todo' as const,
      domain: (domain as 'personal' | 'professional' | 'organizational') || 'personal',
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending' as const
    };

    // Save to offline storage
    await offlineStorage.saveTask(taskData);

    // Queue for sync
    await syncService.queueAction('create', 'task', taskData.id, {
      ...taskData,
      user_id: user.id
    });

    const dueDateStr = parsedDueDate ? ` - موعد: ${this.formatPersianDateTime(parsedDueDate)}` : '';

    return {
      success: true,
      message: `✅ وظیفه "${title}" در لیست وظایف ${domainLabel} اضافه شد${dueDateStr}`,
      location: `لیست وظایف ${domainLabel}`,
      timestamp: new Date(),
      data: taskData
    };
  }

  /**
   * Send notification to someone (Real implementation)
   */
  private async sendNotification(params: Record<string, unknown>): Promise<ActionResult> {
    const { recipient, message, method } = params;

    const methodLabel = method === 'sms' ? 'پیامک' : 
                       method === 'email' ? 'ایمیل' : 'تلگرام';

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mora-backend.liara.run';
    const authHeader = localStorage.getItem('mora_access_token') ? `Bearer ${localStorage.getItem('mora_access_token')}` : '';

    try {
      switch (method) {
        case 'sms': {
          const r = await fetch(`${backendUrl}/send-delegation-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
            body: JSON.stringify({ phone: recipient, title: 'اطلاع‌رسانی از مورا', description: message }),
          });
          if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `خطا ${r.status}`); }
          break;
        }
        case 'email': {
          const r = await fetch(`${backendUrl}/generate-business-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
            body: JSON.stringify({ to: recipient, subject: 'اطلاع‌رسانی از مورا', body: message }),
          });
          if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `خطا ${r.status}`); }
          break;
        }
        case 'telegram': {
          const r = await fetch(`${backendUrl}/telegram-bridge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
            body: JSON.stringify({ type: 'send_message', chat_id: recipient, text: `🔔 اطلاع‌رسانی\n\n${message}\n\n📱 دستیار هوشمند مورا` }),
          });
          if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `خطا ${r.status}`); }
          break;
        }
        default:
          throw new Error(`روش ارسال نامعتبر: ${method}`);
      }
      
      console.log('[ActionExecutor] Notification sent:', { recipient, method });
      
      return {
        success: true,
        message: `✅ ${methodLabel} به ${recipient} ارسال شد`,
        location: 'پیام‌رسانی',
        timestamp: new Date(),
        data: { recipient, message, method }
      };
    } catch (error) {
      console.error('[ActionExecutor] Notification error:', error);
      return {
        success: false,
        message: `❌ خطا در ارسال ${methodLabel}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`,
        error: 'SEND_FAILED'
      };
    }
  }

  /**
   * Search calendar events
   */
  private async searchCalendar(params: Record<string, unknown>): Promise<ActionResult> {
    const { query, date_from, date_to } = params;

    let queryBuilder = supabase
      .from('calendar_events')
      .select('id, title, start_date, end_date, venue_address')
      .order('start_date', { ascending: true });

    if (query) {
      queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }

    if (date_from) {
      queryBuilder = queryBuilder.gte('start_date', this.parseDateTime(date_from as string).toISOString());
    }

    if (date_to) {
      queryBuilder = queryBuilder.lte('start_date', this.parseDateTime(date_to as string).toISOString());
    }

    const { data, error } = await queryBuilder.limit(10);

    if (error) {
      return {
        success: false,
        message: 'خطا در جستجوی تقویم',
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        message: 'قراری پیدا نشد',
        data: []
      };
    }

    return {
      success: true,
      message: `${data.length} قرار پیدا شد`,
      data
    };
  }

  /**
   * Search contacts
   */
  private async searchContacts(params: Record<string, unknown>): Promise<ActionResult> {
    const { query } = params;

    // Search in offline storage first
    const localContacts = await offlineStorage.searchContacts(query as string);

    // Also search in Supabase
    const { data: dbContacts } = await supabase
      .from('company_contacts')
      .select('id, name, email, phone, organization')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,organization.ilike.%${query}%`)
      .limit(10);

    const allContacts = [...localContacts, ...(dbContacts || [])];
    
    // Remove duplicates by id
    const uniqueContacts = allContacts.filter((contact, index, self) =>
      index === self.findIndex(c => c.id === contact.id)
    );

    if (uniqueContacts.length === 0) {
      return {
        success: true,
        message: `مخاطبی با نام "${query}" پیدا نشد`,
        data: []
      };
    }

    return {
      success: true,
      message: `${uniqueContacts.length} مخاطب پیدا شد`,
      data: uniqueContacts
    };
  }

  /**
   * Create a reminder
   */
  private async createReminder(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, datetime, repeat } = params;

    const reminderDate = this.parseDateTime(datetime as string);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    // Create as a calendar event with reminder flag
    const reminderData = {
      id: crypto.randomUUID(),
      title: `🔔 ${title}`,
      start_date: reminderDate.toISOString(),
      end_date: new Date(reminderDate.getTime() + 15 * 60 * 1000).toISOString(), // 15 min duration
      event_type: 'reminder',
      user_id: user.id,
      reminders: JSON.stringify([{ type: 'notification', minutes_before: 0 }])
    };

    const { error } = await supabase
      .from('calendar_events')
      .insert(reminderData);

    const persianDate = this.formatPersianDateTime(reminderDate);

    if (error) {
      await syncService.queueAction('create', 'calendar_event', reminderData.id, reminderData);
      return {
        success: true,
        message: `✅ یادآوری "${title}" تنظیم شد - ${persianDate} (در انتظار همگام‌سازی)`,
        location: 'یادآورها',
        timestamp: new Date(),
        data: reminderData
      };
    }

    return {
      success: true,
      message: `✅ یادآوری "${title}" تنظیم شد - ${persianDate}`,
      location: 'یادآورها',
      timestamp: new Date(),
      data: reminderData
    };
  }

  /**
   * Save journal entry / دل‌نوشته - saves to Supabase knowledge_base
   */
  private async saveJournalEntry(params: Record<string, unknown>): Promise<ActionResult> {
    const { content, mood, tags } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const journalId = crypto.randomUUID();

    // Save to knowledge_base for persistence (like meeting summaries)
    const journalData = {
      id: journalId,
      author_id: user.id,
      title: `دل‌نوشته ${new Date().toLocaleDateString('fa-IR')}`,
      content: content as string,
      category: 'دل‌نوشته',
      tags: (tags as string[]) || ['دل‌نوشته', mood as string || 'شخصی'],
      created_at: now,
      updated_at: now
    };

    const { error } = await supabase
      .from('knowledge_base')
      .insert([journalData]);

    // Also save to IndexedDB for offline access
    await offlineStorage.saveJournal({
      id: journalId,
      content: content as string,
      mood: mood as string || undefined,
      tags: (tags as string[]) || [],
      createdAt: now,
      syncStatus: 'synced'
    });

    if (error) {
      console.error('[ActionExecutor] Journal save error:', error);
      return { 
        success: false, 
        message: `خطا در ذخیره دل‌نوشته: ${error.message}`, 
        error: error.message 
      };
    }

    return {
      success: true,
      message: '✅ دل‌نوشته در مدیریت دانش > دل‌نوشته ذخیره شد 📝',
      location: 'مدیریت دانش > دل‌نوشته',
      timestamp: new Date(),
      data: journalData
    };
  }

  /**
   * Save gratitude entry / شکرگذاری
   */
  private async saveGratitude(params: Record<string, unknown>): Promise<ActionResult> {
    const { item_1, item_2, item_3, notes } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const today = new Date().toISOString().split('T')[0];
    const content = [item_1, item_2, item_3].filter(Boolean).join('\n');

    // Check if entry exists for today
    const { data: existing } = await supabase
      .from('gratitude_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    let error;
    let gratitudeData;

    if (existing) {
      // Update existing entry (no updated_at column in gratitude_entries)
      gratitudeData = {
        content,
        mood: 'grateful',
      };
      const result = await supabase
        .from('gratitude_entries')
        .update(gratitudeData)
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new entry
      gratitudeData = {
        id: crypto.randomUUID(),
        user_id: user.id,
        date: today,
        content,
        mood: 'grateful',
        tags: ['شکرگذاری'],
      };
      const result = await supabase
        .from('gratitude_entries')
        .insert(gratitudeData);
      error = result.error;
    }

    if (error) {
      console.error('[ActionExecutor] Gratitude save error:', error);
      return { success: false, message: `خطا در ذخیره شکرگذاری: ${error.message}`, error: error.message };
    }

    const persianDate = this.formatPersianDateTime(new Date());

    return {
      success: true,
      message: `✅ شکرگذاری امروز (${persianDate.split(' ')[0]}) ثبت شد`,
      location: 'بخش شکرگذاری روزانه',
      timestamp: new Date(),
      data: gratitudeData
    };
  }

  /**
   * Save meeting summary / صورتجلسه
   * Fixed: Now saves to Supabase knowledge_base table for persistence
   */
  private async saveMeetingSummary(params: Record<string, unknown>): Promise<ActionResult> {
    const { meeting_title, meeting_date, participants, summary, decisions, action_items } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    // Format the meeting summary as a document
    const formattedContent = `
# صورتجلسه: ${meeting_title}
📅 تاریخ: ${meeting_date || new Date().toLocaleDateString('fa-IR')}

## شرکت‌کنندگان
${(participants as string[] || []).map(p => `- ${p}`).join('\n') || 'ذکر نشده'}

## خلاصه مذاکرات
${summary}

## تصمیمات
${(decisions as string[] || []).map((d, i) => `${i + 1}. ${d}`).join('\n') || 'موردی ثبت نشده'}

## اقدامات پیگیری
${(action_items as { task: string; assignee?: string; deadline?: string }[] || []).map((a, i) => 
  `${i + 1}. ${a.task} - مسئول: ${a.assignee || 'نامشخص'} - موعد: ${a.deadline || 'نامشخص'}`
).join('\n') || 'موردی ثبت نشده'}
    `.trim();

    const now = new Date().toISOString();
    const meetingId = crypto.randomUUID();

    // 1. Save to knowledge_base (Supabase) for persistence
    const knowledgeData = {
      id: meetingId,
      author_id: user.id,
      title: `صورتجلسه: ${meeting_title}`,
      content: formattedContent,
      category: 'صورتجلسات',
      tags: ['صورتجلسه', ...(participants as string[] || [])],
      created_at: now,
      updated_at: now
    };

    const { error: knowledgeError } = await supabase
      .from('knowledge_base')
      .insert(knowledgeData);

    if (knowledgeError) {
      console.error('[ActionExecutor] Meeting summary knowledge_base save error:', knowledgeError);
    }

    // 2. Also save to IndexedDB for offline access
    const meetingData = {
      id: meetingId,
      title: `صورتجلسه: ${meeting_title}`,
      date: (meeting_date as string) || now,
      participants: (participants as string[]) || [],
      notes: formattedContent,
      duration: 0,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'synced' as const
    };

    try {
      await offlineStorage.saveMeeting(meetingData);
    } catch (e) {
      console.log('[ActionExecutor] IndexedDB meeting save skipped:', e);
    }

    if (knowledgeError) {
      return {
        success: false,
        message: `خطا در ذخیره صورتجلسه: ${knowledgeError.message}`,
        error: knowledgeError.message
      };
    }

    return {
      success: true,
      message: `✅ صورتجلسه «${meeting_title}» در مدیریت دانش > صورتجلسات ذخیره شد 📋`,
      location: 'مدیریت دانش > صورتجلسات',
      timestamp: new Date(),
      data: knowledgeData
    };
  }

  /**
   * Process attachment content
   */
  private async processAttachment(params: Record<string, unknown>): Promise<ActionResult> {
    const { file_content, file_type, action } = params;

    // Based on the action, process the content
    switch (action) {
      case 'summarize':
        return {
          success: true,
          message: '📄 خلاصه فایل آماده شد',
          location: 'پردازش فایل',
          timestamp: new Date(),
          data: { summary: file_content }
        };
      case 'analyze':
        return {
          success: true,
          message: '📊 تحلیل فایل انجام شد',
          location: 'پردازش فایل',
          timestamp: new Date(),
          data: { analysis: file_content }
        };
      case 'extract_data':
        return {
          success: true,
          message: '📋 داده‌ها استخراج شد',
          location: 'پردازش فایل',
          timestamp: new Date(),
          data: { extracted: file_content }
        };
      default:
        return {
          success: true,
          message: '📎 فایل پردازش شد',
          location: 'پردازش فایل',
          timestamp: new Date(),
          data: { content: file_content }
        };
    }
  }

  /**
   * Create a new contact from extracted data (e.g., business card)
   */
  private async createContact(params: Record<string, unknown>): Promise<ActionResult> {
    const { name, phone, email, organization, role, address, notes } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    // If organization is specified, save to company_contacts (professional)
    // Otherwise save to personal_contacts
    if (organization) {
      const contactData = {
        id: crypto.randomUUID(),
        name: name as string,
        phone: phone as string || null,
        email: email as string || null,
        organization: organization as string || null,
        role: role as string || null,
        address: address as string || null,
        notes: notes as string || null,
        company_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('company_contacts')
        .insert(contactData);

      if (error) {
        console.error('[ActionExecutor] Contact creation error:', error);
        return { success: false, message: 'خطا در ذخیره مخاطب', error: error.message };
      }

      return {
        success: true,
        message: `✅ مخاطب «${name}» در لیست مخاطبین حرفه‌ای ذخیره شد`,
        location: 'لیست مخاطبین حرفه‌ای',
        timestamp: new Date(),
        data: contactData
      };
    } else {
      // Save to personal_contacts
      const contactData = {
        user_id: user.id,
        full_name: name as string,
        phone: phone as string || null,
        email: email as string || null,
        organization: null,
        role: role as string || null,
        address: address as string || null,
        notes: notes as string || null,
        category: 'general',
      };

      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('personal_contacts' as any)
        .insert(contactData);

      if (error) {
        console.error('[ActionExecutor] Personal contact creation error:', error);
        return { success: false, message: 'خطا در ذخیره مخاطب', error: error.message };
      }

      return {
        success: true,
        message: `✅ مخاطب «${name}» در لیست مخاطبین شخصی ذخیره شد 📇`,
        location: 'لیست مخاطبین شخصی',
        timestamp: new Date(),
        data: contactData
      };
    }
  }

  /**
   * Save meeting recording with transcript
   */
  private async saveMeetingRecording(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, transcript, meeting_date, participants, duration_minutes, audio_url, linked_calendar_event_id } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const recordingData = {
      id: crypto.randomUUID(),
      user_id: user.id,
      dock_recording_id: crypto.randomUUID(),
      title: title as string,
      transcript: transcript as string,
      recorded_at: (meeting_date as string) || new Date().toISOString(),
      participants: (participants as string[]) || [],
      duration: (duration_minutes as number) || 0,
      audio_url: audio_url as string || null,
      linked_calendar_event_id: linked_calendar_event_id as string || null,
      processing_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('hi_dock_recordings')
      .insert(recordingData);

    if (error) {
      console.error('[ActionExecutor] Recording save error:', error);
      return {
        success: false,
        message: 'خطا در ذخیره ضبط جلسه',
        error: error.message
      };
    }

    return {
      success: true,
      message: `✅ ضبط صوتی «${title}» در آرشیو جلسات ذخیره شد`,
      location: 'آرشیو ضبط جلسات',
      timestamp: new Date(),
      data: recordingData
    };
  }

  /**
   * Create multiple tasks at once (batch)
   */
  private async createTasksBatch(params: Record<string, unknown>): Promise<ActionResult> {
    const { tasks, domain } = params;
    const taskList = tasks as Array<{ title: string; due_date?: string; priority?: string; assignee?: string }>;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const domainLabel = domain === 'personal' ? 'شخصی' : 
                       domain === 'professional' ? 'حرفه‌ای' : 'سازمانی';

    let successCount = 0;
    let failCount = 0;

    for (const task of taskList) {
      const parsedDueDate = task.due_date ? this.parseDateTime(task.due_date) : null;
      
      const taskData = {
        id: crypto.randomUUID(),
        title: task.title,
        description: task.assignee ? `مسئول: ${task.assignee}` : '',
        dueDate: parsedDueDate?.toISOString(),
        priority: (task.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
        status: 'todo' as const,
        domain: (domain as 'personal' | 'professional' | 'organizational') || 'professional',
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending' as const
      };

      try {
        await offlineStorage.saveTask(taskData);
        await syncService.queueAction('create', 'task', taskData.id, {
          ...taskData,
          user_id: user.id
        });
        successCount++;
      } catch (err) {
        failCount++;
        console.error('[ActionExecutor] Batch task error:', err);
      }
    }

    return {
      success: true,
      message: `✅ ${successCount} وظیفه در لیست وظایف ${domainLabel} اضافه شد` + 
               (failCount > 0 ? ` (${failCount} خطا)` : ''),
      location: `لیست وظایف ${domainLabel}`,
      timestamp: new Date(),
      data: { successCount, failCount }
    };
  }

  /**
   * Import contacts from Excel/CSV in batch
   */
  private async importContactsBatch(params: Record<string, unknown>): Promise<ActionResult> {
    const { contacts, skip_duplicates } = params;
    const contactList = contacts as Array<{ name: string; phone?: string; email?: string; organization?: string; role?: string }>;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    let successCount = 0;
    let duplicateCount = 0;
    let failCount = 0;

    for (const contact of contactList) {
      // Check for duplicates if needed
      if (skip_duplicates) {
        const { data: existing } = await supabase
          .from('company_contacts')
          .select('id')
          .or(`name.eq.${contact.name},email.eq.${contact.email || ''},phone.eq.${contact.phone || ''}`)
          .limit(1);

        if (existing && existing.length > 0) {
          duplicateCount++;
          continue;
        }
      }

      const contactData = {
        id: crypto.randomUUID(),
        name: contact.name,
        phone: contact.phone || null,
        email: contact.email || null,
        organization: contact.organization || null,
        role: contact.role || null,
        company_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('company_contacts')
        .insert(contactData);

      if (error) {
        failCount++;
        console.error('[ActionExecutor] Batch contact error:', error);
      } else {
        successCount++;
      }
    }

    return {
      success: true,
      message: `✅ ${successCount} مخاطب جدید اضافه شد` +
               (duplicateCount > 0 ? ` • ${duplicateCount} تکراری رد شد` : '') +
               (failCount > 0 ? ` • ${failCount} خطا` : ''),
      location: 'لیست مخاطبین حرفه‌ای',
      timestamp: new Date(),
      data: { successCount, duplicateCount, failCount }
    };
  }

  /**
   * Request missing information from user
   */
  private async requestMissingInfo(params: Record<string, unknown>): Promise<ActionResult> {
    const { data_type, extracted_data, missing_fields, suggestions } = params;

    // This action returns info for the UI to display a form
    return {
      success: true,
      message: `لطفاً اطلاعات زیر را تکمیل کنید:`,
      location: 'درخواست اطلاعات',
      timestamp: new Date(),
      data: {
        needsInput: true,
        dataType: data_type,
        extractedData: extracted_data,
        missingFields: missing_fields,
        suggestions: suggestions
      }
    };
  }

  /**
   * Parse Persian date/time to JavaScript Date
   */
  private parseDateTime(dateStr?: string, timeStr?: string): Date {
    const now = new Date();
    const result = new Date(now);

    if (!dateStr) return result;

    const lowerDate = dateStr.toLowerCase();

    // Handle relative dates
    if (lowerDate.includes('امروز')) {
      // Today - no change needed
    } else if (lowerDate.includes('فردا')) {
      result.setDate(result.getDate() + 1);
    } else if (lowerDate.includes('پس‌فردا') || lowerDate.includes('پسفردا')) {
      result.setDate(result.getDate() + 2);
    } else if (lowerDate.includes('هفته آینده') || lowerDate.includes('هفته بعد')) {
      result.setDate(result.getDate() + 7);
    } else if (lowerDate.includes('آخر هفته')) {
      // Find next Thursday or Friday
      const day = result.getDay();
      const daysUntilThursday = (4 - day + 7) % 7 || 7;
      result.setDate(result.getDate() + daysUntilThursday);
    }

    // Parse time if provided
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2})[:\s]?(\d{2})?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || '0');

        // Handle Persian AM/PM
        if (timeStr.includes('بعدازظهر') || timeStr.includes('عصر') || timeStr.includes('شب')) {
          if (hours < 12) hours += 12;
        } else if (timeStr.includes('صبح') && hours === 12) {
          hours = 0;
        }

        result.setHours(hours, minutes, 0, 0);
      }
    }

    return result;
  }

  /**
   * Format date to Persian string
   */
  private formatPersianDateTime(date: Date): string {
    try {
      const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateFormatter.format(date)} ساعت ${timeFormatter.format(date)}`;
    } catch {
      return date.toLocaleString('fa-IR');
    }
  }

  /**
   * Save content for later reading / ذخیره برای بعد
   * Now saves to BOTH knowledge_items AND cultural_content for visibility in UI
   */
  private async saveForLater(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, content, source_url, category, tags } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    // Map category to Persian and content type
    const categoryMap: Record<string, { persian: string; contentType: string }> = {
      'book': { persian: 'کتاب', contentType: 'book' },
      'article': { persian: 'مقاله', contentType: 'article' },
      'video': { persian: 'ویدیو', contentType: 'youtube' },
      'podcast': { persian: 'پادکست', contentType: 'podcast' },
      'audiobook': { persian: 'کتاب صوتی', contentType: 'audiobook' },
      'link': { persian: 'لینک', contentType: 'article' },
      'other': { persian: 'سایر', contentType: 'article' }
    };

    const categoryInfo = categoryMap[category as string] || { persian: 'لیست مطالعه', contentType: 'book' };
    const itemId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Save to knowledge_items (for AI search)
    const knowledgeItemData = {
      id: itemId,
      title: title as string,
      content: (content as string) || '',
      source_url: (source_url as string) || null,
      category: (category as string) || 'reading_list',
      para_category: 'resources',
      tags: (tags as string[]) || ['لیست مطالعه'],
      user_id: user.id,
      created_at: now,
      updated_at: now
    };

    const { error: knowledgeError } = await supabase
      .from('knowledge_items')
      .insert(knowledgeItemData);

    if (knowledgeError) {
      console.error('[ActionExecutor] knowledge_items save error:', knowledgeError);
    }

    // 2. Save to cultural_content (for Cultural Content Page UI)
    const culturalContentData = {
      id: itemId,
      title: title as string,
      content: (content as string) || (source_url as string) || '',
      content_type: categoryInfo.contentType,
      language: 'fa',
      reference: (source_url as string) || null,
      tags: (tags as string[]) || ['لیست مطالعه'],
      created_at: now
    };

    const { error: culturalError } = await supabase
      .from('cultural_content')
      .insert(culturalContentData);

    if (culturalError) {
      console.error('[ActionExecutor] cultural_content save error:', culturalError);
    }

    // 3. Save to IndexedDB for offline access
    try {
      await offlineStorage.saveKnowledgeItem({
        id: itemId,
        title: title as string,
        content: (content as string) || '',
        category: (category as string) || 'reading_list',
        source_url: (source_url as string) || undefined,
        tags: (tags as string[]) || ['لیست مطالعه'],
        createdAt: now,
        syncStatus: 'synced'
      });
    } catch (offlineError) {
      console.log('[ActionExecutor] IndexedDB save skipped (store may not exist):', offlineError);
    }

    if (knowledgeError && culturalError) {
      return {
        success: false,
        message: `خطا در ذخیره: ${knowledgeError.message}`,
        error: 'SAVE_ERROR'
      };
    }

    return {
      success: true,
      message: `✅ «${title}» در لیست مطالعه ذخیره شد 📚`,
      location: `مدیریت محتوای فرهنگی > ${categoryInfo.persian}`,
      timestamp: new Date(),
      data: { ...knowledgeItemData, culturalContentSaved: !culturalError }
    };
  }

  // ============ NEW DOMAIN METHODS ============

  /**
   * Save health metrics / ثبت اطلاعات سلامت
   * Fixed: Use insert/update instead of upsert to avoid constraint issues
   */
  private async saveHealthMetrics(params: Record<string, unknown>): Promise<ActionResult> {
    const { weight, blood_pressure, heart_rate, sleep_hours, exercise_minutes, water_intake, notes } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Build clean data object - only include non-null values
    const metricsData: Record<string, unknown> = {
      user_id: user.id,
      date: today,
    };
    
    if (weight !== undefined && weight !== null) metricsData.weight = Number(weight);
    if (blood_pressure) metricsData.blood_pressure = String(blood_pressure);
    if (heart_rate !== undefined && heart_rate !== null) metricsData.heart_rate = Number(heart_rate);
    if (sleep_hours !== undefined && sleep_hours !== null) metricsData.sleep_hours = Number(sleep_hours);
    if (exercise_minutes !== undefined && exercise_minutes !== null) metricsData.exercise_minutes = Number(exercise_minutes);
    if (water_intake !== undefined && water_intake !== null) metricsData.water_intake = Number(water_intake);
    if (notes) metricsData.notes = String(notes);

    // Check if record exists for today
    const { data: existing } = await supabase
      .from('health_metrics')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing record
      const result = await supabase
        .from('health_metrics')
        .update(metricsData)
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('health_metrics')
        .insert({
          user_id: user.id,
          date: today,
          weight: metricsData.weight as number | undefined,
          blood_pressure: metricsData.blood_pressure as string | undefined,
          heart_rate: metricsData.heart_rate as number | undefined,
          sleep_hours: metricsData.sleep_hours as number | undefined,
          exercise_minutes: metricsData.exercise_minutes as number | undefined,
          water_intake: metricsData.water_intake as number | undefined,
          notes: metricsData.notes as string | undefined,
        });
      error = result.error;
    }

    if (error) {
      console.error('[ActionExecutor] Health metrics save error:', error);
      return {
        success: false,
        message: `خطا در ذخیره: ${error.message}`,
        error: error.message
      };
    }

    // Build summary message
    const parts = [];
    if (exercise_minutes) parts.push(`${exercise_minutes} دقیقه ورزش`);
    if (sleep_hours) parts.push(`${sleep_hours} ساعت خواب`);
    if (water_intake) parts.push(`${water_intake} لیوان آب`);
    if (weight) parts.push(`وزن: ${weight} کیلو`);
    if (blood_pressure) parts.push(`فشار خون: ${blood_pressure}`);
    if (heart_rate) parts.push(`ضربان: ${heart_rate}`);

    const summary = parts.length > 0 ? parts.join('، ') : 'اطلاعات سلامت';

    return {
      success: true,
      message: `✅ ${summary} در سلامت و بهره‌وری ثبت شد 🏃`,
      location: 'سلامت و بهره‌وری',
      timestamp: new Date(),
      data: metricsData
    };
  }

  /**
   * Add resume item / اضافه کردن به رزومه
   * Fixed: Now saves to actual resume tables instead of knowledge_items
   */
  private async addResumeItem(params: Record<string, unknown>): Promise<ActionResult> {
    const { section, title, organization, start_date, end_date, description, location } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const sectionLabels: Record<string, string> = {
      'education': 'تحصیلات',
      'work': 'سوابق کاری',
      'skills': 'مهارت‌ها',
      'certificates': 'گواهینامه‌ها',
      'awards': 'افتخارات',
      'affiliations': 'عضویت‌ها'
    };

    const sectionLabel = sectionLabels[section as string] || 'رزومه';
    let error: { message: string } | null = null;
    let insertedData: Record<string, unknown> = {};

    try {
      if (section === 'work') {
        // resume_work_experience: job_title, company_name, start_date are required
        const workData = {
          user_id: user.id,
          job_title: title as string,
          company_name: (organization as string) || '',
          start_date: this.parseResumeDate(start_date as string) || new Date().toISOString().split('T')[0],
          end_date: end_date ? this.parseResumeDate(end_date as string) : null,
          description: (description as string) || null,
          location: (location as string) || null,
        };
        const result = await supabase.from('resume_work_experience').insert(workData);
        error = result.error;
        insertedData = workData;

      } else if (section === 'education') {
        // resume_education: degree, university, field_of_study, start_year, user_id
        const eduData = {
          user_id: user.id,
          degree: title as string,
          university: (organization as string) || '',
          field_of_study: (description as string) || undefined,
          start_year: this.parseYear(start_date as string) || undefined,
          end_year: end_date ? this.parseYear(end_date as string) : undefined,
        };
        const result = await supabase.from('resume_education').insert(eduData);
        error = result.error;
        insertedData = eduData;

      } else if (section === 'certificates') {
        // resume_certificates: title, issuing_organization, issue_date, user_id
        const certData = {
          user_id: user.id,
          title: title as string,
          issuing_organization: (organization as string) || '',
          issue_date: this.parseResumeDate(start_date as string) || new Date().toISOString().split('T')[0],
          expiry_date: end_date ? this.parseResumeDate(end_date as string) : null,
          description: (description as string) || null,
        };
        const result = await supabase.from('resume_certificates').insert(certData);
        error = result.error;
        insertedData = certData;

      } else if (section === 'awards') {
        // resume_awards requires: title, issuing_organization, award_date
        const awardData = {
          user_id: user.id,
          title: title as string,
          issuing_organization: (organization as string) || '',
          award_date: this.parseResumeDate(start_date as string) || new Date().toISOString().split('T')[0],
          description: (description as string) || null,
        };
        const result = await supabase.from('resume_awards').insert(awardData);
        error = result.error;
        insertedData = awardData;

      } else if (section === 'skills') {
        // resume_skills requires: skill_name, user_id
        const skillData = {
          user_id: user.id,
          skill_name: title as string,
          proficiency_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        };
        const result = await supabase.from('resume_skills').insert(skillData);
        error = result.error;
        insertedData = skillData;

      } else if (section === 'affiliations') {
        // resume_affiliations requires: organization_name, position, start_date, user_id
        const affData = {
          user_id: user.id,
          organization_name: (organization as string) || (title as string),
          position: title as string,
          start_date: this.parseResumeDate(start_date as string) || new Date().toISOString().split('T')[0],
          end_date: end_date ? this.parseResumeDate(end_date as string) : null,
        };
        const result = await supabase.from('resume_affiliations').insert(affData);
        error = result.error;
        insertedData = affData;

      } else {
        // Fallback to knowledge_items for unknown sections
        const genericData = {
          id: crypto.randomUUID(),
          title: title as string,
          content: `${organization || ''}\n${description || ''}`.trim(),
          category: `resume_${section}`,
          para_category: 'professional',
          tags: ['رزومه', sectionLabel],
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const result = await supabase.from('knowledge_items').insert(genericData);
        error = result.error;
        insertedData = genericData;
      }
    } catch (e) {
      error = { message: e instanceof Error ? e.message : 'خطای نامشخص' };
    }

    if (error) {
      console.error('[ActionExecutor] Resume item save error:', error);
      return { success: false, message: `خطا در ذخیره ${sectionLabel}`, error: error.message };
    }

    return {
      success: true,
      message: `✅ «${title}» در رزومه حرفه‌ای > ${sectionLabel} اضافه شد 📄`,
      location: `رزومه حرفه‌ای > ${sectionLabel}`,
      timestamp: new Date(),
      data: insertedData
    };
  }

  // Helper: Parse Persian date to ISO format
  private parseResumeDate(dateStr: string): string | null {
    if (!dateStr) return null;
    // Handle Persian digits
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    let normalized = dateStr;
    for (let i = 0; i < 10; i++) {
      normalized = normalized.replace(new RegExp(persianDigits[i], 'g'), String(i));
    }
    
    // If just a year like 1402 or 2023
    if (/^\d{4}$/.test(normalized)) {
      return `${normalized}-01-01`;
    }
    
    // If ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    
    return null;
  }

  // Helper: Extract year from date string
  private parseYear(dateStr: string): number | null {
    if (!dateStr) return null;
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    let normalized = dateStr;
    for (let i = 0; i < 10; i++) {
      normalized = normalized.replace(new RegExp(persianDigits[i], 'g'), String(i));
    }
    const match = normalized.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Create CSR project / ایجاد پروژه مسئولیت اجتماعی
   */
  private async createCSRProject(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, description, type, budget, start_date, end_date, beneficiaries, partners } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const typeMap: Record<string, string> = {
      'charity': 'خیریه',
      'environmental': 'محیط‌زیستی',
      'educational': 'آموزشی',
      'health': 'سلامت',
      'community': 'اجتماعی'
    };

    const csrData = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title as string,
      description: description as string || '',
      type: type as string || 'charity',
      budget: budget as number || null,
      start_date: start_date as string || null,
      end_date: end_date as string || null,
      beneficiaries: beneficiaries as string[] || [],
      partners: partners as string[] || [],
      status: 'planning',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('csr_projects')
      .insert(csrData);

    if (error) {
      console.error('[ActionExecutor] CSR project save error:', error);
      return {
        success: false,
        message: 'خطا در ایجاد پروژه مسئولیت اجتماعی',
        error: error.message
      };
    }

    const typeLabel = typeMap[type as string] || 'عمومی';

    return {
      success: true,
      message: `✅ پروژه «${title}» (${typeLabel}) در مسئولیت اجتماعی ثبت شد 🌱`,
      location: 'مسئولیت اجتماعی',
      timestamp: new Date(),
      data: csrData
    };
  }

  /**
   * Save idea / ذخیره ایده
   */
  private async saveIdea(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, description, category, domain, tags, priority } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const categoryMap: Record<string, string> = {
      'business': 'کسب‌وکار',
      'product': 'محصول',
      'process': 'فرآیند',
      'marketing': 'بازاریابی',
      'technology': 'فناوری',
      'personal': 'شخصی'
    };

    const validPriority = ['low', 'medium', 'high', 'urgent'].includes(priority as string) 
      ? priority as 'low' | 'medium' | 'high' | 'urgent'
      : 'medium' as const;

    const ideaData = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title as string,
      description: description as string || '',
      category: category as string || 'business',
      domain: domain as string || 'professional',
      tags: tags as string[] || [],
      priority: validPriority,
      status: 'draft',
      stage: 'idea',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('ideas')
      .insert([ideaData]);

    if (error) {
      console.error('[ActionExecutor] Idea save error:', error);
      return {
        success: false,
        message: 'خطا در ذخیره ایده',
        error: error.message
      };
    }

    const categoryLabel = categoryMap[category as string] || 'عمومی';

    return {
      success: true,
      message: `✅ ایده «${title}» (${categoryLabel}) در بانک ایده‌ها ذخیره شد 💡`,
      location: 'بانک ایده‌ها',
      timestamp: new Date(),
      data: ideaData
    };
  }

  /**
   * Get pending tasks / دریافت وظایف در انتظار
   */
  private async getPendingTasks(params: Record<string, unknown>): Promise<ActionResult> {
    const { domain, include_overdue, days_ahead } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const futureDate = new Date(now.getTime() + ((days_ahead as number) || 7) * 24 * 60 * 60 * 1000).toISOString();

    // Query delegation_tasks for tasks
    const query = supabase
      .from('delegation_tasks')
      .select('id, title, due_date, priority, status')
      .eq('delegator_id', user.id)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    const { data: tasks, error } = await query.limit(50);

    if (error) {
      console.error('[ActionExecutor] Pending tasks error:', error);
      return {
        success: false,
        message: 'خطا در دریافت وظایف',
        error: error.message
      };
    }

    // Categorize tasks
    const overdue: Record<string, unknown>[] = [];
    const dueToday: Record<string, unknown>[] = [];
    const upcoming: Record<string, unknown>[] = [];

    for (const task of tasks || []) {
      if (!task.due_date) {
        upcoming.push(task);
        continue;
      }
      
      const taskDate = task.due_date.split('T')[0];
      if (taskDate < today) {
        overdue.push(task);
      } else if (taskDate === today) {
        dueToday.push(task);
      } else {
        upcoming.push(task);
      }
    }

    // Build message
    let message = '📋 وضعیت کارهای شما:\n\n';

    if (overdue.length > 0) {
      message += `⚠️ عقب‌افتاده (${overdue.length} مورد):\n`;
      overdue.slice(0, 5).forEach((t, i) => {
        message += `${i + 1}. ${t.title}\n`;
      });
      message += '\n';
    }

    if (dueToday.length > 0) {
      message += `📅 امروز (${dueToday.length} مورد):\n`;
      dueToday.slice(0, 5).forEach((t, i) => {
        message += `${i + 1}. ${t.title}\n`;
      });
      message += '\n';
    }

    if (upcoming.length > 0) {
      message += `🔜 این هفته (${upcoming.length} مورد):\n`;
      upcoming.slice(0, 5).forEach((t, i) => {
        message += `${i + 1}. ${t.title}\n`;
      });
    }

    if (overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0) {
      message = '✨ هیچ وظیفه‌ای در انتظار ندارید!';
    }

    return {
      success: true,
      message,
      location: 'وضعیت وظایف',
      timestamp: new Date(),
      data: { overdue, dueToday, upcoming }
    };
  }

  /**
   * Complete habit / ثبت عادت
   */
  private async completeHabit(params: Record<string, unknown>): Promise<ActionResult> {
    const { habit_name, notes } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Find habit by name
    const { data: habits, error: findError } = await supabase
      .from('habits')
      .select('id, title')
      .eq('user_id', user.id)
      .ilike('title', `%${habit_name}%`)
      .limit(1);

    if (findError || !habits || habits.length === 0) {
      // Create new habit if not found
      const newHabitData = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: habit_name as string,
        emoji: '✔️',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: createError } = await supabase
        .from('habits')
        .insert(newHabitData);

      if (createError) {
        console.error('[ActionExecutor] Habit create error:', createError);
        return {
          success: false,
          message: 'خطا در ایجاد عادت',
          error: createError.message
        };
      }

      // Record completion
      await supabase.from('habit_completions').insert({
        id: crypto.randomUUID(),
        habit_id: newHabitData.id,
        user_id: user.id,
        completion_date: today,
        completed: true,
        notes: notes as string || null,
        completed_at: new Date().toISOString()
      });

      return {
        success: true,
        message: `✅ عادت جدید «${habit_name}» ایجاد و برای امروز ثبت شد ✔️`,
        location: 'عادت‌ها',
        timestamp: new Date(),
        data: newHabitData
      };
    }

    const habit = habits[0];

    // Record completion
    const completionData = {
      id: crypto.randomUUID(),
      habit_id: habit.id,
      user_id: user.id,
      completion_date: today,
      completed: true,
      notes: notes as string || null,
      completed_at: new Date().toISOString()
    };

    const { error: completeError } = await supabase
      .from('habit_completions')
      .upsert(completionData, { onConflict: 'habit_id,completion_date' });

    if (completeError) {
      console.error('[ActionExecutor] Habit completion error:', completeError);
      return {
        success: false,
        message: 'خطا در ثبت عادت',
        error: completeError.message
      };
    }

    return {
      success: true,
      message: `✅ عادت «${habit.title}» برای امروز ثبت شد ✔️`,
      location: 'عادت‌ها',
      timestamp: new Date(),
      data: completionData
    };
  }

  /**
   * Save knowledge / ذخیره دانش در مدیریت دانش
   */
  private async saveKnowledge(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, content, category, tags } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const knowledgeId = crypto.randomUUID();

    const knowledgeData = {
      id: knowledgeId,
      author_id: user.id,
      title: title as string,
      content: (content as string) || '',
      category: (category as string) || 'یادداشت',
      tags: (tags as string[]) || ['دانش'],
      created_at: now,
      updated_at: now
    };

    const { error } = await supabase
      .from('knowledge_base')
      .insert(knowledgeData);

    if (error) {
      console.error('[ActionExecutor] Knowledge save error:', error);
      return {
        success: false,
        message: `خطا در ذخیره دانش: ${error.message}`,
        error: error.message
      };
    }

    return {
      success: true,
      message: `✅ «${title}» در مدیریت دانش ذخیره شد 🧠`,
      location: `مدیریت دانش > ${category || 'یادداشت'}`,
      timestamp: new Date(),
      data: knowledgeData
    };
  }

  /**
   * Create legal case / ایجاد پرونده حقوقی
   */
  private async createLegalCase(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, case_number, case_type, court, opposing_party, description, next_hearing_date } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const caseData = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title as string,
      case_number: (case_number as string) || `CASE-${Date.now()}`,
      case_type: case_type as string || 'civil',
      court: court as string || null,
      opposing_party: opposing_party as string || null,
      description: description as string || '',
      next_hearing_date: next_hearing_date ? this.parseDateTime(next_hearing_date as string).toISOString() : null,
      status: 'active',
      created_at: now,
      updated_at: now
    };

    const { error } = await supabase
      .from('legal_cases')
      .insert([caseData]);

    if (error) {
      console.error('[ActionExecutor] Legal case error:', error);
      return { success: false, message: `خطا: ${error.message}`, error: error.message };
    }

    return {
      success: true,
      message: `✅ پرونده حقوقی «${title}» در بخش امور حقوقی ایجاد شد ⚖️`,
      location: 'امور حقوقی > پرونده‌ها',
      timestamp: new Date(),
      data: caseData
    };
  }

  /**
   * Save lawyer note / یادداشت حقوقی
   */
  private async saveLawyerNote(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, content, case_title, category } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const noteData = {
      id: crypto.randomUUID(),
      author_id: user.id,
      title: title as string,
      content: content as string,
      category: 'یادداشت‌های حقوقی',
      tags: ['حقوقی', category as string || 'general', case_title as string].filter(Boolean) as string[],
      created_at: now,
      updated_at: now
    };

    const { error } = await supabase
      .from('knowledge_base')
      .insert([noteData]);

    if (error) {
      console.error('[ActionExecutor] Lawyer note error:', error);
      return { success: false, message: `خطا: ${error.message}`, error: error.message };
    }

    return {
      success: true,
      message: `✅ یادداشت حقوقی «${title}» در مدیریت دانش ذخیره شد ⚖️`,
      location: 'مدیریت دانش > یادداشت‌های حقوقی',
      timestamp: new Date(),
      data: noteData
    };
  }

  /**
   * Create organization mission / ماموریت سازمانی
   */
  private async createOrganizationMission(params: Record<string, unknown>): Promise<ActionResult> {
    const { title, description, priority, due_date } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const now = new Date().toISOString();
    const parsedDueDate = due_date ? this.parseDateTime(due_date as string) : null;
    
    // Save as a task with organizational domain and special tag
    const missionData = {
      id: crypto.randomUUID(),
      title: title as string,
      description: description as string || '',
      dueDate: parsedDueDate?.toISOString(),
      priority: (priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      status: 'todo' as const,
      domain: 'organizational' as const,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending' as const
    };

    // Save to offline storage as task
    await offlineStorage.saveTask(missionData);

    // Queue for sync
    await syncService.queueAction('create', 'task', missionData.id, {
      ...missionData,
      user_id: user.id
    });

    const dueDateStr = parsedDueDate ? ` - موعد: ${this.formatPersianDateTime(parsedDueDate)}` : '';

    return {
      success: true,
      message: `✅ ماموریت «${title}» در برنامه‌ریزی سازمانی ایجاد شد 🎯${dueDateStr}`,
      location: 'سازمانی > ماموریت‌ها',
      timestamp: new Date(),
      data: missionData
    };
  }
  /**
   * Send SMS via backend
   */
  private async sendSms(params: Record<string, unknown>): Promise<ActionResult> {
    const { phone, message } = params;
    if (!phone || !message) {
      return { success: false, message: 'شماره موبایل و متن پیامک الزامی هستند', error: 'MISSING_PARAMS' };
    }

    const token = localStorage.getItem('mora_access_token');
    if (!token) {
      return { success: false, message: 'لطفاً وارد شوید', error: 'UNAUTHORIZED' };
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mora-backend.liara.run';
    const response = await fetch(`${backendUrl}/smart-assistant/execute-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone, message }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, message: err.error || `خطا در ارسال پیامک (${response.status})`, error: 'SMS_FAILED' };
    }

    return {
      success: true,
      message: `✅ پیامک به ${phone} ارسال شد 📱`,
      location: 'پیامک',
      timestamp: new Date(),
    };
  }
}

export const actionExecutor = new ActionExecutorService();
