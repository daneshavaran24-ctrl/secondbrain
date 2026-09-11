import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgChartViewer } from './hr/OrgChartViewer';
import { SuccessionPlanner } from './hr/SuccessionPlanner';
import { EmployeeManager } from './hr/EmployeeManager';
import { DepartmentManager } from './hr/DepartmentManager';
import { PerformanceEvaluator } from './hr/PerformanceEvaluator';

interface HRSectionProps {
  organizationId: string;
}

export function HRSection({ organizationId }: HRSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">منابع انسانی</h2>
        <p className="text-muted-foreground">مدیریت چارت سازمانی، جانشین‌پروری و شایستگی‌ها</p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">👥 کارمندان</TabsTrigger>
          <TabsTrigger value="departments">🏢 دپارتمان‌ها</TabsTrigger>
          <TabsTrigger value="performance">📊 ارزیابی عملکرد</TabsTrigger>
          <TabsTrigger value="orgchart">📋 چارت سازمانی</TabsTrigger>
          <TabsTrigger value="succession">🎯 جانشین‌پروری</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <EmployeeManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceEvaluator organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="orgchart">
          <OrgChartViewer organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="succession">
          <SuccessionPlanner organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
