import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('غیرمجاز - کاربر یافت نشد');
    }

    const results = {
      success: true,
      created: {
        company: null as any,
        organization: null as any,
        profile: null as any,
      },
      errors: [] as string[],
    };

    // 1. ایجاد پروفایل کاربر اگر وجود ندارد
    try {
      const { data: existingProfile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        const { data: profile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .insert({
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'کاربر',
            email: user.email,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        results.created.profile = profile;
      } else {
        results.created.profile = existingProfile;
      }
    } catch (error: any) {
      results.errors.push(`خطا در ایجاد پروفایل: ${error.message}`);
    }

    // 2. ایجاد شرکت پیش‌فرض
    try {
      const { data: existingCompany } = await supabaseClient
        .from('business_companies')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_name', 'شرکت شماره یک')
        .single();

      if (!existingCompany) {
        const { data: company, error: companyError } = await supabaseClient
          .from('business_companies')
          .insert({
            user_id: user.id,
            company_name: 'شرکت شماره یک',
            industry: 'عمومی',
            description: 'شرکت پیش‌فرض برای شروع کار',
            tags: ['پیش‌فرض'],
          })
          .select()
          .single();

        if (companyError) throw companyError;
        results.created.company = company;
      } else {
        results.created.company = existingCompany;
      }
    } catch (error: any) {
      results.errors.push(`خطا در ایجاد شرکت: ${error.message}`);
    }

    // 3. ایجاد سازمان پیش‌فرض
    try {
      const { data: existingOrg } = await supabaseClient
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'سازمان شماره یک')
        .single();

      if (!existingOrg) {
        const { data: organization, error: orgError } = await supabaseClient
          .from('organizations')
          .insert({
            user_id: user.id,
            name: 'سازمان شماره یک',
            type: 'other',
            description: 'سازمان پیش‌فرض برای شروع کار',
            tags: ['پیش‌فرض'],
          })
          .select()
          .single();

        if (orgError) throw orgError;
        results.created.organization = organization;
      } else {
        results.created.organization = existingOrg;
      }
    } catch (error: any) {
      results.errors.push(`خطا در ایجاد سازمان: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        ...results,
        message: results.errors.length > 0
          ? 'بعضی از داده‌ها با خطا مواجه شدند'
          : 'تمام داده‌های پیش‌فرض با موفقیت ایجاد شدند',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('خطا در seed database:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
