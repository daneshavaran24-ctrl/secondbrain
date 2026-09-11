import { supabase } from "@/integrations/supabase/client";

export interface Claim {
  id: string;
  user_id: string;
  organization_id?: string;
  claim_number?: string;
  title: string;
  description?: string;
  claim_type?: string;
  status?: string;
  currency?: string;
  amount?: number;
  filed_date?: string;
  resolution_date?: string;
  created_at: string;
  updated_at: string;
}

// ClaimEvent table doesn't exist in DB - removing for now
// export interface ClaimEvent {
//   id: string;
//   claim_id: string;
//   event_type: string;
//   event_description: string;
//   created_by?: string;
//   metadata?: any;
//   created_at: string;
// }

export interface ClaimStats {
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  rejected: number;
  overdue: number;
  critical: number;
}

class ClaimsService {
  async getClaimsByOrganization(organizationId: string): Promise<Claim[]> {
    try {
      const { data, error } = await supabase
        .from('organizational_claims')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching claims:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClaimsByOrganization:', error);
      return [];
    }
  }

  async createClaim(claim: Omit<Claim, 'id' | 'created_at' | 'updated_at'>): Promise<Claim | null> {
    try {
      const { data, error } = await supabase
        .from('organizational_claims')
        .insert(claim)
        .select()
        .single();

      if (error) {
        console.error('Error creating claim:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createClaim:', error);
      return null;
    }
  }

  async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    try {
      const { data, error } = await supabase
        .from('organizational_claims')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating claim:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateClaim:', error);
      return null;
    }
  }

  async deleteClaim(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organizational_claims')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting claim:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteClaim:', error);
      return false;
    }
  }

  // Claim events table doesn't exist - commenting out for now
  // async addClaimEvent(claimId: string, eventType: string, description: string, metadata?: any): Promise<any | null> {
  //   // Implementation removed - table doesn't exist
  //   return null;
  // }

  // async getClaimEvents(claimId: string): Promise<any[]> {
  //   // Implementation removed - table doesn't exist
  //   return [];
  // }

  async getClaimStats(organizationId: string): Promise<ClaimStats> {
    try {
      const claims = await this.getClaimsByOrganization(organizationId);
      const now = new Date();

      const stats: ClaimStats = {
        total: claims.length,
        pending: claims.filter(c => c.status === 'pending' || c.status === 'open').length,
        reviewing: claims.filter(c => c.status === 'reviewing').length,
        resolved: claims.filter(c => c.status === 'resolved' || c.status === 'closed').length,
        rejected: claims.filter(c => c.status === 'rejected').length,
        overdue: 0, // Can't calculate without response_deadline field
        critical: 0 // Can't calculate without priority field
      };

      return stats;
    } catch (error) {
      console.error('Error in getClaimStats:', error);
      return {
        total: 0,
        pending: 0,
        reviewing: 0,
        resolved: 0,
        rejected: 0,
        overdue: 0,
        critical: 0
      };
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'در انتظار بررسی',
      'reviewing': 'در حال بررسی',
      'resolved': 'حل شده',
      'rejected': 'رد شده'
    };
    return statusMap[status] || status;
  }

  getClaimTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      'financial': 'مالی',
      'legal': 'حقوقی',
      'service': 'خدماتی',
      'warranty': 'گارانتی',
      'insurance': 'بیمه',
      'other': 'سایر'
    };
    return typeMap[type] || type;
  }

  generateClaimNumber(): string {
    const prefix = 'CL';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
}

export const claimsService = new ClaimsService();