import { useState, useEffect } from 'react'
import { Usb } from 'lucide-react'
import { ResponsiveContainer, ResponsiveSection } from '@/components/ui/responsive-container'
import { SectionHeader } from '@/components/ui/section-header'
import { HiDockConnectionCard } from '@/components/hi-dock/HiDockConnectionCard'
import { HiDockImportManager } from '@/components/hi-dock/HiDockImportManager'
import { HiDockRecordingsLibrary } from '@/components/hi-dock/HiDockRecordingsLibrary'
import { hiDockService } from '@/services/hiDockService'

export const HiDockPage = () => {
  const [connectionId, setConnectionId] = useState<string | null>(null)

  useEffect(() => {
    loadConnection()
  }, [])

  const loadConnection = async () => {
    const connection = await hiDockService.getConnection()
    setConnectionId(connection?.id || null)
  }

  return (
    <ResponsiveContainer variant="page" className="bg-gradient-subtle">
      <ResponsiveSection spacing="lg">
        <SectionHeader
          title="Hi Dock H1"
          subtitle="داک چندمنظوره با قابلیت ضبط و تبدیل صدا به متن"
          icon={<Usb className="h-6 w-6" />}
          gradient
        />

        <HiDockConnectionCard />
        
        {connectionId && (
          <>
            <HiDockImportManager 
              connectionId={connectionId}
              onImportComplete={loadConnection}
            />
            <HiDockRecordingsLibrary />
          </>
        )}
      </ResponsiveSection>
    </ResponsiveContainer>
  )
}