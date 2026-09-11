import { useState } from 'react';
import { FileText, Download, Share2, Eye } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResumeTemplateList } from '@/components/resume/templates/ResumeTemplateList';
import { ResumePersonalInfo } from '@/components/resume/ResumePersonalInfo';
import { ResumeEducation } from '@/components/resume/ResumeEducation';
import { ResumeWorkExperience } from '@/components/resume/ResumeWorkExperience';
import { ResumeSkills } from '@/components/resume/ResumeSkills';
import { ResumeCertificates } from '@/components/resume/ResumeCertificates';
import { ResumeAwards } from '@/components/resume/ResumeAwards';
import { ResumeAffiliations } from '@/components/resume/ResumeAffiliations';
import { ResumePublications } from '@/components/resume/ResumePublications';
import { ResumeMediaInterviews } from '@/components/resume/ResumeMediaInterviews';
import { ResumeInterests } from '@/components/resume/ResumeInterests';

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <SectionHeader
        title="رزومه حرفه‌ای"
        subtitle="مدیریت و ساخت رزومه‌های اختصاصی برای موقعیت‌های شغلی مختلف"
        icon={<FileText className="w-6 h-6" />}
      />

      <div className="mb-8">
        <ResumeTemplateList />
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-10 mb-6">
            <TabsTrigger value="personal">اطلاعات شخصی</TabsTrigger>
            <TabsTrigger value="education">تحصیلات</TabsTrigger>
            <TabsTrigger value="work">سوابق کاری</TabsTrigger>
            <TabsTrigger value="certificates">گواهینامه‌ها</TabsTrigger>
            <TabsTrigger value="awards">افتخارات</TabsTrigger>
            <TabsTrigger value="skills">مهارت‌ها</TabsTrigger>
            <TabsTrigger value="affiliations">عضویت‌ها</TabsTrigger>
            <TabsTrigger value="publications">تالیفات</TabsTrigger>
            <TabsTrigger value="media">مصاحبه‌ها</TabsTrigger>
            <TabsTrigger value="interests">علایق</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <ResumePersonalInfo />
          </TabsContent>

          <TabsContent value="education">
            <ResumeEducation />
          </TabsContent>

          <TabsContent value="work">
            <ResumeWorkExperience />
          </TabsContent>

          <TabsContent value="certificates">
            <ResumeCertificates />
          </TabsContent>

          <TabsContent value="awards">
            <ResumeAwards />
          </TabsContent>

          <TabsContent value="skills">
            <ResumeSkills />
          </TabsContent>

          <TabsContent value="affiliations">
            <ResumeAffiliations />
          </TabsContent>

          <TabsContent value="publications">
            <ResumePublications />
          </TabsContent>

          <TabsContent value="media">
            <ResumeMediaInterviews />
          </TabsContent>

          <TabsContent value="interests">
            <ResumeInterests />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}