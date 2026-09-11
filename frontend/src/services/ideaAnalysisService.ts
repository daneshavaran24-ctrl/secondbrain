import { supabase } from "@/integrations/supabase/client";

export interface RevenueOpportunity {
  id?: string;
  idea_id?: string;
  revenue_model: string;
  market_size?: string;
  pricing_strategy?: string;
  target_segment?: string;
  revenue_estimate?: string;
  timeline?: string;
  confidence_level?: string;
}

export interface SuggestedAction {
  id?: string;
  idea_id?: string;
  action: string;
  priority?: string;
  timeline?: string;
  estimated_effort?: string;
  dependencies?: string;
  status?: string;
  order_index?: number;
}

export interface Milestone {
  id?: string;
  idea_id?: string;
  title: string;
  description?: string;
  target_date?: string;
  completed?: boolean;
}

export interface Risk {
  id?: string;
  idea_id?: string;
  description: string;
  risk_type?: string;
  severity?: string;
  mitigation_strategy?: string;
}

export const ideaAnalysisService = {
  // ============= Revenue Opportunities =============
  async updateRevenueOpportunity(id: string, data: Partial<RevenueOpportunity>) {
    const { data: result, error } = await supabase
      .from('idea_revenue_opportunities')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async createRevenueOpportunity(ideaId: string, data: Omit<RevenueOpportunity, 'id' | 'idea_id'>) {
    const { data: result, error } = await supabase
      .from('idea_revenue_opportunities')
      .insert([{ ...data, idea_id: ideaId }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteRevenueOpportunity(id: string) {
    const { error } = await supabase
      .from('idea_revenue_opportunities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ============= Suggested Actions =============
  async updateSuggestedAction(id: string, data: Partial<SuggestedAction>) {
    const { data: result, error } = await supabase
      .from('idea_suggested_actions')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async createSuggestedAction(ideaId: string, data: Omit<SuggestedAction, 'id' | 'idea_id'>) {
    // Get max order_index
    const { data: maxOrder } = await supabase
      .from('idea_suggested_actions')
      .select('order_index')
      .eq('idea_id', ideaId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrder?.order_index ?? -1) + 1;

    const { data: result, error } = await supabase
      .from('idea_suggested_actions')
      .insert([{ ...data, idea_id: ideaId, order_index: nextOrder }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteSuggestedAction(id: string) {
    const { error } = await supabase
      .from('idea_suggested_actions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async reorderSuggestedActions(actions: { id: string; order_index: number }[]) {
    const updates = actions.map(action =>
      supabase
        .from('idea_suggested_actions')
        .update({ order_index: action.order_index })
        .eq('id', action.id)
    );

    await Promise.all(updates);
  },

  // ============= Business Model Canvas =============
  async updateBusinessModelCanvas(ideaId: string, data: any) {
    const { data: existing } = await supabase
      .from('idea_business_model_canvas')
      .select('id')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (existing) {
      const { data: result, error } = await supabase
        .from('idea_business_model_canvas')
        .update(data)
        .eq('idea_id', ideaId)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase
        .from('idea_business_model_canvas')
        .insert([{ ...data, idea_id: ideaId }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  // ============= Milestones =============
  async updateMilestone(id: string, data: Partial<Milestone>) {
    const { data: result, error } = await supabase
      .from('idea_milestones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async createMilestone(ideaId: string, data: Omit<Milestone, 'id' | 'idea_id'>) {
    const { data: result, error } = await supabase
      .from('idea_milestones')
      .insert([{ ...data, idea_id: ideaId }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteMilestone(id: string) {
    const { error } = await supabase
      .from('idea_milestones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleMilestoneCompleted(id: string, completed: boolean) {
    const { data: result, error } = await supabase
      .from('idea_milestones')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // ============= Financial Analysis =============
  async updateFinancialAnalysis(ideaId: string, data: any) {
    const { data: existing } = await supabase
      .from('idea_financial_analysis')
      .select('id')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (existing) {
      const { data: result, error } = await supabase
        .from('idea_financial_analysis')
        .update(data)
        .eq('idea_id', ideaId)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase
        .from('idea_financial_analysis')
        .insert([{ ...data, idea_id: ideaId }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  // ============= Strategy =============
  async updateStrategy(ideaId: string, data: any) {
    const { data: existing } = await supabase
      .from('idea_strategy')
      .select('id')
      .eq('idea_id', ideaId)
      .maybeSingle();

    if (existing) {
      const { data: result, error } = await supabase
        .from('idea_strategy')
        .update(data)
        .eq('idea_id', ideaId)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } else {
      const { data: result, error } = await supabase
        .from('idea_strategy')
        .insert([{ ...data, idea_id: ideaId }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }
  },

  // ============= SWOT =============
  async updateSWOT(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('idea_swot_analysis')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // ============= Risks =============
  async updateRisk(id: string, data: Partial<Risk>) {
    const { data: result, error } = await supabase
      .from('idea_risks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async createRisk(ideaId: string, data: Omit<Risk, 'id' | 'idea_id'>) {
    const { data: result, error } = await supabase
      .from('idea_risks')
      .insert([{ ...data, idea_id: ideaId }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async deleteRisk(id: string) {
    const { error } = await supabase
      .from('idea_risks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
