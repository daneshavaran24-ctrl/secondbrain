import React from 'react';
import { PersonalProjectDashboard } from '@/components/project/PersonalProjectDashboard';
import { SectionHeader } from '@/components/ui/section-header';
import { AppIcon } from '@/components/ui/app-icon';
import { User } from 'lucide-react';

export default function PersonalProjectDashboardPage() {
  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <SectionHeader
          title="داشبورد شخصی"
          subtitle="مدیریت وظایف و پروژه‌های شخصی شما"
          icon={<AppIcon size="lg"><User /></AppIcon>}
          gradient
        />
        
        <PersonalProjectDashboard userId="member_1" />
      </div>
    </div>
  );
}