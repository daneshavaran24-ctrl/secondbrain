import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { meetingMinutesTemplates, MeetingMinutesTemplate } from '@/data/meetingMinutesTemplates';
import { FileText } from 'lucide-react';

interface MeetingTemplateSelectorProps {
  onSelectTemplate: (template: MeetingMinutesTemplate | null) => void;
}

export const MeetingTemplateSelector: React.FC<MeetingTemplateSelectorProps> = ({
  onSelectTemplate
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">📋 یک تمپلیت انتخاب کنید</h3>
        <p className="text-sm text-muted-foreground">
          برای شروع سریع‌تر، از یکی از تمپلیت‌های آماده استفاده کنید
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetingMinutesTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
            onClick={() => onSelectTemplate(template)}
          >
            <CardHeader className="text-center pb-3">
              <div className="text-4xl mb-2">{template.icon}</div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>{template.description}</CardDescription>
            </CardContent>
          </Card>
        ))}

        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
          onClick={() => onSelectTemplate(null)}
        >
          <CardHeader className="text-center pb-3">
            <div className="text-4xl mb-2">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">شروع از صفر</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>بدون تمپلیت، خودت بنویس</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
