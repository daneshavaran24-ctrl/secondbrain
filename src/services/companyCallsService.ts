import { supabase } from '@/integrations/supabase/client';

export interface CompanyCall {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  call_type: 'phone' | 'video' | 'online_meeting';
  direction: 'outbound' | 'inbound';
  contact_id?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_organization?: string;
  call_date: string;
  duration: number;
  scheduled_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  outcome?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  summary?: string;
  follow_up_actions?: any[];
  follow_up_date?: string;
  category?: string;
  tags?: string[];
  has_recording: boolean;
  recording_url?: string;
  transcript?: string;
  created_at: string;
  updated_at: string;
}

export const companyCallsService = {
  async getCalls(companyId: string): Promise<CompanyCall[]> {
    const { data, error } = await supabase
      .from('company_calls')
      .select('*')
      .eq('company_id', companyId)
      .order('call_date', { ascending: false });

    if (error) throw error;
    return (data || []) as CompanyCall[];
  },

  async createCall(companyId: string, call: Partial<CompanyCall>): Promise<CompanyCall> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('company_calls')
      .insert([{
        company_id: companyId,
        user_id: userData.user?.id,
        ...call,
      } as any])
      .select()
      .single();

    if (error) throw error;
    return data as CompanyCall;
  },

  async updateCall(callId: string, updates: Partial<CompanyCall>): Promise<CompanyCall> {
    const { data, error } = await supabase
      .from('company_calls')
      .update(updates)
      .eq('id', callId)
      .select()
      .single();

    if (error) throw error;
    return data as CompanyCall;
  },

  async deleteCall(callId: string): Promise<void> {
    const { error } = await supabase
      .from('company_calls')
      .delete()
      .eq('id', callId);

    if (error) throw error;
  },

  async getCallStats(companyId: string) {
    const { data: calls, error } = await supabase
      .from('company_calls')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = calls?.filter(c => new Date(c.call_date) >= weekAgo).length || 0;
    const thisMonth = calls?.filter(c => new Date(c.call_date) >= monthAgo).length || 0;
    const totalDuration = calls?.reduce((sum, c) => sum + (c.duration || 0), 0) || 0;
    const avgDuration = calls?.length ? Math.round(totalDuration / calls.length) : 0;
    const needsFollowUp = calls?.filter(c => 
      c.follow_up_date && new Date(c.follow_up_date) <= now && c.status !== 'completed'
    ).length || 0;

    return {
      total: calls?.length || 0,
      thisWeek,
      thisMonth,
      avgDuration,
      needsFollowUp,
    };
  },

  async getUpcomingCalls(companyId: string): Promise<CompanyCall[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('company_calls')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'scheduled')
      .gte('scheduled_date', now)
      .order('scheduled_date', { ascending: true })
      .limit(10);

    if (error) throw error;
    return (data || []) as CompanyCall[];
  },

  async getCallsByContact(contactId: string): Promise<CompanyCall[]> {
    const { data, error } = await supabase
      .from('company_calls')
      .select('*')
      .eq('contact_id', contactId)
      .order('call_date', { ascending: false });

    if (error) throw error;
    return (data || []) as CompanyCall[];
  },
};
