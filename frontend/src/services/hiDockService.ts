import { supabase } from '@/integrations/supabase/client'

export interface HiDockConnection {
  id: string
  user_id: string
  device_serial: string
  device_name: string
  device_version?: string
  connection_type: 'usb' | 'bluetooth'
  paired: boolean
  auto_import: boolean
  last_import_at?: string
  import_interval: number
  import_audio: boolean
  import_transcript: boolean
  import_summary: boolean
  auto_process: boolean
  status: 'active' | 'disconnected' | 'error'
  error_message?: string
  created_at: string
  updated_at: string
}

export interface HiDockRecording {
  id: string
  user_id: string
  connection_id: string
  dock_recording_id: string
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
  notes_text?: string
  extracted_keywords?: any
  participants?: any[]
  tags?: string[]
  category?: string
  linked_meeting_id?: string
  linked_calendar_event_id?: string
  linked_task_id?: string
  storage_bucket?: string
  storage_path?: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
}

class HiDockService {
  
  async pairDevice(deviceSerial: string, deviceName?: string, connectionType: 'usb' | 'bluetooth' = 'usb'): Promise<HiDockConnection> {
    const { data, error } = await supabase.functions.invoke('hi-dock-pair', {
      body: { 
        action: 'pair',
        deviceSerial,
        deviceName,
        connectionType
      }
    })
    
    if (error) throw error
    if (!data.success) throw new Error(data.error)
    
    return data.connection
  }

  async unpairDevice(connectionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('hi-dock-pair', {
      body: { 
        action: 'unpair',
        connectionId
      }
    })
    
    if (error) throw error
  }

  async getConnection(): Promise<HiDockConnection | null> {
    const { data, error } = await supabase
      .from('hi_dock_connections')
      .select('*')
      .eq('paired', true)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    return data as HiDockConnection | null
  }

  async importRecording(
    connectionId: string, 
    audioFile: File, 
    title: string,
    recordedAt?: string
  ): Promise<HiDockRecording> {
    const formData = new FormData()
    formData.append('connectionId', connectionId)
    formData.append('audioFile', audioFile)
    formData.append('title', title)
    if (recordedAt) formData.append('recordedAt', recordedAt)

    const { data, error } = await supabase.functions.invoke('hi-dock-import', {
      body: formData
    })
    
    if (error) throw error
    if (!data.success) throw new Error(data.error)
    
    // Auto-process if enabled
    const connection = await this.getConnection()
    if (connection?.auto_process) {
      await this.transcribeRecording(data.recording.id)
    }
    
    return data.recording
  }

  async transcribeRecording(recordingId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('hi-dock-transcribe', {
      body: { recordingId }
    })
    
    if (error) throw error
  }

  async getRecordings(limit = 50, offset = 0): Promise<HiDockRecording[]> {
    const { data, error } = await supabase
      .from('hi_dock_recordings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return (data || []) as HiDockRecording[]
  }

  async getRecording(id: string): Promise<HiDockRecording | null> {
    const { data, error } = await supabase
      .from('hi_dock_recordings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as HiDockRecording | null
  }

  async deleteRecording(recordingId: string): Promise<void> {
    // Get recording to delete audio file from storage
    const recording = await this.getRecording(recordingId)
    
    if (recording?.storage_path) {
      await supabase.storage
        .from('recordings')
        .remove([recording.storage_path])
    }

    const { error } = await supabase
      .from('hi_dock_recordings')
      .delete()
      .eq('id', recordingId)

    if (error) throw error
  }

  async updateConnectionSettings(connectionId: string, settings: Partial<HiDockConnection>): Promise<void> {
    const { error } = await supabase
      .from('hi_dock_connections')
      .update(settings)
      .eq('id', connectionId)

    if (error) throw error
  }

  async linkToMeeting(recordingId: string, meetingId: string): Promise<void> {
    const { error } = await supabase
      .from('hi_dock_recordings')
      .update({ linked_meeting_id: meetingId })
      .eq('id', recordingId)

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
      content += `متن کامل:\n${recording.transcript}\n`
    }

    return new Blob([content], { type: 'text/plain' })
  }
}

export const hiDockService = new HiDockService()