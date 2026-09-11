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

    const formData = await req.formData()
    const connectionId = formData.get('connectionId') as string
    const audioFile = formData.get('audioFile') as File
    const title = formData.get('title') as string || 'ضبط بدون عنوان'
    const recordedAt = formData.get('recordedAt') as string || new Date().toISOString()

    if (!connectionId || !audioFile) {
      throw new Error('Missing required fields')
    }

    console.log('Starting Hi Dock import:', { connectionId, fileName: audioFile.name, title })

    // Get connection
    const { data: connection } = await supabase
      .from('hi_dock_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single()

    if (!connection) {
      throw new Error('Connection not found')
    }

    // Create import log
    const { data: importLog } = await supabase
      .from('hi_dock_import_logs')
      .insert({
        user_id: user.id,
        connection_id: connectionId,
        import_type: 'manual',
        status: 'success'
      })
      .select()
      .single()

    // Upload audio file to storage
    const fileName = `${user.id}/${Date.now()}_${audioFile.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(fileName, audioFile)

    if (uploadError) throw uploadError

    console.log('Audio file uploaded:', fileName)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName)

    // Create recording entry
    const { data: recording, error } = await supabase
      .from('hi_dock_recordings')
      .insert({
        user_id: user.id,
        connection_id: connectionId,
        dock_recording_id: crypto.randomUUID(),
        title,
        recorded_at: recordedAt,
        duration: 0,
        audio_url: urlData.publicUrl,
        audio_format: audioFile.name.split('.').pop(),
        audio_size: audioFile.size,
        storage_bucket: 'recordings',
        storage_path: fileName,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    console.log('Recording created:', recording.id)

    // Update import log
    await supabase
      .from('hi_dock_import_logs')
      .update({
        files_imported: 1,
        completed_at: new Date().toISOString()
      })
      .eq('id', importLog.id)

    // Update connection last import
    await supabase
      .from('hi_dock_connections')
      .update({ last_import_at: new Date().toISOString() })
      .eq('id', connectionId)

    return new Response(JSON.stringify({ 
      success: true, 
      recording 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Hi Dock import error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})