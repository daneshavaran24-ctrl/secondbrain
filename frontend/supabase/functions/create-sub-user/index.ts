import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

// Zod schema for input validation
const permissionSchema = z.object({
  domain: z.string().min(1, 'دامنه الزامی است').max(100),
  permissions: z.array(z.string().max(50)).min(1, 'حداقل یک دسترسی لازم است'),
});

const createSubUserSchema = z.object({
  owner_id: z.string().uuid('فرمت شناسه مالک نامعتبر است'),
  name: z.string()
    .min(1, 'نام الزامی است')
    .max(255, 'نام نباید بیشتر از 255 کاراکتر باشد'),
  email: z.string()
    .email('فرمت ایمیل نامعتبر است')
    .max(255, 'ایمیل نباید بیشتر از 255 کاراکتر باشد'),
  password: z.string()
    .min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد')
    .max(100, 'رمز عبور نباید بیشتر از 100 کاراکتر باشد')
    .regex(/[A-Za-z]/, 'رمز عبور باید حداقل یک حرف داشته باشد')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک عدد داشته باشد'),
  permissions: z.array(permissionSchema).min(1, 'حداقل یک دسترسی لازم است'),
  expires_at: z.string().datetime().optional().nullable(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // احراز هویت کاربر
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // دریافت و اعتبارسنجی داده‌های درخواست با Zod
    const body = await req.json();
    const validationResult = createSubUserSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { owner_id, name, email, password, permissions, expires_at } = validationResult.data;

    // بررسی اینکه کاربر احراز شده همان owner است
    if (user.id !== owner_id) {
      throw new Error('شما فقط می‌توانید برای خودتان کاربر فرعی ایجاد کنید');
    }

    // بررسی تعداد کاربران فرعی فعال
    const { count, error: countError } = await supabase
      .from('sub_users')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', owner_id)
      .eq('is_active', true);

    if (countError) throw countError;

    if (count && count >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'هر مالک فقط می‌تواند حداکثر 3 کاربر فرعی فعال داشته باشد' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // بررسی یکتا بودن ایمیل
    const { data: existingUser } = await supabase
      .from('sub_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('این ایمیل قبلاً استفاده شده است');
    }

    // هش کردن پسورد با bcrypt (cost factor 10 - secure and reasonable performance)
    const password_hash = await bcrypt.hash(password);

    // ایجاد کاربر فرعی
    const { data: subUser, error: insertError } = await supabase
      .from('sub_users')
      .insert({
        owner_id,
        name,
        email,
        password_hash,
        is_active: true,
        expires_at: expires_at || null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // افزودن permissions
    if (permissions && permissions.length > 0) {
      const permissionsData = permissions.map(p => ({
        sub_user_id: subUser.id,
        domain: p.domain,
        permissions: p.permissions
      }));

      const { error: permError } = await supabase
        .from('sub_user_permissions')
        .insert(permissionsData);

      if (permError) {
        // در صورت خطا در permissions، کاربر را حذف کن
        await supabase.from('sub_users').delete().eq('id', subUser.id);
        throw permError;
      }
    }

    // ثبت لاگ
    await supabase.from('auth_audit').insert({
      actor_id: user.id,
      actor_type: 'owner',
      action: 'create_sub_user',
      details: {
        sub_user_id: subUser.id,
        sub_user_email: email,
        permissions_count: permissions.length
      },
      ip_address: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null
    });

    console.log(`کاربر فرعی ${email} با موفقیت ایجاد شد`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sub_user: subUser
      }),
      {
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-sub-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'خطای داخلی سرور'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
