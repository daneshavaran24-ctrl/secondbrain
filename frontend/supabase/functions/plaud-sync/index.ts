import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts';

const PLAUD_API_BASE = 'https://api.plaud.ai'

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

    console.log('Starting Plaud sync for user:', user.id)

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from('plaud_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (connError || !connection) {
      console.error('Connection error:', connError)
      throw new Error('No active Plaud connection found')
    }

    let recordingsSynced = 0
    let recordingsFailed = 0

    // Create sync log
    const { data: syncLog } = await supabase
      .from('plaud_sync_logs')
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        sync_type: 'manual',
        status: 'success'
      })
      .select()
      .single()

    console.log('Fetching recordings from Plaud API')

    // Fetch recordings from Plaud API
    const recordingsResponse = await fetch(`${PLAUD_API_BASE}/v1/recordings`, {
      headers: { 
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json'
      },
    })

    if (!recordingsResponse.ok) {
      const errorText = await recordingsResponse.text()
      console.error('Plaud API error:', errorText)
      throw new Error('Failed to fetch recordings from Plaud')
    }

    const recordingsData = await recordingsResponse.json()
    console.log('Fetched recordings:', recordingsData.recordings?.length || 0)

    // Process each recording
    for (const recording of recordingsData.recordings || []) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from('plaud_recordings')
          .select('id')
          .eq('plaud_recording_id', recording.id)
          .maybeSingle()

        if (existing) {
          console.log(`Recording ${recording.id} already exists, skipping`)
          continue
        }

        // Fetch detailed data
        const details = await fetchRecordingDetails(recording.id, connection.access_token)

        // Insert recording
        const { error } = await supabase
          .from('plaud_recordings')
          .insert({
            user_id: user.id,
            connection_id: connection.id,
            plaud_recording_id: recording.id,
            title: recording.title || 'بدون عنوان',
            description: recording.description,
            recorded_at: recording.recorded_at || new Date().toISOString(),
            duration: recording.duration,
            audio_url: details.audio_url,
            audio_format: details.audio_format,
            audio_size: details.audio_size,
            transcript: details.transcript,
            transcript_language: details.transcript_language,
            summary: details.summary,
            minutes_json: details.minutes_json,
            minutes_text: details.minutes_text,
            participants: details.participants,
            tags: details.tags,
            category: details.category,
            processing_status: 'completed'
          })

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        
        recordingsSynced++
        console.log(`Synced recording ${recording.id}`)
      } catch (error) {
        console.error(`Error syncing recording ${recording.id}:`, error)
        recordingsFailed++
      }
    }

    // Update sync log
    await supabase
      .from('plaud_sync_logs')
      .update({
        records_synced: recordingsSynced,
        recordings_failed: recordingsFailed,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncLog.id)

    // Update last sync
    await supabase
      .from('plaud_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id)

    console.log(`Sync completed: ${recordingsSynced} synced, ${recordingsFailed} failed`)

    return new Response(JSON.stringify({ 
      success: true, 
      synced: recordingsSynced,
      failed: recordingsFailed 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Plaud sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function fetchRecordingDetails(recordingId: string, token: string) {
  try {
    const response = await fetch(`${PLAUD_API_BASE}/v1/recordings/${recordingId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch details for ${recordingId}`)
      return {}
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching recording details:`, error)
    return {}
  }
}
