import { supabase } from '@/integrations/supabase/client';

/**
 * تابع کمکی برای ورود بدون نیاز به تأیید ایمیل
 * این تابع تأیید ایمیل را کاملاً نادیده می‌گیرد
 */
export const signInWithoutEmailConfirmation = async (email: string, password: string) => {
  try {
    // تلاش برای ورود معمولی
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // اگر خطای تأیید ایمیل بود، آن را نادیده بگیر
    if (error?.message?.includes('Email not confirmed') || 
        error?.message?.includes('email_not_confirmed')) {
      
      console.log('Email confirmation requirement bypassed');
      
      // بررسی اینکه آیا session وجود دارد
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        return {
          data: {
            user: sessionData.session.user,
            session: sessionData.session
          },
          error: null
        };
      }
      
      // اگر session نیست، سعی کن مجدداً
      return { data: null, error: new Error('ایمیل یا رمز عبور اشتباه است') };
    }

    // اگر خطای دیگری بود، آن را برگردان
    if (error) {
      return { data: null, error };
    }

    // اگر موفق بود، نتیجه را برگردان
    return { data, error: null };

  } catch (err: any) {
    return { data: null, error: err };
  }
};

/**
 * تابع کمکی برای ثبت‌نام بدون نیاز به تأیید ایمیل
 */
export const signUpWithoutEmailConfirmation = async (
  email: string, 
  password: string, 
  additionalData?: Record<string, any>
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // نادیده گرفتن redirect
        data: additionalData
      }
    });

    // حتی اگر خطای تأیید ایمیل آمد، کاربر ایجاد شده است
    if (error?.message?.includes('Email not confirmed') || 
        error?.message?.includes('email_not_confirmed')) {
      console.log('User created successfully, email confirmation bypassed');
    }

    return { data, error: null };

  } catch (err: any) {
    return { data: null, error: err };
  }
};

/**
 * چک کردن وضعیت احراز هویت بدون توجه به تأیید ایمیل
 */
export const getCurrentUserWithoutEmailCheck = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('Auth error:', error.message);
      return { user: null, error };
    }

    // کاربر موجود است، حتی اگر ایمیل تأیید نشده باشد
    return { user, error: null };

  } catch (err: any) {
    return { user: null, error: err };
  }
};
