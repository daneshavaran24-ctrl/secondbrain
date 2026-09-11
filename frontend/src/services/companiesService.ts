import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessCompany {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const companiesService = {
  // Get main company from localStorage
  getMainCompany(): BusinessCompany | null {
    try {
      const stored = localStorage.getItem('main_company');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting main company:', error);
      return null;
    }
  },

  // Set main company in localStorage
  setMainCompany(company: BusinessCompany): void {
    try {
      localStorage.setItem('main_company', JSON.stringify(company));
    } catch (error) {
      console.error('Error setting main company:', error);
    }
  },

  // Check if a company is the default one
  isDefaultCompany(company: BusinessCompany): boolean {
    return company.company_name === 'شرکت شماره یک' && 
           company.tags?.includes('پیش‌فرض');
  },

  // Initialize default company for new users
  async initializeDefaultCompany(): Promise<BusinessCompany | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user already has companies
      const { data: existingCompanies, error: checkError } = await supabase
        .from('business_companies')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) throw checkError;
      if (existingCompanies && existingCompanies.length > 0) return null;

      // Create default company
      const defaultCompany = {
        company_name: 'شرکت شماره یک',
        user_id: user.id,
        description: 'این شرکت پیش‌فرض شماست. می‌توانید نام و اطلاعات آن را تغییر دهید.',
        tags: ['پیش‌فرض']
      };

      const { data, error } = await supabase
        .from('business_companies')
        .insert([defaultCompany])
        .select()
        .single();

      if (error) throw error;
      
      // Set as main company
      if (data) {
        this.setMainCompany(data as any);
      }
      
      return data as any;
    } catch (error) {
      console.error('Error initializing default company:', error);
      return null;
    }
  },

  async getUserCompanies(userId?: string): Promise<BusinessCompany[]> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('business_companies')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  },

  async addCompany(company: Omit<BusinessCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<BusinessCompany | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('لطفاً ابتدا وارد شوید');
        return null;
      }

      // Check company limit (max 50 companies)
      const existingCompanies = await this.getUserCompanies(user.id);
      if (existingCompanies.length >= 50) {
        toast.error('حداکثر تعداد شرکت‌ها ۵۰ عدد است');
        return null;
      }

      const { data, error } = await supabase
        .from('business_companies')
        .insert([{ ...company, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('شرکت با موفقیت اضافه شد');
      return data as any;
    } catch (error) {
      console.error('Error adding company:', error);
      toast.error('خطا در افزودن شرکت');
      return null;
    }
  },

  async updateCompany(companyId: string, updates: Partial<BusinessCompany>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_companies')
        .update(updates)
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success('شرکت با موفقیت به‌روزرسانی شد');
      return true;
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('خطا در به‌روزرسانی شرکت');
      return false;
    }
  },

  async deleteCompany(companyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success('شرکت با موفقیت حذف شد');
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('خطا در حذف شرکت');
      return false;
    }
  },

  async getCompanyStats(userId?: string) {
    try {
      const companies = await this.getUserCompanies(userId);
      
      return {
        total: companies.length,
        active: companies.length // All companies are considered active now
      };
    } catch (error) {
      console.error('Error calculating company stats:', error);
      return {
        total: 0,
        active: 0
      };
    }
  }
};
