import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require service role key authentication
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Only allow calls with service role key - this ensures only server-side/CLI calls can create admin
    if (!authHeader || !authHeader.includes(serviceRoleKey!)) {
      console.error('Unauthorized admin creation attempt');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized - Service role key required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body for admin details (no hardcoded credentials)
    let adminEmail: string;
    let adminPassword: string;
    
    try {
      const body = await req.json();
      adminEmail = body.email;
      adminPassword = body.password;
      
      if (!adminEmail || !adminPassword) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Email and password are required in request body' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid email format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Validate password strength
      if (adminPassword.length < 8) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password must be at least 8 characters' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request body - JSON with email and password required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Creating admin user with email:', adminEmail);

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    let adminUserId: string;

    if (!existingAdmin) {
      // Create new admin user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          display_name: 'System Admin',
          first_name: 'Admin',
          last_name: 'User'
        }
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        throw new Error(`Failed to create admin user: ${createError.message}`);
      }

      adminUserId = newUser.user!.id;
      console.log('Admin user created successfully:', adminUserId);
    } else {
      adminUserId = existingAdmin.id;
      console.log('Admin user already exists:', adminUserId);
      
      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
        password: adminPassword,
        email_confirm: true
      });

      if (updateError) {
        console.warn('Warning: Could not update admin password:', updateError.message);
      }
    }

    // Create/update admin profile and role
    const { data: profileResult, error: profileError } = await supabaseAdmin.rpc('create_admin_user');

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
      // Continue even if profile creation fails - user is already created
    }

    console.log('Admin setup completed for:', adminEmail);

    // Don't return password in response for security
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created/updated successfully',
        admin_email: adminEmail,
        user_id: adminUserId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-admin function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
