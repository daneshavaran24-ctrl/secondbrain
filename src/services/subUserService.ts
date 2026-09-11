import { supabase } from "@/integrations/supabase/client";
import type { 
  SubUser, 
  SubUserPermission, 
  CreateSubUserForm, 
  UpdateSubUserForm,
  SubUserWithPermissions,
  DomainType,
  PermissionType,
  UserType,
  AuthAuditLog
} from "@/types/sub-user";

export class SubUserService {
  /**
   * دریافت تمام کاربران فرعی owner جاری
   */
  static async getSubUsers(): Promise<SubUserWithPermissions[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('کاربر احراز هویت نشده است');

    const { data: subUsers, error } = await supabase
      .from('sub_users')
      .select(`
        *,
        permissions:sub_user_permissions(*)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return subUsers as SubUserWithPermissions[];
  }

  /**
   * دریافت یک کاربر فرعی خاص
   */
  static async getSubUser(id: string): Promise<SubUserWithPermissions | null> {
    const { data, error } = await supabase
      .from('sub_users')
      .select(`
        *,
        permissions:sub_user_permissions(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as SubUserWithPermissions | null;
  }

  /**
   * ایجاد کاربر فرعی جدید
   */
  static async createSubUser(formData: CreateSubUserForm): Promise<SubUser> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('کاربر احراز هویت نشده است');

    // فراخوانی Edge Function برای ایجاد کاربر فرعی
    const { data, error } = await supabase.functions.invoke('create-sub-user', {
      body: {
        owner_id: user.id,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        permissions: formData.permissions,
        expires_at: formData.expires_at
      }
    });

    if (error) throw error;
    if (!data?.sub_user) throw new Error('خطا در ایجاد کاربر فرعی');

    // ثبت لاگ
    await this.logAction('create_sub_user', {
      sub_user_id: data.sub_user.id,
      email: formData.email,
      permissions_count: formData.permissions.length
    });

    return data.sub_user;
  }

  /**
   * بروزرسانی کاربر فرعی
   */
  static async updateSubUser(id: string, formData: UpdateSubUserForm): Promise<SubUser> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('کاربر احراز هویت نشده است');

    // بروزرسانی اطلاعات پایه
    const updateData: Partial<SubUser> = {};
    if (formData.name) updateData.name = formData.name;
    if (formData.email) updateData.email = formData.email;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
    if (formData.expires_at !== undefined) updateData.expires_at = formData.expires_at;

    const { data: subUser, error: updateError } = await supabase
      .from('sub_users')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // بروزرسانی permissions در صورت وجود
    if (formData.permissions) {
      // حذف permissions قبلی
      await supabase
        .from('sub_user_permissions')
        .delete()
        .eq('sub_user_id', id);

      // افزودن permissions جدید
      if (formData.permissions.length > 0) {
        const permissionsData = formData.permissions.map(p => ({
          sub_user_id: id,
          domain: p.domain,
          permissions: p.permissions
        }));

        const { error: permError } = await supabase
          .from('sub_user_permissions')
          .insert(permissionsData);

        if (permError) throw permError;
      }
    }

    // ثبت لاگ
    await this.logAction('update_sub_user', {
      sub_user_id: id,
      updated_fields: Object.keys(updateData)
    });

    return subUser;
  }

  /**
   * حذف کاربر فرعی
   */
  static async deleteSubUser(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('کاربر احراز هویت نشده است');

    const { error } = await supabase
      .from('sub_users')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;

    // ثبت لاگ
    await this.logAction('delete_sub_user', {
      sub_user_id: id
    });
  }

  /**
   * فعال/غیرفعال کردن کاربر فرعی
   */
  static async toggleSubUserStatus(id: string, isActive: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('کاربر احراز هویت نشده است');

    const { error } = await supabase
      .from('sub_users')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;

    // ثبت لاگ
    await this.logAction(isActive ? 'activate_sub_user' : 'deactivate_sub_user', {
      sub_user_id: id
    });
  }

  /**
   * دریافت permissions یک کاربر فرعی
   */
  static async getSubUserPermissions(subUserId: string): Promise<SubUserPermission[]> {
    const { data, error } = await supabase
      .from('sub_user_permissions')
      .select('*')
      .eq('sub_user_id', subUserId);

    if (error) throw error;
    return data as SubUserPermission[];
  }

  /**
   * بررسی دسترسی کاربر فرعی به یک حوزه
   */
  static async checkDomainAccess(
    domain: DomainType, 
    permission: PermissionType = 'read'
  ): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc('has_domain_access', {
        user_id_param: user.id,
        domain_param: domain,
        permission_param: permission
      });

    if (error) {
      console.error('Error checking domain access:', error);
      return false;
    }

    return data === true;
  }

  /**
   * دریافت نوع کاربر (owner یا sub_user)
   */
  static async getUserType(): Promise<UserType> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'unknown';

    const { data, error } = await supabase
      .rpc('get_user_type', { user_id_param: user.id });

    if (error) {
      console.error('Error getting user type:', error);
      return 'unknown';
    }

    return data as UserType;
  }

  /**
   * دریافت تمام domains مجاز برای کاربر جاری
   */
  static async getAllowedDomains(): Promise<DomainType[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const userType = await this.getUserType();
    
    // اگر owner باشد، به همه domains دسترسی دارد
    if (userType === 'owner') {
      return [
        'calendar', 'meetings', 'ideas', 'knowledge', 'delegation',
        'reports', 'health', 'gratitude', 'correspondence', 'csr', 'legal', 'business'
      ];
    }

    // اگر sub_user باشد، فقط domains مجاز را برگردان
    const { data, error } = await supabase
      .from('sub_user_permissions')
      .select('domain')
      .eq('sub_user_id', user.id);

    if (error) {
      console.error('Error getting allowed domains:', error);
      return [];
    }

    return data.map(p => p.domain as DomainType);
  }

  /**
   * ثبت لاگ عملیات
   */
  static async logAction(action: string, details: Record<string, any>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userType = await this.getUserType();

    await supabase.from('auth_audit').insert({
      actor_id: user.id,
      actor_type: userType === 'owner' ? 'owner' : 'sub_user',
      action,
      details,
      ip_address: null, // می‌توان از API خارجی برای دریافت IP استفاده کرد
      user_agent: navigator.userAgent
    });
  }

  /**
   * دریافت لاگ‌های audit برای owner
   */
  static async getAuditLogs(limit: number = 50): Promise<AuthAuditLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('کاربر احراز هویت نشده است');

    const { data, error } = await supabase
      .from('auth_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as AuthAuditLog[];
  }

  /**
   * بررسی تعداد کاربران فرعی فعال
   */
  static async getActiveSubUsersCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('sub_users')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    return count || 0;
  }

  /**
   * بررسی امکان ایجاد کاربر فرعی جدید
   */
  static async canCreateSubUser(): Promise<boolean> {
    const count = await this.getActiveSubUsersCount();
    return count < 3;
  }
}
