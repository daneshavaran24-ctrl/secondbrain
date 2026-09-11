import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

// Zod schema for input validation
const loginSchema = z.object({
  email: z.string().email('فرمت ایمیل نامعتبر است').max(255, 'ایمیل نباید بیشتر از 255 کاراکتر باشد'),
  password: z.string().min(1, 'رمز عبور الزامی است').max(100, 'رمز عبور نباید بیشتر از 100 کاراکتر باشد'),
});

interface SubUserPermission {
  domain: string;
  permissions: string[];
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Sub-User Login Request Received');

    // Parse request body
    const body = await req.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.errors);
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 400, 
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, password } = validationResult.data;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔍 Looking up sub-user: ${email}`);

    // Find sub-user by email
    const { data: subUser, error: subUserError } = await supabase
      .from('sub_users')
      .select('*')
      .eq('email', email)
      .single();

    if (subUserError || !subUser) {
      console.error('❌ Sub-user not found:', email);
      
      // Log failed login attempt
      await supabase.from('auth_audit').insert({
        actor_type: 'sub_user',
        action: 'login_failed',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        details: { 
          email,
          reason: 'user_not_found'
        }
      });

      return new Response(
        JSON.stringify({ error: 'ایمیل یا رمز عبور اشتباه است' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Sub-user found: ${subUser.id}`);

    // Check if user is active
    if (!subUser.is_active) {
      console.error('❌ Sub-user is inactive:', subUser.id);
      
      await supabase.from('auth_audit').insert({
        actor_type: 'sub_user',
        actor_id: subUser.id,
        action: 'login_failed',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        details: { 
          email,
          reason: 'user_inactive'
        }
      });

      return new Response(
        JSON.stringify({ error: 'حساب کاربری شما غیرفعال شده است' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user has expired
    if (subUser.expires_at && new Date(subUser.expires_at) < new Date()) {
      console.error('❌ Sub-user has expired:', subUser.id);
      
      await supabase.from('auth_audit').insert({
        actor_type: 'sub_user',
        actor_id: subUser.id,
        action: 'login_failed',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        details: { 
          email,
          reason: 'user_expired',
          expires_at: subUser.expires_at
        }
      });

      return new Response(
        JSON.stringify({ error: 'مدت اعتبار حساب کاربری شما به پایان رسیده است' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify password
    console.log('🔑 Verifying password...');
    const passwordMatch = await bcrypt.compare(password, subUser.password_hash);

    if (!passwordMatch) {
      console.error('❌ Password mismatch for:', email);
      
      await supabase.from('auth_audit').insert({
        actor_type: 'sub_user',
        actor_id: subUser.id,
        action: 'login_failed',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        details: { 
          email,
          reason: 'invalid_password'
        }
      });

      return new Response(
        JSON.stringify({ error: 'ایمیل یا رمز عبور اشتباه است' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Password verified successfully');

    // Fetch permissions
    const { data: permissions, error: permError } = await supabase
      .from('sub_user_permissions')
      .select('domain, permissions')
      .eq('sub_user_id', subUser.id);

    if (permError) {
      console.error('❌ Error fetching permissions:', permError);
    }

    const userPermissions: SubUserPermission[] = permissions || [];
    console.log(`📋 Loaded ${userPermissions.length} permissions`);

    // Generate secure JWT token (15 minutes expiry)
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'خطای پیکربندی سرور' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes

    // Create signed JWT token with full security claims
    const jti = crypto.randomUUID(); // Unique token ID for revocation support
    const token = await new jose.SignJWT({
      sub: subUser.id,
      typ: 'sub_user',
      jti, // JWT ID for token revocation
      owner_id: subUser.owner_id,
      email: subUser.email,
      name: subUser.name,
      domains: userPermissions.map(p => p.domain),
      permissions: userPermissions,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('brainforge')
      .setAudience('brainforge-app')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);

    console.log('✅ Secure JWT token generated successfully');

    // Log successful login
    await supabase.from('auth_audit').insert({
      actor_type: 'sub_user',
      actor_id: subUser.id,
      action: 'login_success',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      details: { 
        email,
        domains: userPermissions.map(p => p.domain)
      }
    });

    console.log('✅ Sub-User Login Successful:', subUser.id);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: subUser.id,
          email: subUser.email,
          name: subUser.name,
          owner_id: subUser.owner_id,
          type: 'sub_user'
        },
        permissions: userPermissions,
        expiresAt
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in sub-user-login:', error);
    return new Response(
      JSON.stringify({ 
        error: 'خطای سرور. لطفاً دوباره تلاش کنید'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
