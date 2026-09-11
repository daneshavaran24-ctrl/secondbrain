import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ICPProfileRow = Database['public']['Tables']['sales_icp_profiles']['Row'];
type FunnelStageRow = Database['public']['Tables']['sales_funnel_stages']['Row'];
type LeadRow = Database['public']['Tables']['sales_leads']['Row'];
type CampaignRow = Database['public']['Tables']['marketing_campaigns']['Row'];

export interface ICPProfile {
  id: string;
  organization_id: string;
  user_id: string;
  profile_name: string;
  industry?: string | null;
  company_size?: string | null;
  annual_revenue_range?: string | null;
  decision_makers?: string[];
  pain_points?: string[];
  buying_triggers?: string[];
  preferred_channels?: string[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunnelStage {
  id: string;
  organization_id: string;
  stage_name: string;
  stage_order: number;
  conversion_rate?: number | null;
  created_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  user_id: string;
  lead_name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  stage_id?: string | null;
  value?: number | null;
  currency?: string | null;
  probability?: number | null;
  expected_close_date?: string | null;
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  stage?: FunnelStage;
}

export interface Campaign {
  id: string;
  organization_id: string;
  user_id: string;
  campaign_name: string;
  campaign_type: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  spent?: number | null;
  currency?: string | null;
  target_audience?: Record<string, any>;
  goals?: string[];
  metrics?: Record<string, any>;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

function mapICPProfile(row: ICPProfileRow): ICPProfile {
  return {
    ...row,
    decision_makers: Array.isArray(row.decision_makers) ? row.decision_makers as string[] : [],
    pain_points: Array.isArray(row.pain_points) ? row.pain_points as string[] : [],
    buying_triggers: Array.isArray(row.buying_triggers) ? row.buying_triggers as string[] : [],
    preferred_channels: Array.isArray(row.preferred_channels) ? row.preferred_channels as string[] : [],
  };
}

function mapCampaign(row: CampaignRow): Campaign {
  return {
    ...row,
    target_audience: typeof row.target_audience === 'object' ? row.target_audience as Record<string, any> : {},
    goals: Array.isArray(row.goals) ? row.goals as string[] : [],
    metrics: typeof row.metrics === 'object' ? row.metrics as Record<string, any> : {},
  };
}

class SalesService {
  // ICP Profiles
  async getICPProfiles(organizationId: string): Promise<ICPProfile[]> {
    const { data, error } = await supabase
      .from('sales_icp_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapICPProfile);
  }

  async createICPProfile(profile: Partial<ICPProfile>): Promise<ICPProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sales_icp_profiles')
      .insert({
        organization_id: profile.organization_id!,
        user_id: user.id,
        profile_name: profile.profile_name!,
        industry: profile.industry,
        company_size: profile.company_size,
        annual_revenue_range: profile.annual_revenue_range,
        decision_makers: profile.decision_makers || [],
        pain_points: profile.pain_points || [],
        buying_triggers: profile.buying_triggers || [],
        preferred_channels: profile.preferred_channels || [],
        notes: profile.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapICPProfile(data);
  }

  async updateICPProfile(id: string, profile: Partial<ICPProfile>): Promise<ICPProfile> {
    const updateData: any = {};
    if (profile.profile_name) updateData.profile_name = profile.profile_name;
    if (profile.industry !== undefined) updateData.industry = profile.industry;
    if (profile.company_size !== undefined) updateData.company_size = profile.company_size;
    if (profile.annual_revenue_range !== undefined) updateData.annual_revenue_range = profile.annual_revenue_range;
    if (profile.decision_makers !== undefined) updateData.decision_makers = profile.decision_makers;
    if (profile.pain_points !== undefined) updateData.pain_points = profile.pain_points;
    if (profile.buying_triggers !== undefined) updateData.buying_triggers = profile.buying_triggers;
    if (profile.preferred_channels !== undefined) updateData.preferred_channels = profile.preferred_channels;
    if (profile.notes !== undefined) updateData.notes = profile.notes;

    const { data, error } = await supabase
      .from('sales_icp_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapICPProfile(data);
  }

  async deleteICPProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_icp_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Funnel Stages
  async getFunnelStages(organizationId: string): Promise<FunnelStage[]> {
    const { data, error } = await supabase
      .from('sales_funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('stage_order');

    if (error) throw error;
    return data || [];
  }

  async createFunnelStage(stage: Partial<FunnelStage>): Promise<FunnelStage> {
    const { data, error } = await supabase
      .from('sales_funnel_stages')
      .insert({
        organization_id: stage.organization_id!,
        stage_name: stage.stage_name!,
        stage_order: stage.stage_order!,
        conversion_rate: stage.conversion_rate,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFunnelStage(id: string, stage: Partial<FunnelStage>): Promise<FunnelStage> {
    const { data, error } = await supabase
      .from('sales_funnel_stages')
      .update(stage)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async initializeDefaultStages(organizationId: string): Promise<FunnelStage[]> {
    const defaultStages = [
      { organization_id: organizationId, stage_name: 'سرنخ جدید', stage_order: 1 },
      { organization_id: organizationId, stage_name: 'تماس اولیه', stage_order: 2 },
      { organization_id: organizationId, stage_name: 'ارائه پیشنهاد', stage_order: 3 },
      { organization_id: organizationId, stage_name: 'مذاکره', stage_order: 4 },
      { organization_id: organizationId, stage_name: 'بسته شده', stage_order: 5 },
    ];

    const { data, error } = await supabase
      .from('sales_funnel_stages')
      .insert(defaultStages)
      .select();

    if (error) throw error;
    return data || [];
  }

  // Leads
  async getLeads(organizationId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('sales_leads')
      .select(`
        *,
        stage:sales_funnel_stages(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sales_leads')
      .insert({
        organization_id: lead.organization_id!,
        user_id: user.id,
        lead_name: lead.lead_name!,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        stage_id: lead.stage_id,
        value: lead.value,
        currency: lead.currency,
        probability: lead.probability,
        expected_close_date: lead.expected_close_date,
        source: lead.source,
        notes: lead.notes,
      })
      .select(`
        *,
        stage:sales_funnel_stages(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('sales_leads')
      .update(lead)
      .eq('id', id)
      .select(`
        *,
        stage:sales_funnel_stages(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Campaigns
  async getCampaigns(organizationId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapCampaign);
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        organization_id: campaign.organization_id!,
        user_id: user.id,
        campaign_name: campaign.campaign_name!,
        campaign_type: campaign.campaign_type!,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        budget: campaign.budget,
        spent: campaign.spent,
        currency: campaign.currency,
        target_audience: campaign.target_audience || {},
        goals: campaign.goals || [],
        metrics: campaign.metrics || {},
        status: campaign.status,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCampaign(data);
  }

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const updateData: any = {};
    if (campaign.campaign_name) updateData.campaign_name = campaign.campaign_name;
    if (campaign.campaign_type) updateData.campaign_type = campaign.campaign_type;
    if (campaign.start_date !== undefined) updateData.start_date = campaign.start_date;
    if (campaign.end_date !== undefined) updateData.end_date = campaign.end_date;
    if (campaign.budget !== undefined) updateData.budget = campaign.budget;
    if (campaign.spent !== undefined) updateData.spent = campaign.spent;
    if (campaign.currency !== undefined) updateData.currency = campaign.currency;
    if (campaign.target_audience !== undefined) updateData.target_audience = campaign.target_audience;
    if (campaign.goals !== undefined) updateData.goals = campaign.goals;
    if (campaign.metrics !== undefined) updateData.metrics = campaign.metrics;
    if (campaign.status !== undefined) updateData.status = campaign.status;

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCampaign(data);
  }

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Analytics
  async getSalesStats(organizationId: string) {
    const leads = await this.getLeads(organizationId);
    const campaigns = await this.getCampaigns(organizationId);

    const totalLeads = leads.length;
    const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const roi = totalBudget > 0 ? ((totalValue - totalSpent) / totalSpent) * 100 : 0;

    return {
      totalLeads,
      totalValue,
      activeCampaigns,
      totalBudget,
      totalSpent,
      roi,
    };
  }
}

export const salesService = new SalesService();
