import { supabase } from '@/integrations/supabase/client';

// ایجاد کاربر ادمین پیش‌فرض
export async function createDefaultAdminUser() {
  const adminEmail = 'admin.brainforge@gmail.com';
  const adminPassword = 'Admin123456';
  const adminMobile = '09123456789';

  try {
    console.log('Creating default admin user...');

    // بررسی آیا کاربر ادمین از قبل وجود دارد
    const { data: existingUser } = await supabase.auth.getUser();
    
    // ثبت‌نام کاربر ادمین
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          display_name: 'مدیر سیستم',
          mobile_phone: adminMobile
        }
      }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return;
    }

    console.log('Admin user created successfully:', authData.user?.id);

    // ورود به عنوان ادمین
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError) {
      console.error('Error signing in admin user:', signInError);
      return;
    }

    console.log('Admin user signed in successfully');

    return {
      email: adminEmail,
      password: adminPassword,
      mobile: adminMobile
    };

  } catch (error) {
    console.error('Error in createDefaultAdminUser:', error);
  }
}

// معلومات کاربر ادمین
export const ADMIN_CREDENTIALS = {
  email: 'admin.brainforge@gmail.com',
  password: 'Admin123456',
  mobile: '09123456789'
};
