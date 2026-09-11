import { supabase } from '@/integrations/supabase/client';

export interface CompanyProfile {
  id: string;
  company_id: string;
  vision?: string;
  mission?: string;
  values?: string[];
  established_date?: string;
  employee_count?: number;
  annual_revenue?: number;
  products_services?: any;
  target_customers?: string;
  major_clients?: string[];
  competitors?: any;
  short_term_goals?: string[];
  long_term_goals?: string[];
}

export interface CompanyTask {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  category?: string;
  priority: string;
  status: string;
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  tags?: string[];
  attachments?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyNote {
  id: string;
  company_id: string;
  title: string;
  content?: string;
  category?: string;
  tags?: string[];
  attachments?: any;
  is_important: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: string;
  company_id: string;
  name: string;
  role?: string;
  organization?: string;
  type?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const companyService = {
  // Profile
  async getProfile(companyId: string): Promise<CompanyProfile | null> {
    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  async createProfile(companyId: string): Promise<CompanyProfile | null> {
    const { data, error } = await supabase
      .from('company_profiles')
      .insert([{ company_id: companyId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  },

  async updateProfile(companyId: string, updates: Partial<CompanyProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('company_profiles')
      .update(updates)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  },

  // Tasks
  async getTasks(companyId: string, filters?: { status?: string; category?: string }): Promise<CompanyTask[]> {
    let query = supabase
      .from('company_tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  },

  async createTask(companyId: string, task: Partial<CompanyTask>): Promise<CompanyTask | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('company_tasks')
      .insert([{
        company_id: companyId,
        created_by: user?.id,
        title: task.title!,
        ...task,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  },

  async updateTask(taskId: string, updates: Partial<CompanyTask>): Promise<boolean> {
    const { error } = await supabase
      .from('company_tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  },

  async deleteTask(taskId: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  },

  // Notes
  async getNotes(companyId: string): Promise<CompanyNote[]> {
    const { data, error } = await supabase
      .from('company_notes')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return data || [];
  },

  async createNote(companyId: string, note: Partial<CompanyNote>): Promise<CompanyNote | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('company_notes')
      .insert([{
        company_id: companyId,
        created_by: user?.id,
        title: note.title!,
        ...note,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    return data;
  },

  async updateNote(noteId: string, updates: Partial<CompanyNote>): Promise<boolean> {
    const { error } = await supabase
      .from('company_notes')
      .update(updates)
      .eq('id', noteId);

    if (error) {
      console.error('Error updating note:', error);
      return false;
    }

    return true;
  },

  async deleteNote(noteId: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      return false;
    }

    return true;
  },

  // Contacts
  async getContacts(companyId: string, type?: string): Promise<CompanyContact[]> {
    let query = supabase
      .from('company_contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }

    return data || [];
  },

  async createContact(companyId: string, contact: Partial<CompanyContact>): Promise<CompanyContact | null> {
    const { data, error } = await supabase
      .from('company_contacts')
      .insert([{
        company_id: companyId,
        name: contact.name!,
        ...contact,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return null;
    }

    return data;
  },

  async updateContact(contactId: string, updates: Partial<CompanyContact>): Promise<boolean> {
    const { error } = await supabase
      .from('company_contacts')
      .update(updates)
      .eq('id', contactId);

    if (error) {
      console.error('Error updating contact:', error);
      return false;
    }

    return true;
  },

  async deleteContact(contactId: string): Promise<boolean> {
    const { error } = await supabase
      .from('company_contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      console.error('Error deleting contact:', error);
      return false;
    }

    return true;
  },

  // Dashboard Stats
  async getDashboardStats(companyId: string) {
    const [tasks, notes, contacts] = await Promise.all([
      this.getTasks(companyId),
      this.getNotes(companyId),
      this.getContacts(companyId),
    ]);

    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');

    // Get calls stats
    let callsThisWeek = 0;
    let callsNeedFollowUp = 0;
    
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      
      const { data: callsData } = await supabase
        .from('company_calls')
        .select('follow_up_date')
        .eq('company_id', companyId)
        .gte('call_date', weekAgo);
      
      callsThisWeek = callsData?.length || 0;
      callsNeedFollowUp = callsData?.filter(c => 
        c.follow_up_date && c.follow_up_date <= now
      ).length || 0;
    } catch (error) {
      // Calls feature might not be available yet
      console.log('Calls stats not available');
    }

    return {
      totalTasks: tasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      urgentTasks: urgentTasks.length,
      totalNotes: notes.length,
      importantNotes: notes.filter(n => n.is_important).length,
      totalContacts: contacts.length,
      contactsByType: {
        client: contacts.filter(c => c.type === 'client').length,
        supplier: contacts.filter(c => c.type === 'supplier').length,
        partner: contacts.filter(c => c.type === 'partner').length,
        employee: contacts.filter(c => c.type === 'employee').length,
      },
      callsThisWeek,
      callsNeedFollowUp,
    };
  },
};
