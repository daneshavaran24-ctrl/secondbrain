import { ResponsiveContainer, ResponsiveSection } from '@/components/ui/responsive-container'
import { SectionHeader } from '@/components/ui/section-header'
import { PlaudConnectionCard } from '@/components/plaud/PlaudConnectionCard'
import { PlaudRecordingsLibrary } from '@/components/plaud/PlaudRecordingsLibrary'
import { Mic } from 'lucide-react'

export const PlaudPage = () => {
  return (
    <ResponsiveContainer variant="page" className="bg-gradient-subtle">
      <ResponsiveSection spacing="lg">
        <SectionHeader
          title="Plaud AI - ضبط هوشمند جلسات"
          subtitle="مدیریت ضبط‌های صوتی، متن، خلاصه و صورتجلسه"
          icon={<Mic className="h-6 w-6" />}
          gradient
        />

        <PlaudConnectionCard />
        
        <PlaudRecordingsLibrary />
      </ResponsiveSection>
    </ResponsiveContainer>
  )
}
