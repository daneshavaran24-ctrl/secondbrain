import { useState } from 'react'
import { Upload, FileAudio } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ModernButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hiDockService } from '@/services/hiDockService'
import { toast } from 'sonner'

interface HiDockImportManagerProps {
  connectionId: string
  onImportComplete?: () => void
}

export const HiDockImportManager = ({ connectionId, onImportComplete }: HiDockImportManagerProps) => {
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('لطفاً یک فایل صوتی انتخاب کنید')
      return
    }

    if (!title.trim()) {
      toast.error('لطفاً عنوان را وارد کنید')
      return
    }

    try {
      setIsImporting(true)
      await hiDockService.importRecording(connectionId, selectedFile, title)
      toast.success('فایل با موفقیت Import شد و در حال پردازش است')
      setSelectedFile(null)
      setTitle('')
      onImportComplete?.()
    } catch (error) {
      console.error('Error importing file:', error)
      toast.error('خطا در Import فایل')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import فایل صوتی
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="audio-file">فایل صوتی (WAV, MP3)</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/wav,audio/mp3,audio/mpeg"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileAudio className="h-4 w-4" />
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="title">عنوان</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جلسه با تیم بازاریابی"
            />
          </div>

          <ModernButton
            onClick={handleImport}
            loading={isImporting}
            disabled={!selectedFile || !title}
            icon={<Upload className="h-4 w-4" />}
            className="w-full"
          >
            Import و پردازش
          </ModernButton>
        </div>
      </CardContent>
    </Card>
  )
}