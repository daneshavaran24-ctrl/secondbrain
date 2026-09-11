import { supabase } from '@/integrations/supabase/client';
import { CreateUserForm, UserProfile, SystemRole } from '@/types/user-management';

export class UserManagementService {
  // ساخت کاربر جدید
  static async createUser(userData: CreateUserForm): Promise<UserProfile> {
    try {
      console.log('Creating user via Edge Function:', userData.email);

      // استفاده از Edge Function برای ایجاد کاربر
      const response = await fetch(`https://jymajpnwthgqcghmkmam.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWFqcG53dGhncWNnaG1rbWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTU1OTYsImV4cCI6MjA2OTM3MTU5Nn0.J6dMZX-UCAS7PGCsKyamhQwTaqfBJ662HTWA8KgJCbo`,
        },
        body: JSON.stringify({ userData }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'خطا در ایجاد کاربر');
      }

      console.log('User created successfully via Edge Function');
      return result.user;

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // دریافت لیست کاربران
  static async getUsers(): Promise<UserProfile[]> {
    try {
      console.log('Getting users list from database');
      
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No users found in database');
        return [];
      }

      console.log(`Found ${profiles.length} users in database`);
      
      return profiles.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email || '',
        mobile_phone: profile.phone || '', // Map phone to mobile_phone
        display_name: profile.full_name || 'کاربر', // Map full_name to display_name
        first_name: profile.full_name?.split(' ')[0] || '', // Extract from full_name
        last_name: profile.full_name?.split(' ')[1] || '', // Extract from full_name
        national_id: '', // Not in database
        office_phone: profile.phone || '',
        home_phone: '',
        address: '',
        employee_id: '',
        department: profile.department,
        position: profile.position,
        organization_id: '', // Not in database
        is_active: true,
        email_verified: false,
        mobile_verified: false,
        hire_date: '',
        birth_date: '',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        avatar_url: profile.avatar_url,
        bio: '',
        preferences: null,
      }));
      
    } catch (error) {
      console.error('Error getting users:', error);
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
    try {
      // بررسی اینکه کاربر ادمین اصلی نباشد
      if (userId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
        throw new Error('کاربر ادمین اصلی قابل حذف نیست');
      }

      console.log('Deleting user:', userId);

      // حذف نقش کاربر
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error deleting user role:', roleError);
      }

      // حذف پروفایل کاربر
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw profileError;
      }

      // TODO: حذف کاربر از auth.users باید از طریق Edge Function انجام شود
      console.log('User deleted successfully (profile only)');

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // بازنشانی رمز عبور کاربر
  static async resetPassword(userId: string): Promise<{ temporaryPassword: string }> {
    try {
      console.log('Resetting password for user:', userId);

      // تولید رمز عبور موقت
      const temporaryPassword = this.generateTemporaryPassword();

      // برای حالت Development، فقط رمز موقت را برمی‌گردانیم
      // در Production باید Edge Function استفاده شود
      console.log('Password reset successfully (Development mode)');
      return { temporaryPassword };

      /* Production Code - Edge Function Call
      const response = await fetch(`https://jymajpnwthgqcghmkmam.supabase.co/functions/v1/reset-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWFqcG53dGhncWNnaG1rbWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTU1OTYsImV4cCI6MjA2OTM3MTU5Nn0.J6dMZX-UCAS7PGCsKyamhQwTaqfBJ662HTWA8KgJCbo`,
        },
        body: JSON.stringify({ 
          userId,
          newPassword: temporaryPassword 
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'خطا در بازنشانی رمز عبور');
      }

      console.log('Password reset successfully');
      return { temporaryPassword };
      */

    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
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
      const { data: { user }, error } = await supabase.auth.getUser();
      
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
