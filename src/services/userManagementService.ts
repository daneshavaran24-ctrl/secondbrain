import { supabase } from '@/integrations/supabase/client';
import type { 
  UserProfile, 
  CreateUserForm, 
  UpdateUserForm, 
  UserRole,
  SystemRole,
  UserRoleAssignment,
  UserAuditLog,
  SystemPermission,
  UserPermission
} from '@/types/user-management';

export class UserManagementService {
  // ===== User Profile Management =====
  
  /**
   * دریافت لیست کاربران با فیلترها
   */
  static async getUsers(filters?: {
    search?: string;
    role?: SystemRole;
    organization_id?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('user_profiles' as any)
      .select(`
        *,
        user_roles!user_profiles_user_id_fkey (
          *,
          custom_roles (name, display_name),
          organizations (id, name)
        )
      `)
      .order('created_at', { ascending: false });

    // اعمال فیلترها
    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,` +
        `last_name.ilike.%${filters.search}%,` +
        `display_name.ilike.%${filters.search}%,` +
        `email.ilike.%${filters.search}%,` +
        `mobile_phone.ilike.%${filters.search}%`
      );
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * دریافت اطلاعات یک کاربر
   */
  static async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles' as any)
      .select(`
        *,
        user_roles (
          *,
          custom_roles (name, display_name),
          organizations (id, name)
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * ایجاد کاربر جدید
   */
  static async createUser(userData: CreateUserForm) {
    // 1. ایجاد کاربر در Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        display_name: userData.display_name,
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('خطا در ایجاد کاربر');

    // 2. ایجاد پروفایل کاربر
    const { error: profileError } = await supabase
      .from('user_profiles' as any)
      .upsert({
        user_id: authData.user.id,
        email: userData.email,
        mobile_phone: userData.mobile_phone,
        first_name: userData.first_name,
        last_name: userData.last_name,
        display_name: userData.display_name,
        national_id: userData.national_id,
        office_phone: userData.office_phone,
        home_phone: userData.home_phone,
        address: userData.address,
        employee_id: userData.employee_id,
        department: userData.department,
        position: userData.position,
        organization_id: userData.organization_id,
      });

    if (profileError) throw profileError;

    // 3. تخصیص نقش
    await this.assignRole({
      user_id: authData.user.id,
      system_role: userData.system_role,
      custom_role_id: userData.custom_role_id,
      organization_id: userData.organization_id,
    });

    return authData.user;
  }

  /**
   * بروزرسانی اطلاعات کاربر
   */
  static async updateUser(userId: string, userData: UpdateUserForm) {
    const { data, error } = await supabase
      .from('user_profiles' as any)
      .update(userData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * غیرفعال/فعال کردن کاربر
   */
  static async toggleUserStatus(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('user_profiles' as any)
      .update({ is_active: isActive })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * حذف کاربر
   */
  static async deleteUser(userId: string) {
    // حذف کاربر از Auth (این کار cascade delete را فعال می‌کند)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  // ===== Role Management =====

  /**
   * دریافت نقش کاربر
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase
      .from('user_roles' as any)
      .select(`
        *,
        custom_roles (id, name, display_name),
        organizations (id, name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows found
    return data as unknown as UserRole | null;
  }

  /**
   * تخصیص نقش به کاربر
   */
  static async assignRole(roleData: UserRoleAssignment) {
    // ابتدا نقش‌های قبلی را غیرفعال کن
    await supabase
      .from('user_roles' as any)
      .update({ is_active: false })
      .eq('user_id', roleData.user_id);

    // سپس نقش جدید را اضافه کن
    const { data, error } = await supabase
      .from('user_roles' as any)
      .insert({
        user_id: roleData.user_id,
        system_role: roleData.system_role,
        custom_role_id: roleData.custom_role_id,
        organization_id: roleData.organization_id,
        valid_from: roleData.valid_from || new Date().toISOString(),
        valid_until: roleData.valid_until,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * تغییر نقش کاربر
   */
  static async changeUserRole(userId: string, newRole: SystemRole, customRoleId?: string) {
    return this.assignRole({
      user_id: userId,
      system_role: newRole,
      custom_role_id: customRoleId,
    });
  }

  // ===== Permission Management =====

  /**
   * بررسی دسترسی کاربر
   */
  static async checkPermission(userId: string, module: string, action: string): Promise<boolean> {
    const { data, error } = await (supabase as any)
      .rpc('has_permission', {
        _user_id: userId,
        _module_name: module,
        _permission_name: action
      });

    if (error) throw error;
    return data;
  }

  /**
   * بررسی نقش کاربر
   */
  static async checkRole(userId: string, role: SystemRole): Promise<boolean> {
    const { data, error } = await (supabase as any)
      .rpc('has_role', {
        _user_id: userId,
        _role: role
      });

    if (error) throw error;
    return data;
  }

  /**
   * دریافت تمام دسترسی‌های سیستم
   */
  static async getSystemPermissions(category?: string): Promise<SystemPermission[]> {
    let query = supabase
      .from('system_permissions' as any)
      .select('*')
      .order('module_name')
      .order('permission_name');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as SystemPermission[]) || [];
  }

  /**
   * تخصیص دسترسی مستقیم به کاربر
   */
  static async assignUserPermission(
    userId: string, 
    permissionId: string, 
    accessType: 'allow' | 'deny',
    reason?: string,
    validUntil?: string
  ) {
    const { data, error } = await supabase
      .from('user_permissions' as any)
      .upsert({
        user_id: userId,
        permission_id: permissionId,
        access_type: accessType,
        reason,
        valid_until: validUntil,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * حذف دسترسی مستقیم کاربر
   */
  static async removeUserPermission(userId: string, permissionId: string) {
    const { error } = await supabase
      .from('user_permissions' as any)
      .delete()
      .eq('user_id', userId)
      .eq('permission_id', permissionId);

    if (error) throw error;
  }

  /**
   * دریافت دسترسی‌های مستقیم کاربر
   */
  static async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const { data, error } = await supabase
      .from('user_permissions' as any)
      .select(`
        *,
        system_permissions (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as UserPermission[]) || [];
  }

  // ===== Password Management =====

  /**
   * ریست رمز عبور کاربر توسط ادمین
   */
  static async resetUserPassword(userId: string, newPassword: string) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) throw error;
  }

  /**
   * ارسال لینک ریست رمز عبور به ایمیل کاربر
   */
  static async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  // ===== Audit Log =====

  /**
   * دریافت لاگ تغییرات کاربر
   */
  static async getUserAuditLog(
    userId?: string, 
    limit = 50, 
    offset = 0
  ): Promise<UserAuditLog[]> {
    let query = supabase
      .from('user_audit_log' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('target_user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as UserAuditLog[]) || [];
  }

  // ===== Current User =====

  /**
   * دریافت اطلاعات کاربر فعلی
   */
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return this.getUserById(user.id);
  }

  /**
   * دریافت نقش کاربر فعلی
   */
  static async getCurrentUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return this.getUserRole(user.id);
  }

  /**
   * بررسی دسترسی کاربر فعلی
   */
  static async hasPermission(module: string, action: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return this.checkPermission(user.id, module, action);
  }

  /**
   * بررسی نقش کاربر فعلی
   */
  static async hasRole(role: SystemRole) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return this.checkRole(user.id, role);
  }
}

export default UserManagementService;
