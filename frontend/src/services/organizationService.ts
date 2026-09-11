import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface Organization {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  settings?: any;
  tags?: string[] | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface OrganizationOption {
  value: string;
  label: string;
  icon: string;
}

// Mapping between UI and Database organization types
const ORG_TYPE_UI_TO_DB: Record<string, string> = {
  'company': 'varid',
  'government': 'farangaran',
  'educational': 'association',
  'ngo': 'khadim_e_khalgh',
  'chamber': 'chamber_commerce',
  'other': 'other'
};

const ORG_TYPE_DB_TO_UI: Record<string, string> = {
  'varid': 'company',
  'farangaran': 'government',
  'association': 'educational',
  'khadim_e_khalgh': 'ngo',
  'chamber_commerce': 'chamber',
  'other': 'other'
};

export interface UserOrganization {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_type?: string;
  position_title: string | null;
  role?: string;
  joined_date: string;
}

// Custom event for organization updates
export const ORGANIZATION_UPDATE_EVENT = 'organizationUpdate';

class OrganizationService {
  private cache: Organization[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Public method to clear cache
  public invalidateCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  // Get main organization from localStorage
  getMainOrganization(): Organization | null {
    try {
      const stored = localStorage.getItem('main_organization');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading main organization:', e);
    }
    return null;
  }

  // Set main organization to localStorage
  setMainOrganization(organization: Organization): void {
    try {
      localStorage.setItem('main_organization', JSON.stringify(organization));
      this.emitUpdateEvent();
    } catch (e) {
      console.error('Error saving main organization:', e);
    }
  }

  // Check if organization is the default one (DEPRECATED - always returns false)
  isDefaultOrganization(organization: Organization): boolean {
    // This method is deprecated as we no longer create default organizations
    return false;
  }

  async getOrganizations(): Promise<Organization[]> {
    try {
      const now = Date.now();
      
      // Return cache if valid
      if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
        console.log('🔍 Returning cached organizations:', this.cache);
        return this.cache;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // ✅ فقط سازمان‌های کاربر جاری را برگردان (شامل is_active برای فیلترها)
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type, description, logo_url, is_active, created_at, updated_at, user_id')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      this.cache = data || [];
      this.lastFetch = now;
      return this.cache;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      
      // Check if it's a specific database error
      const isTableNotFound = error?.message?.includes('relation "public.organizations" does not exist') || 
                             error?.code === 'PGRST106';
      
      if (isTableNotFound) {
        console.warn('Organizations table not found, using default organizations');
        // Return cache or defaults without showing error toast
        return this.cache || [];
      }
      
      toast({
        title: 'خطا در بارگذاری سازمان‌ها',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return this.cache || [];
    }
  }

  /**
   * Initialize default organization for new users (DISABLED)
   * This method is intentionally disabled to prevent auto-creation of unwanted organizations.
   * Users should explicitly create their own organizations.
   */
  async initializeDefaultOrganization(): Promise<Organization | null> {
    console.log('⚠️ initializeDefaultOrganization is disabled');
    return null;
  }

  async addOrganization(name: string, type: string, description?: string): Promise<Organization | null> {
    try {
      console.log('📝 شروع ایجاد سازمان:', { name, type, description });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ کاربر لاگین نیست - RLS policy نمی‌گذارد سازمان ایجاد شود');
        toast({
          title: 'خطا',
          description: 'لطفاً ابتدا وارد سیستم شوید',
          variant: 'destructive'
        });
        return null;
      }

      // Map UI type to database type
      const dbType = ORG_TYPE_UI_TO_DB[type] || type;
      
      const { data, error } = await supabase
        .from('organizations')
        .insert([{ 
          name: name.trim(), 
          type: dbType as any,
          description: description?.trim() || null,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ خطای Supabase:', error);
        
        // بررسی نوع خطا
        if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
          toast({
            title: 'خطای دسترسی',
            description: 'لطفاً مجدداً وارد شوید',
            variant: 'destructive'
          });
        } else if (error.code === '23505') {
          toast({
            title: 'خطا',
            description: 'سازمانی با این نام قبلاً ثبت شده است',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'خطا در ایجاد سازمان',
            description: error.message || 'خطای ناشناخته',
            variant: 'destructive'
          });
        }
        return null;
      }

      console.log('✅ سازمان ایجاد شد:', data);

      // اضافه کردن خودکار کاربر به سازمان با نقش owner
      await this.addUserToOrganization(data.id, 'owner', 'مالک');

      // Clear cache and emit event
      this.invalidateCache();
      this.emitUpdateEvent();
      
      toast({
        title: 'سازمان اضافه شد',
        description: `سازمان "${name}" با موفقیت اضافه شد`
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error adding organization:', error);
      toast({
        title: 'خطا در اضافه کردن سازمان',
        description: error.message || 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return null;
    }
  }

  async deleteOrganization(id: string, name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear cache and emit event
      this.invalidateCache();
      this.emitUpdateEvent();
      
      toast({
        title: 'سازمان حذف شد',
        description: `سازمان "${name}" با موفقیت حذف شد`
      });

      return true;
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'خطا در حذف سازمان',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return false;
    }
  }

  // Convert organizations to options format
  organizationsToOptions(organizations: Organization[]): OrganizationOption[] {
    // Map organization types to icons (using UI types)
    const typeIcons: Record<string, string> = {
      'company': '🏢',
      'government': '🏛️',
      'educational': '🎓',
      'ngo': '🤲',
      'chamber': '🏦',
      'other': '🏢'
    };

    return organizations.map(org => {
      // Convert DB type to UI type for icon selection
      const uiType = ORG_TYPE_DB_TO_UI[org.type] || org.type;
      return {
        value: org.id,
        label: org.name,
        icon: typeIcons[uiType] || '🏢'
      };
    });
  }

  // Get user's organizations
  async getUserOrganizations(userId?: string): Promise<UserOrganization[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return [];

      const { data: userOrgs, error } = await supabase
        .from('user_organizations')
        .select(`
          id,
          organization_id,
          position_title,
          created_at,
          organizations (
            name,
            type
          )
        `)
        .eq('user_id', targetUserId);

      if (error) throw error;

      return (userOrgs || []).map((uo: any) => ({
        id: uo.id,
        organization_id: uo.organization_id,
        organization_name: uo.organizations?.name || '',
        organization_type: uo.organizations?.type,
        position_title: uo.position_title,
        role: uo.role,
        joined_date: uo.created_at
      }));
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }
  }

  // Add user to organization with role
  async addUserToOrganization(
    organizationId: string, 
    role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer' = 'member',
    positionTitle?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_organizations')
        .insert([{
          user_id: user.id,
          organization_id: organizationId,
          role: role,
          position_title: positionTitle || null
        }]);

      if (error) throw error;

      this.emitUpdateEvent();
      toast({
        title: 'سازمان اضافه شد',
        description: 'شما با موفقیت به سازمان اضافه شدید'
      });

      return true;
    } catch (error) {
      console.error('Error adding user to organization:', error);
      toast({
        title: 'خطا در اضافه کردن سازمان',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return false;
    }
  }

  // Update user position
  async updateUserPosition(userOrgId: string, positionTitle: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ position_title: positionTitle })
        .eq('id', userOrgId);

      if (error) throw error;

      this.emitUpdateEvent();
      toast({
        title: 'سمت به‌روزرسانی شد',
        description: 'سمت شما با موفقیت تغییر یافت'
      });

      return true;
    } catch (error) {
      console.error('Error updating position:', error);
      toast({
        title: 'خطا در به‌روزرسانی سمت',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return false;
    }
  }

  // Remove user from organization
  async removeUserFromOrganization(userOrgId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('id', userOrgId);

      if (error) throw error;

      this.emitUpdateEvent();
      toast({
        title: 'سازمان حذف شد',
        description: 'شما از سازمان خارج شدید'
      });

      return true;
    } catch (error) {
      console.error('Error removing user from organization:', error);
      toast({
        title: 'خطا در حذف سازمان',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return false;
    }
  }

  // Update organization
  async updateOrganization(
    id: string, 
    updates: {
      name?: string;
      description?: string | null;
      logo_url?: string | null;
      website?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      settings?: any;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      this.invalidateCache();
      this.emitUpdateEvent();
      
      toast({
        title: 'سازمان به‌روزرسانی شد',
        description: 'اطلاعات سازمان با موفقیت ذخیره شد'
      });

      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'خطا در به‌روزرسانی',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return false;
    }
  }

  // Upload organization logo
  async uploadOrganizationLogo(organizationId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}/${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      const { data: org } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', organizationId)
        .single();

      if (org?.logo_url) {
        const oldPath = org.logo_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('organization-logos')
          .remove([oldPath]);
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      // Update organization
      await this.updateOrganization(organizationId, { logo_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'خطا در آپلود لوگو',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive'
      });
      return null;
    }
  }

  // Delete organization logo
  async deleteOrganizationLogo(organizationId: string): Promise<boolean> {
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', organizationId)
        .single();

      if (!org?.logo_url) return true;

      const filePath = org.logo_url.split('/').slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from('organization-logos')
        .remove([filePath]);

      if (error) throw error;

      await this.updateOrganization(organizationId, { logo_url: null });

      return true;
    } catch (error) {
      console.error('Error deleting logo:', error);
      return false;
    }
  }

  // Get organization by ID
  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }

  private emitUpdateEvent(): void {
    window.dispatchEvent(new CustomEvent(ORGANIZATION_UPDATE_EVENT));
  }
}

export const organizationService = new OrganizationService();

// React hook for using organizations (all available orgs)
export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // بررسی وضعیت احراز هویت
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ کاربر لاگین نیست - سازمان‌ها نمایش داده نمی‌شوند');
        setOrganizations([]);
        organizationService.invalidateCache(); // پاک کردن cache
        setIsLoading(false);
        return;
      }

      const orgs = await organizationService.getOrganizations();
      const options = organizationService.organizationsToOptions(orgs);
      setOrganizations(options);
    } catch (err) {
      console.error('خطا در بارگذاری سازمان‌ها:', err);
      setError('خطا در بارگذاری سازمان‌ها');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();

    const handleUpdate = () => {
      loadOrganizations();
    };

    window.addEventListener(ORGANIZATION_UPDATE_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(ORGANIZATION_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  return {
    organizations,
    isLoading,
    error,
    refresh: loadOrganizations
  };
}

// React hook for user's organizations
export function useUserOrganizations() {
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const orgs = await organizationService.getUserOrganizations();
      setUserOrganizations(orgs);
    } catch (err) {
      setError('خطا در بارگذاری سازمان‌های شما');
      setUserOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserOrganizations();

    const handleUpdate = () => {
      loadUserOrganizations();
    };

    window.addEventListener(ORGANIZATION_UPDATE_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(ORGANIZATION_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  return {
    userOrganizations,
    isLoading,
    error,
    refresh: loadUserOrganizations
  };
}