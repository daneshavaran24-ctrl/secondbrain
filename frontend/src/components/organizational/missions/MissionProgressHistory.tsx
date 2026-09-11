import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface MissionProgressHistoryProps {
  missionId: string;
  missionTitle: string;
}

export const MissionProgressHistory: React.FC<MissionProgressHistoryProps> = ({ 
  missionTitle 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          تاریخچه پیشرفت
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>این قابلیت در حال توسعه است</p>
          <p className="text-sm mt-2">ماموریت: {missionTitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};
