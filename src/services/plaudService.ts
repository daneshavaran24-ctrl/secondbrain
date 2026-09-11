import { supabase } from '@/integrations/supabase/client'

export interface PlaudConnection {
  id: string
  user_id: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  email?: string
  plaud_user_id?: string
  auto_sync: boolean
  sync_interval: number
  last_sync_at?: string
  sync_audio: boolean
  sync_transcript: boolean
  sync_summary: boolean
  sync_minutes: boolean
  status: 'active' | 'expired' | 'revoked' | 'error'
  error_message?: string
}

export interface PlaudRecording {
  id: string
  user_id: string
  plaud_recording_id: string
  title: string
  description?: string
  recorded_at: string
  duration?: number
  audio_url?: string
  audio_format?: string
  audio_size?: number
  transcript?: string
  transcript_language?: string
  summary?: string
  minutes_json?: any
  minutes_text?: string
  participants?: any[]
  tags?: string[]
  category?: string
  linked_meeting_id?: string
  linked_calendar_event_id?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

class PlaudService {
  
  async getAuthorizationUrl(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('plaud-oauth', {
      body: { action: 'getAuthUrl' }
    })
    
    if (error) throw error
    return data.authUrl
  }

  async connectAccount(code: string): Promise<PlaudConnection> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    // Exchange code for tokens
    const { data: authData, error: authError } = await supabase.functions.invoke('plaud-oauth', {
      body: { action: 'exchangeCode', code }
    })
    
    if (authError) throw authError

    const { tokens, userInfo } = authData

    // Save connection to database
    const { data: connection, error } = await supabase
      .from('plaud_connections')
      .insert({
        user_id: user.user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        email: userInfo.email,
        plaud_user_id: userInfo.plaud_user_id,
        status: 'active' as const
      })
      .select()
      .single()

    if (error) throw error

    // Trigger initial sync
    await this.syncRecordings()

    return connection as PlaudConnection
  }

  async getConnection(): Promise<PlaudConnection | null> {
    const { data, error } = await supabase
      .from('plaud_connections')
      .select('*')
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    return data as PlaudConnection | null
  }

  async syncRecordings(): Promise<void> {
    const { error } = await supabase.functions.invoke('plaud-sync')
    if (error) throw error
  }

  async getRecordings(limit = 50, offset = 0): Promise<PlaudRecording[]> {
    const { data, error } = await supabase
      .from('plaud_recordings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return (data || []) as PlaudRecording[]
  }

  async getRecording(id: string): Promise<PlaudRecording | null> {
    const { data, error } = await supabase
      .from('plaud_recordings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as PlaudRecording
  }

  async linkToMeeting(recordingId: string, meetingId: string): Promise<void> {
    const { error } = await supabase
      .from('plaud_recordings')
      .update({ linked_meeting_id: meetingId })
      .eq('id', recordingId)

    if (error) throw error
  }

  async linkToCalendarEvent(recordingId: string, eventId: string): Promise<void> {
    const { error } = await supabase
      .from('plaud_recordings')
      .update({ linked_calendar_event_id: eventId })
      .eq('id', recordingId)

    if (error) throw error
  }

  async deleteRecording(recordingId: string): Promise<void> {
    const { error } = await supabase
      .from('plaud_recordings')
      .delete()
      .eq('id', recordingId)

    if (error) throw error
  }

  async disconnectAccount(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('plaud_connections')
      .update({ status: 'revoked' })
      .eq('id', connectionId)

    if (error) throw error
  }

  async updateSyncSettings(connectionId: string, settings: Partial<PlaudConnection>): Promise<void> {
    const { error } = await supabase
      .from('plaud_connections')
      .update(settings)
      .eq('id', connectionId)

    if (error) throw error
  }

  async exportToFormat(recordingId: string, format: 'pdf' | 'docx' | 'txt'): Promise<Blob> {
    const recording = await this.getRecording(recordingId)
    if (!recording) throw new Error('Recording not found')

    let content = `عنوان: ${recording.title}\n`
    content += `تاریخ: ${new Date(recording.recorded_at).toLocaleString('fa-IR')}\n`
    content += `مدت: ${recording.duration ? Math.floor(recording.duration / 60) : 0} دقیقه\n\n`
    
    if (recording.summary) {
      content += `خلاصه:\n${recording.summary}\n\n`
    }
    
    if (recording.transcript) {
      content += `متن کامل:\n${recording.transcript}\n\n`
    }
    
    if (recording.minutes_text) {
      content += `صورتجلسه:\n${recording.minutes_text}\n`
    }

    return new Blob([content], { type: 'text/plain' })
  }
}

export const plaudService = new PlaudService()
