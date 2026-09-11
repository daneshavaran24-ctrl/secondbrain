import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesStats } from './sales/SalesStats';
import { ICPManager } from './sales/ICPManager';
import { SalesFunnelVisualization } from './sales/SalesFunnelVisualization';
import { LeadsKanban } from './sales/LeadsKanban';
import { CampaignManager } from './sales/CampaignManager';
import { RevenueAnalytics } from './sales/RevenueAnalytics';

interface SalesSectionProps {
  organizationId: string;
}

export function SalesSection({ organizationId }: SalesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">فروش و بازاریابی</h2>
        <p className="text-muted-foreground">مدیریت ICP، قیف فروش، سرنخ‌ها و کمپین‌ها</p>
      </div>

      <SalesStats organizationId={organizationId} />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">داشبورد</TabsTrigger>
          <TabsTrigger value="icp">ICP</TabsTrigger>
          <TabsTrigger value="funnel">قیف فروش</TabsTrigger>
          <TabsTrigger value="leads">سرنخ‌ها</TabsTrigger>
          <TabsTrigger value="campaigns">کمپین‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesFunnelVisualization organizationId={organizationId} />
            <RevenueAnalytics organizationId={organizationId} />
          </div>
        </TabsContent>

        <TabsContent value="icp">
          <ICPManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="funnel">
          <SalesFunnelVisualization organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="leads">
          <LeadsKanban organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignManager organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
