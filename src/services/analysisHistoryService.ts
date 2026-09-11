import { supabase } from "@/integrations/supabase/client";

export interface AnalysisHistoryItem {
  id: string;
  idea_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  analysis_result: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  idea: {
    title: string;
    description: string;
    domain: string;
    priority: string;
  };
}

export interface AnalysisStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  averageTime: number;
}

export interface AnalysisFilters {
  status?: "pending" | "processing" | "completed" | "failed" | "all";
  domain?: "personal" | "professional" | "organizational" | "all";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export class AnalysisHistoryService {
  /**
   * Get analysis history with filters
   */
  static async getAnalysisHistory(
    filters?: AnalysisFilters,
    limit = 50,
    offset = 0
  ): Promise<AnalysisHistoryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from("idea_analysis_queue")
      .select(`
        *,
        idea:ideas!inner(
          title,
          description,
          domain,
          priority,
          user_id
        )
      `)
      .eq("idea.user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.domain && filters.domain !== "all") {
      query = query.eq("idea.domain", filters.domain);
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    if (filters?.search) {
      query = query.or(`idea.title.ilike.%${filters.search}%,idea.description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as any;
  }

  /**
   * Get analysis statistics
   */
  static async getAnalysisStats(): Promise<AnalysisStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("idea_analysis_queue")
      .select(`
        status,
        created_at,
        updated_at,
        idea:ideas!inner(user_id)
      `)
      .eq("idea.user_id", user.id);

    if (error) throw error;

    const total = data.length;
    const completed = data.filter(item => item.status === "completed").length;
    const failed = data.filter(item => item.status === "failed").length;
    const pending = data.filter(item => item.status === "pending").length;
    const processing = data.filter(item => item.status === "processing").length;

    // Calculate average time for completed analyses
    const completedItems = data.filter(item => item.status === "completed");
    const totalTime = completedItems.reduce((acc, item) => {
      const start = new Date(item.created_at).getTime();
      const end = new Date(item.updated_at).getTime();
      return acc + (end - start);
    }, 0);
    const averageTime = completedItems.length > 0 ? Math.round(totalTime / completedItems.length / 1000) : 0;

    return {
      total,
      completed,
      failed,
      pending,
      processing,
      averageTime
    };
  }

  /**
   * Delete an analysis
   */
  static async deleteAnalysis(queueId: string): Promise<void> {
    const { error } = await supabase
      .from("idea_analysis_queue")
      .delete()
      .eq("id", queueId);

    if (error) throw error;
  }

  /**
   * Retry a failed analysis
   */
  static async retryFailedAnalysis(queueId: string): Promise<void> {
    // Get the queue item
    const { data: queueItem, error: fetchError } = await supabase
      .from("idea_analysis_queue")
      .select("idea_id")
      .eq("id", queueId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the old queue item
    await this.deleteAnalysis(queueId);

    // Get idea details
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select(`
        *,
        idea_inspirations(*)
      `)
      .eq("id", queueItem.idea_id)
      .single();

    if (ideaError) throw ideaError;

    // Call analyze-idea edge function
    const { error: analyzeError } = await supabase.functions.invoke("analyze-idea", {
      body: {
        ideaId: idea.id,
        title: idea.title,
        description: idea.description,
        domain: idea.domain,
        inspirations: idea.idea_inspirations?.map((i: any) => ({
          source: i.source,
          description: i.description
        })) || []
      }
    });

    if (analyzeError) throw analyzeError;
  }

  /**
   * Clean up old pending/failed analyses
   */
  static async cleanupStaleAnalyses(olderThanHours = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: staleItems, error: fetchError } = await supabase
      .from("idea_analysis_queue")
      .select(`
        id,
        idea:ideas!inner(user_id)
      `)
      .eq("idea.user_id", user.id)
      .in("status", ["pending", "failed"])
      .lt("created_at", cutoffDate.toISOString());

    if (fetchError) throw fetchError;

    if (!staleItems || staleItems.length === 0) return 0;

    const { error: deleteError } = await supabase
      .from("idea_analysis_queue")
      .delete()
      .in("id", staleItems.map(item => item.id));

    if (deleteError) throw deleteError;

    return staleItems.length;
  }
}
