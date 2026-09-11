import { useState, useEffect } from 'react'
import { Play, Download, FileText, Trash2, Calendar, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ModernButton } from '@/components/ui/modern-button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { hiDockService, HiDockRecording } from '@/services/hiDockService'
import { toast } from 'sonner'

export const HiDockRecordingsLibrary = () => {
  const [recordings, setRecordings] = useState<HiDockRecording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<HiDockRecording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    try {
      setLoading(true)
      const data = await hiDockService.getRecordings()
      setRecordings(data)
    } catch (error) {
      console.error('Error loading recordings:', error)
      toast.error('خطا در بارگیری ضبط‌ها')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayRecording = (recording: HiDockRecording) => {
    setSelectedRecording(recording)
    setIsPlaying(true)
  }

  const handleExport = async (recording: HiDockRecording) => {
    try {
      const blob = await hiDockService.exportToFormat(recording.id, 'txt')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recording.title}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('فایل دانلود شد')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('خطا در دانلود فایل')
    }
  }

  const handleDelete = async (recordingId: string) => {
    try {
      await hiDockService.deleteRecording(recordingId)
      toast.success('ضبط حذف شد')
      loadRecordings()
    } catch (error) {
      console.error('Error deleting recording:', error)
      toast.error('خطا در حذف ضبط')
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">تکمیل شده</Badge>
      case 'processing':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />در حال پردازش</Badge>
      case 'pending':
        return <Badge variant="outline">در انتظار</Badge>
      case 'failed':
        return <Badge variant="destructive">خطا</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">کتابخانه ضبط‌های Hi Dock</h2>
        <Badge variant="secondary">{recordings.length} ضبط</Badge>
      </div>

      {loading ? (
        <div className="text-center py-12">در حال بارگیری...</div>
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">هیچ ضبطی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((recording) => (
            <Card key={recording.id}>
              <CardHeader>
                <CardTitle className="text-lg">{recording.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(recording.recorded_at).toLocaleDateString('fa-IR')}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>مدت:</span>
                  <span className="font-medium">{formatDuration(recording.duration)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(recording.processing_status)}
                  {recording.transcript && <Badge variant="outline">متن</Badge>}
                  {recording.summary && <Badge variant="outline">خلاصه</Badge>}
                </div>

                <div className="flex gap-2">
                  <ModernButton
                    onClick={() => handlePlayRecording(recording)}
                    size="sm"
                    icon={<Play className="h-3 w-3" />}
                    className="flex-1"
                    disabled={!recording.audio_url}
                  >
                    پخش
                  </ModernButton>
                  
                  <ModernButton
                    onClick={() => handleExport(recording)}
                    size="sm"
                    variant="outline"
                    icon={<Download className="h-3 w-3" />}
                    disabled={recording.processing_status !== 'completed'}
                  >
                    دانلود
                  </ModernButton>
                  
                  <ModernButton
                    onClick={() => handleDelete(recording.id)}
                    size="sm"
                    variant="destructive"
                    icon={<Trash2 className="h-3 w-3" />}
                  >
                    حذف
                  </ModernButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Player Dialog */}
      <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedRecording?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedRecording && (
            <div className="space-y-4">
              {/* Audio Player */}
              {selectedRecording.audio_url && (
                <audio controls className="w-full">
                  <source src={selectedRecording.audio_url} type={`audio/${selectedRecording.audio_format}`} />
                </audio>
              )}

              {/* Transcript */}
              {selectedRecording.transcript && (
                <div>
                  <h3 className="font-semibold mb-2">متن ضبط:</h3>
                  <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                    {selectedRecording.transcript}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedRecording.summary && (
                <div>
                  <h3 className="font-semibold mb-2">خلاصه:</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    {selectedRecording.summary}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}