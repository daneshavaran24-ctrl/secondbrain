import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MeetingList } from '@/components/meetings/MeetingList';
import { MeetingRecorder } from '@/components/meetings/MeetingRecorder';
import { MeetingPreparation } from '@/components/meetings/MeetingPreparation';
import { ProfessionalMeetingMinutes } from '@/components/professional/ProfessionalMeetingMinutes';
import { ProfessionalMeetingTracker } from '@/components/professional/ProfessionalMeetingTracker';
import { ProfessionalMeetingAnalytics } from '@/components/professional/ProfessionalMeetingAnalytics';
import { Calendar, Video, List, FileText, Target, BarChart3, Lightbulb } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { LuxuryTabs } from '@/components/ui/luxury-tabs';
import { TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface OutletContext {
  sidebarOpen: boolean;
}

const MeetingsPage = () => {
  const { sidebarOpen } = useOutletContext<OutletContext>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("list");
  const isMobile = useIsMobile();

  const handleMeetingRecorded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabItems = [
    {
      value: "list",
      label: "لیست جلسات",
      icon: <List className="h-4 w-4" />
    },
    {
      value: "preparation",
      label: "آمادگی جلسه",
      icon: <Lightbulb className="h-4 w-4" />
    },
    {
      value: "record", 
      label: "ضبط جلسه",
      icon: <Video className="h-4 w-4" />
    },
    {
      value: "minutes",
      label: "صورت‌جلسات",
      icon: <FileText className="h-4 w-4" />
    },
    {
      value: "tracker",
      label: "پیگیری مصوبات",
      icon: <Target className="h-4 w-4" />
    },
    {
      value: "analytics",
      label: "تحلیل جلسات",
      icon: <BarChart3 className="h-4 w-4" />
    }
  ];

  return (
    <div className={cn(
      "min-h-screen bg-gradient-subtle transition-all duration-300 mx-auto",
      isMobile ? "p-3" : "p-6",
      sidebarOpen ? 'max-w-5xl' : 'max-w-7xl'
    )} dir="rtl">
      <SectionHeader
        title="مدیریت جلسات"
        subtitle="ضبط، تحلیل و پیگیری جلسات هوشمند"
        icon={<Calendar className="h-6 w-6" />}
        gradient
      />

      <LuxuryTabs
        items={tabItems}
        value={activeTab}
        onValueChange={setActiveTab}
        className="spacing-relaxed"
      >
        <TabsContent value="list" className="space-y-6" dir="rtl">
          <MeetingList refreshTrigger={refreshTrigger} />
        </TabsContent>
        <TabsContent value="preparation" className="space-y-6" dir="rtl">
          <MeetingPreparation />
        </TabsContent>
        <TabsContent value="record" className="space-y-6" dir="rtl">
          <MeetingRecorder onMeetingCreated={handleMeetingRecorded} />
        </TabsContent>
        <TabsContent value="minutes" className="space-y-6" dir="rtl">
          <ProfessionalMeetingMinutes />
        </TabsContent>
        <TabsContent value="tracker" className="space-y-6" dir="rtl">
          <ProfessionalMeetingTracker />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6" dir="rtl">
          <ProfessionalMeetingAnalytics />
        </TabsContent>
      </LuxuryTabs>
    </div>
  );
};

export default MeetingsPage;