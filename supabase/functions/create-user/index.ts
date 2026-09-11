import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

// Zod schema for input validation
const userDataSchema = z.object({
  email: z.string().email('فرمت ایمیل نامعتبر است').max(255, 'ایمیل نباید بیشتر از 255 کاراکتر باشد'),
  password: z.string()
    .min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد')
    .max(100, 'رمز عبور نباید بیشتر از 100 کاراکتر باشد')
    .regex(/[A-Za-z]/, 'رمز عبور باید حداقل یک حرف داشته باشد')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک عدد داشته باشد'),
  display_name: z.string().min(1).max(255).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  mobile_phone: z.string().regex(/^[0-9+\-().\s]*$/, 'فرمت شماره موبایل نامعتبر است').max(20).optional().nullable(),
  national_id: z.string().max(20).optional().nullable(),
  office_phone: z.string().regex(/^[0-9+\-().\s]*$/).max(20).optional().nullable(),
  home_phone: z.string().regex(/^[0-9+\-().\s]*$/).max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  employee_id: z.string().max(50).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  system_role: z.enum(['user', 'admin', 'moderator']).optional().default('user'),
});

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the request body
    const body = await req.json();
    
    // Validate input with Zod
    const validationResult = userDataSchema.safeParse(body.userData);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors);
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        {
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const userData = validationResult.data;

    console.log('Creating user with data:', { email: userData.email, display_name: userData.display_name });

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        display_name: userData.display_name,
        mobile_phone: userData.mobile_phone
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const user = authData.user;
    if (!user) {
      throw new Error('Failed to create user - no user returned');
    }

    console.log('Auth user created successfully:', user.id);

    // Create user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: user.id,
        email: userData.email,
        mobile_phone: userData.mobile_phone,
        first_name: userData.first_name,
        last_name: userData.last_name,
        display_name: userData.display_name || `${userData.first_name} ${userData.last_name}`.trim(),
        national_id: userData.national_id,
        office_phone: userData.office_phone,
        home_phone: userData.home_phone,
        address: userData.address,
        employee_id: userData.employee_id,
        department: userData.department,
        position: userData.position,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log('User profile created successfully:', profileData.id);

    // Create user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        system_role: userData.system_role || 'user'
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      throw new Error(`Failed to create user role: ${roleError.message}`);
    }

    console.log('User role created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        user: profileData,
        message: 'کاربر با موفقیت ایجاد شد'
      }),
      {
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-user function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'خطای نامشخص در ایجاد کاربر'
      }),
      {
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
