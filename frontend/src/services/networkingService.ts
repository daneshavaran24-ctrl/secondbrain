import { supabase } from "@/integrations/supabase/client";

export interface NetworkingContact {
  id: string;
  user_id: string;
  company_id?: string | null;
  organization_id?: string | null;
  name: string;
  title?: string | null;
  organization_name?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  photo_url?: string | null;
  category: string;
  relationship_strength: number;
  networking_goal?: string | null;
  how_met?: string | null;
  met_at_event?: string | null;
  met_date?: string | null;
  status: string;
  last_interaction_date?: string | null;
  next_followup_date?: string | null;
  tags?: string[];
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NetworkingInteraction {
  id: string;
  contact_id: string;
  user_id: string;
  interaction_type: string;
  title: string;
  description?: string | null;
  interaction_date: string;
  duration?: number | null;
  outcome?: string | null;
  follow_up_action?: string | null;
  follow_up_date?: string | null;
  created_at?: string;
}

export interface NetworkingGoal {
  id: string;
  user_id: string;
  company_id?: string | null;
  organization_id?: string | null;
  title: string;
  description?: string | null;
  target_count: number;
  current_count: number;
  category?: string | null;
  deadline?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface NetworkingEvent {
  id: string;
  user_id: string;
  company_id?: string | null;
  organization_id?: string | null;
  title: string;
  event_type?: string | null;
  location?: string | null;
  event_date?: string | null;
  contacts_made: number;
  follow_ups_scheduled: number;
  notes?: string | null;
  created_at?: string;
}

export interface NetworkingStats {
  totalContacts: number;
  hotContacts: number;
  warmContacts: number;
  coldContacts: number;
  upcomingFollowups: number;
  goalsProgress: number;
  recentInteractions: number;
}

type ContactInsert = Omit<NetworkingContact, 'id' | 'created_at' | 'updated_at'>;
type ContactUpdate = Partial<Omit<NetworkingContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
type InteractionInsert = Omit<NetworkingInteraction, 'id' | 'created_at'>;
type GoalInsert = Omit<NetworkingGoal, 'id' | 'created_at' | 'updated_at'>;
type EventInsert = Omit<NetworkingEvent, 'id' | 'created_at'>;

export const networkingService = {
  // Contacts
  async getContacts(companyId?: string, organizationId?: string): Promise<NetworkingContact[]> {
    let query = supabase.from('networking_contacts').select('*');
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as NetworkingContact[];
  },

  async createContact(contact: ContactInsert): Promise<NetworkingContact> {
    const { data, error } = await supabase
      .from('networking_contacts')
      .insert(contact)
      .select()
      .single();
    if (error) throw error;
    return data as NetworkingContact;
  },

  async updateContact(id: string, updates: ContactUpdate): Promise<NetworkingContact> {
    const { data, error } = await supabase
      .from('networking_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as NetworkingContact;
  },

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('networking_contacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Interactions
  async getInteractions(contactId: string): Promise<NetworkingInteraction[]> {
    const { data, error } = await supabase
      .from('networking_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false });
    if (error) throw error;
    return (data || []) as NetworkingInteraction[];
  },

  async createInteraction(interaction: InteractionInsert): Promise<NetworkingInteraction> {
    const { data, error } = await supabase
      .from('networking_interactions')
      .insert(interaction)
      .select()
      .single();
    if (error) throw error;
    
    // Update last_interaction_date on contact
    await supabase
      .from('networking_contacts')
      .update({ last_interaction_date: interaction.interaction_date })
      .eq('id', interaction.contact_id);
    
    return data as NetworkingInteraction;
  },

  async deleteInteraction(id: string): Promise<void> {
    const { error } = await supabase
      .from('networking_interactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Goals
  async getGoals(companyId?: string, organizationId?: string): Promise<NetworkingGoal[]> {
    let query = supabase.from('networking_goals').select('*');
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as NetworkingGoal[];
  },

  async createGoal(goal: GoalInsert): Promise<NetworkingGoal> {
    const { data, error } = await supabase
      .from('networking_goals')
      .insert(goal)
      .select()
      .single();
    if (error) throw error;
    return data as NetworkingGoal;
  },

  async updateGoal(id: string, updates: Partial<NetworkingGoal>): Promise<NetworkingGoal> {
    const { data, error } = await supabase
      .from('networking_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as NetworkingGoal;
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('networking_goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Events
  async getEvents(companyId?: string, organizationId?: string): Promise<NetworkingEvent[]> {
    let query = supabase.from('networking_events').select('*');
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('event_date', { ascending: false });
    if (error) throw error;
    return (data || []) as NetworkingEvent[];
  },

  async createEvent(event: EventInsert): Promise<NetworkingEvent> {
    const { data, error } = await supabase
      .from('networking_events')
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data as NetworkingEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('networking_events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Stats
  async getStats(companyId?: string, organizationId?: string): Promise<NetworkingStats> {
    const contacts = await this.getContacts(companyId, organizationId);
    const goals = await this.getGoals(companyId, organizationId);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const upcomingFollowups = contacts.filter(c => {
      if (!c.next_followup_date) return false;
      const followupDate = new Date(c.next_followup_date);
      return followupDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }).length;
    
    const activeGoals = goals.filter(g => g.status === 'active');
    const goalsProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((acc, g) => acc + (g.current_count / g.target_count) * 100, 0) / activeGoals.length)
      : 0;
    
    const recentInteractions = contacts.filter(c => {
      if (!c.last_interaction_date) return false;
      return new Date(c.last_interaction_date) >= weekAgo;
    }).length;
    
    return {
      totalContacts: contacts.length,
      hotContacts: contacts.filter(c => c.status === 'hot').length,
      warmContacts: contacts.filter(c => c.status === 'warm').length,
      coldContacts: contacts.filter(c => c.status === 'cold').length,
      upcomingFollowups,
      goalsProgress,
      recentInteractions
    };
  },

  // Upcoming followups
  async getUpcomingFollowups(companyId?: string, organizationId?: string): Promise<NetworkingContact[]> {
    const contacts = await this.getContacts(companyId, organizationId);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return contacts
      .filter(c => c.next_followup_date && new Date(c.next_followup_date) <= nextWeek)
      .sort((a, b) => {
        const dateA = new Date(a.next_followup_date!);
        const dateB = new Date(b.next_followup_date!);
        return dateA.getTime() - dateB.getTime();
      });
  }
};
