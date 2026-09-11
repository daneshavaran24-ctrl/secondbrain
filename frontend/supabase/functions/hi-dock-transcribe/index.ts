import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

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

    const { recordingId } = await req.json()

    console.log('Starting transcription for recording:', recordingId)

    // Get recording
    const { data: recording } = await supabase
      .from('hi_dock_recordings')
      .select('*')
      .eq('id', recordingId)
      .single()

    if (!recording) throw new Error('Recording not found')

    // Update status
    await supabase
      .from('hi_dock_recordings')
      .update({ processing_status: 'processing' })
      .eq('id', recordingId)

    // Download audio file
    const audioResponse = await fetch(recording.audio_url)
    const audioBlob = await audioResponse.blob()

    console.log('Audio file downloaded, starting Whisper transcription')

    // Transcribe with OpenAI Whisper
    const formData = new FormData()
    formData.append('file', audioBlob, `audio.${recording.audio_format}`)
    formData.append('model', 'whisper-1')
    formData.append('language', 'fa')

    const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    })

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text()
      console.error('Whisper transcription failed:', errorText)
      throw new Error('Transcription failed')
    }

    const transcriptionData = await transcribeResponse.json()
    console.log('Transcription completed, generating summary')

    // Generate summary using GPT
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that summarizes meeting recordings in Persian.' 
          },
          { 
            role: 'user', 
            content: `لطفاً این متن را خلاصه کن:\n\n${transcriptionData.text}` 
          }
        ]
      })
    })

    if (!summaryResponse.ok) {
      console.error('Summary generation failed')
    }

    const summaryData = await summaryResponse.json()
    const summary = summaryData.choices[0].message.content

    console.log('Summary generated, updating database')

    // Update recording with transcript and summary
    const { error } = await supabase
      .from('hi_dock_recordings')
      .update({
        transcript: transcriptionData.text,
        summary,
        processing_status: 'completed'
      })
      .eq('id', recordingId)

    if (error) throw error

    console.log('Transcription completed successfully')

    return new Response(JSON.stringify({ 
      success: true,
      transcript: transcriptionData.text,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Transcription error:', error)
    
    // Update status to failed
    try {
      const authHeader = req.headers.get('Authorization')!
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      
      const { recordingId } = await req.json()
      await supabase
        .from('hi_dock_recordings')
        .update({ 
          processing_status: 'failed',
          error_message: error.message 
        })
        .eq('id', recordingId)
    } catch (e) {
      console.error('Failed to update error status:', e)
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})