import { supabase } from '@/integrations/supabase/client';
import { apiFetch, getStoredUser } from '@/lib/api';
import { CreateUserForm, UserProfile, SystemRole } from '@/types/user-management';

export class UserManagementService {
  // ساخت کاربر جدید
  static async createUser(userData: CreateUserForm): Promise<UserProfile> {
    const res = await apiFetch('/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'خطا در ایجاد کاربر');
    return result.user;
  }

  // دریافت لیست کاربران
  static async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await apiFetch('/list-users');
      if (!res.ok) return [];
      const data = await res.json();
      return (data.users || []) as UserProfile[];
    } catch {
      return [];
    }
  }

  // به‌روزرسانی کاربر
  static async updateUser(userId: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      console.log('Updating user:', userId, userData);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      console.log('User updated successfully:', profile.id);
      return {
        ...profile,
        mobile_phone: profile.phone || '',
        display_name: profile.full_name || 'کاربر',
        first_name: profile.full_name?.split(' ')[0] || '',
        last_name: profile.full_name?.split(' ')[1] || '',
        national_id: '',
        office_phone: profile.phone || '',
        home_phone: '',
        address: '',
        employee_id: '',
        organization_id: '',
        hire_date: '',
        birth_date: '',
        bio: '',
        is_active: true,
        email_verified: false,
        mobile_verified: false,
        preferences: null,
      } as UserProfile;

    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // حذف کاربر
  static async deleteUser(userId: string): Promise<void> {
    const res = await apiFetch(`/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || 'خطا در حذف کاربر');
    }
  }

  // بازنشانی رمز عبور کاربر
  static async resetPassword(userId: string): Promise<{ temporaryPassword: string }> {
    const temporaryPassword = this.generateTemporaryPassword();
    try {
      await apiFetch('/reset-user-password', {
        method: 'POST',
        body: JSON.stringify({ userId, newPassword: temporaryPassword }),
      });
    } catch {}
    return { temporaryPassword };
  }

  // تولید رمز عبور موقت
  static generateTemporaryPassword(): string {
    const length = 8;
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // دریافت اطلاعات کاربر فعلی
  static async getCurrentUser(): Promise<{ user: any; profile: UserProfile | null; role: any }> {
    try {
      const stored = getStoredUser();
      const user = stored ? { id: stored.id, email: stored.email, user_metadata: stored.profile || {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), email_confirmed_at: new Date().toISOString() } : null;
      const error = null;
      
      if (error || !user) {
        return { user: null, profile: null, role: null };
      }
      // ایجاد پروفایل پیش‌فرض
      const profile: UserProfile = {
        id: crypto.randomUUID(),
        user_id: user.id,
        email: user.email || '',
        mobile_phone: user.user_metadata?.mobile_phone || '',
        display_name: user.user_metadata?.display_name || user.email || 'کاربر',
        first_name: null,
        last_name: null,
        national_id: null,
        office_phone: null,
        home_phone: null,
        address: null,
        employee_id: null,
        department: null,
        position: null,
        organization_id: null,
        is_active: true,
        email_verified: user.email_confirmed_at ? true : false,
        mobile_verified: false,
        hire_date: null,
        birth_date: null,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        avatar_url: user.user_metadata?.avatar_url || null,
        bio: null,
        preferences: null,
      };

      // نقش پیش‌فرض
      const role = {
        id: crypto.randomUUID(),
        user_id: user.id,
        system_role: (user.email === 'admin@brainforge.com' ? 'admin' : 'user') as SystemRole,
        role_name: null,
        description: null,
        assigned_by: null,
        assigned_at: new Date().toISOString(),
        is_active: true,
      };

      return { user, profile, role };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, profile: null, role: null };
    }
  }

  // بررسی مجوز کاربر - ساده شده
  static async checkPermission(userId: string, permissionKey: string): Promise<boolean> {
    try {
      const { user, role } = await this.getCurrentUser();
      
      // ادمین همه مجوزات را دارد
      if (role?.system_role === 'admin') {
        return true;
      }

      // سایر نقش‌ها فعلا دسترسی محدود دارند
      const basicPermissions = ['calendar.read', 'content.read', 'reports.view'];
      return basicPermissions.includes(permissionKey);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}

// Export برای سازگاری
export const userManagementService = UserManagementService;
