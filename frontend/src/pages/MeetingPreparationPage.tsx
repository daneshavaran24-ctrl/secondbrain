import React from 'react';
import { MeetingPreparation } from '@/components/meetings/MeetingPreparation';
import { SectionHeader } from '@/components/ui/section-header';

const MeetingPreparationPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SectionHeader
        title="آمادگی قبل از جلسه"
        subtitle="منابع، اخبار، مقالات و تحلیل‌های مرتبط با موضوع جلسات آینده"
      />
      <MeetingPreparation />
    </div>
  );
};

export default MeetingPreparationPage;
