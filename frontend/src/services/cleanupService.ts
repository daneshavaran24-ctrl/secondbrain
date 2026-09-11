import { supabase } from '@/integrations/supabase/client';

interface CleanupStats {
  localStorageItems: number;
  supabaseRecords: {
    userProfiles: number;
    organizations: number;
    ideas: number;
    calendarEvents: number;
    knowledgeBase: number;
    gratitudeEntries: number;
    aiChatSessions: number;
    aiChatMessages: number;
    legalCases: number;
    legalDocuments: number;
    legalMeetings: number;
    organizationalMissions: number;
    organizationalPolicies: number;
    organizationalKpis: number;
    organizationClaims: number;
    delegationTasks: number;
    missionProgressLogs: number;
  };
}

class CleanupService {
  private static instance: CleanupService;

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname.includes('127.0.0.1');
  }

  private getTestDataKeys(): string[] {
    return [
      // Test data service keys
      'personalTasks',
      'projects',
      'projectTasks', 
      'projectMembers',
      'meetings',
      'knowledgeItems',
      'secretaryRequests',
      'secretaryNotifications',
      'healthData',
      'trendsData',
      'dailyContent',
      
      // Legal test data keys
      'legalCases',
      'legalDocuments', 
      'legalMeetings',
      'legalNotes',
      'legalTestDataInitialized',
      
      // Local auth keys (keep admin)
      'brainforge_users',
      'brainforge_current_session',
      'brainforge_current_user',
      
      // Cache and temp keys
      'cache_',
      'temp_',
      'session_',
      'debug_',
      
      // Tutorial and onboarding
      'tutorialCompleted',
      'onboardingCompleted',
      'featureIntroShown',
      'helpModalShown',
    ];
  }

  private createBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      localStorage: { ...localStorage },
      environment: {
        hostname: window.location.hostname,
        userAgent: navigator.userAgent,
        nodeEnv: process.env.NODE_ENV
      }
    };
    
    const backupString = JSON.stringify(backup, null, 2);
    const backupKey = `cleanup_backup_${Date.now()}`;
    
    try {
      localStorage.setItem(backupKey, backupString);
      return backupKey;
    } catch (error) {
      console.warn('Could not create backup due to storage limit:', error);
      return '';
    }
  }

  async getCleanupStats(): Promise<CleanupStats> {
    // Count localStorage items
    let localStorageItems = 0;
    const testKeys = this.getTestDataKeys();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && testKeys.some(testKey => key.includes(testKey))) {
        localStorageItems++;
      }
    }

    // Count Supabase records
    const supabaseRecords = {
      userProfiles: 0,
      organizations: 0,
      ideas: 0,
      calendarEvents: 0,
      knowledgeBase: 0,
      gratitudeEntries: 0,
      aiChatSessions: 0,
      aiChatMessages: 0,
      legalCases: 0,
      legalDocuments: 0,
      legalMeetings: 0,
      organizationalMissions: 0,
      organizationalPolicies: 0,
      organizationalKpis: 0,
      organizationClaims: 0,
      delegationTasks: 0,
      missionProgressLogs: 0,
    };

    try {
      // Count records in parallel
      const [
        profilesCount,
        orgsCount,
        ideasCount,
        eventsCount,
        knowledgeCount,
        gratitudeCount,
        chatMessagesCount,
        casesCount,
        missionsCount,
        policiesCount,
        claimsCount,
        delegationCount
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('ideas').select('id', { count: 'exact', head: true }),
        supabase.from('calendar_events').select('id', { count: 'exact', head: true }),
        supabase.from('knowledge_items').select('id', { count: 'exact', head: true }),
        supabase.from('gratitude_entries').select('id', { count: 'exact', head: true }),
        supabase.from('ai_chat_messages').select('id', { count: 'exact', head: true }),
        supabase.from('legal_cases').select('id', { count: 'exact', head: true }),
        supabase.from('organization_missions').select('id', { count: 'exact', head: true }),
        supabase.from('organization_policies').select('id', { count: 'exact', head: true }),
        supabase.from('organizational_claims').select('id', { count: 'exact', head: true }),
        supabase.from('delegation_tasks').select('id', { count: 'exact', head: true })
      ]);

      supabaseRecords.userProfiles = profilesCount.count || 0;
      supabaseRecords.organizations = orgsCount.count || 0;
      supabaseRecords.ideas = ideasCount.count || 0;
      supabaseRecords.calendarEvents = eventsCount.count || 0;
      supabaseRecords.knowledgeBase = knowledgeCount.count || 0;
      supabaseRecords.gratitudeEntries = gratitudeCount.count || 0;
      supabaseRecords.aiChatMessages = chatMessagesCount.count || 0;
      supabaseRecords.legalCases = casesCount.count || 0;
      supabaseRecords.organizationalMissions = missionsCount.count || 0;
      supabaseRecords.organizationalPolicies = policiesCount.count || 0;
      supabaseRecords.organizationClaims = claimsCount.count || 0;
      supabaseRecords.delegationTasks = delegationCount.count || 0;
    } catch (error) {
      console.error('Error counting Supabase records:', error);
    }

    return { localStorageItems, supabaseRecords };
  }

  async cleanupLocalStorage(): Promise<{ removed: number; preserved: string[] }> {
    if (!this.isDevelopment()) {
      throw new Error('Cleanup can only be performed in development environment');
    }

    const testKeys = this.getTestDataKeys();
    const preserved: string[] = [];
    let removed = 0;

    // Keep important settings
    const preserveKeys = [
      'theme',
      'language', 
      'ui-preferences',
      'admin_credentials',
      'sidebar-state'
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;

      const shouldPreserve = preserveKeys.some(preserve => key.includes(preserve));
      const isTestData = testKeys.some(testKey => key.includes(testKey));

      if (isTestData && !shouldPreserve) {
        localStorage.removeItem(key);
        removed++;
      } else if (shouldPreserve) {
        preserved.push(key);
      }
    }

    return { removed, preserved };
  }

  async cleanupSupabase(): Promise<{ tables: Record<string, number>; errors: string[] }> {
    if (!this.isDevelopment()) {
      throw new Error('Cleanup can only be performed in development environment');
    }

    const tables: Record<string, number> = {};
    const errors: string[] = [];

    // Delete in order to respect foreign key constraints
    const deleteOrder = [
      'ai_chat_messages',
      'ai_chat_sessions', 
      'delegation_subtasks',
      'delegation_attachments',
      'delegation_task_events',
      'delegation_tasks',
      'mission_progress_logs',
      'organization_claim_events', 
      'organization_claims',
      'organizational_kpis',
      'organizational_policies',
      'organizational_missions',
      'legal_documents',
      'legal_meetings', 
      'legal_cases',
      'gratitude_entries',
      'knowledge_base',
      'calendar_events',
      'ideas',
      'succession_development_programs',
      'succession_positions',
      'user_roles',
      'user_profiles',
      'organizations'
    ];

    for (const table of deleteOrder) {
      try {
        const { error, count } = await supabase
          .from(table as any)
          .delete()
          .neq('id', 'impossible-id'); // Delete all records
        
        if (error) {
          errors.push(`Error deleting from ${table}: ${error.message}`);
        } else {
          tables[table] = count || 0;
        }
      } catch (error) {
        errors.push(`Exception deleting from ${table}: ${error}`);
      }
    }

    return { tables, errors };
  }

  async performFullCleanup(): Promise<{
    success: boolean;
    message: string;
    details: {
      backupKey?: string;
      localStorage: { removed: number; preserved: string[] };
      supabase: { tables: Record<string, number>; errors: string[] };
    };
  }> {
    if (!this.isDevelopment()) {
      return {
        success: false,
        message: 'پاکسازی فقط در محیط توسعه امکان‌پذیر است',
        details: {
          localStorage: { removed: 0, preserved: [] },
          supabase: { tables: {}, errors: ['محیط توسعه نیست'] }
        }
      };
    }

    try {
      // Create backup
      const backupKey = this.createBackup();
      
      // Cleanup localStorage
      const localStorageResult = await this.cleanupLocalStorage();
      
      // Cleanup Supabase
      const supabaseResult = await this.cleanupSupabase();
      
      const hasErrors = supabaseResult.errors.length > 0;
      
      return {
        success: !hasErrors,
        message: hasErrors 
          ? `پاکسازی با خطاهایی انجام شد: ${supabaseResult.errors.length} خطا`
          : 'پاکسازی کامل با موفقیت انجام شد',
        details: {
          backupKey,
          localStorage: localStorageResult,
          supabase: supabaseResult
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `خطا در پاکسازی: ${error}`,
        details: {
          localStorage: { removed: 0, preserved: [] },
          supabase: { tables: {}, errors: [String(error)] }
        }
      };
    }
  }
}

export const cleanupService = CleanupService.getInstance();
