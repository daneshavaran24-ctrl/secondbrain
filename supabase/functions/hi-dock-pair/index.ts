import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, deviceSerial, deviceName, connectionType, connectionId } = await req.json()

    if (action === 'pair') {
      // Check if device already paired
      const { data: existing } = await supabase
        .from('hi_dock_connections')
        .select('id')
        .eq('device_serial', deviceSerial)
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Device already paired' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create new connection
      const { data: connection, error } = await supabase
        .from('hi_dock_connections')
        .insert({
          user_id: user.id,
          device_serial: deviceSerial,
          device_name: deviceName || 'Hi Dock H1',
          connection_type: connectionType || 'usb',
          paired: true,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      console.log('Hi Dock paired successfully:', connection.id)

      return new Response(JSON.stringify({ 
        success: true, 
        connection 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'unpair') {
      const { error } = await supabase
        .from('hi_dock_connections')
        .update({ 
          paired: false, 
          status: 'disconnected' 
        })
        .eq('id', connectionId)
        .eq('user_id', user.id)

      if (error) throw error

      console.log('Hi Dock unpaired successfully:', connectionId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Hi Dock pair error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})