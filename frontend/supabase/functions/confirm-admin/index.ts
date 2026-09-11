import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email, password } = await req.json()
    
    // اگر کاربر admin@brainforge.com است، تأیید کن
    if (email === 'admin@brainforge.com') {
      // ابتدا بررسی کن که آیا کاربر موجود است
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(user => user.email === email);
      
      if (!existingUser) {
        // ایجاد کاربر admin
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            display_name: 'مدیر سیستم',
            role: 'admin'
          }
        })

        if (createError) {
          throw createError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Admin user created successfully',
            user: newUser.user
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        // کاربر موجود است، فقط تأیید کن
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        )

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Admin user confirmed successfully',
            user: existingUser
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Only admin@brainforge.com is allowed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
