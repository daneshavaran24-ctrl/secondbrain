import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calendar, Grid, List, Filter } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';

interface PlanningViewTabsProps {
  activeView: 'list' | 'calendar' | 'matrix' | 'stats' | 'kanban' | 'scrum';
  onViewChange: (view: 'list' | 'calendar' | 'matrix' | 'stats' | 'kanban' | 'scrum') => void;
}

export function PlanningViewTabs({ activeView, onViewChange }: PlanningViewTabsProps) {
  return (
    <Tabs value={activeView} onValueChange={onViewChange as any} className="w-full">
      <TabsList className="grid w-full grid-cols-6 bg-muted/50 backdrop-blur-sm rounded-xl p-1 shadow-inner">
        <TabsTrigger 
          value="list" 
          className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-luxury-soft transition-all duration-200"
        >
          <AppIcon size="xs"><List /></AppIcon>
          <span className="hidden sm:inline">لیست</span>
        </TabsTrigger>
        <TabsTrigger 
          value="calendar"
          className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-luxury-soft transition-all duration-200"
        >
          <AppIcon size="xs"><Calendar /></AppIcon>
          <span className="hidden sm:inline">تقویم</span>
        </TabsTrigger>
        <TabsTrigger 
          value="matrix"
          className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-luxury-soft transition-all duration-200"
        >
          <AppIcon size="xs"><Grid /></AppIcon>
          <span className="hidden sm:inline">ماتریس</span>
        </TabsTrigger>
        <TabsTrigger 
          value="stats"
          className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-luxury-soft transition-all duration-200"
        >
          <AppIcon size="xs"><BarChart3 /></AppIcon>
          <span className="hidden sm:inline">آمار</span>
        </TabsTrigger>
        <TabsTrigger 
          value="kanban"
          className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-luxury-soft transition-all duration-200"
        >
          <AppIcon size="xs"><Grid /></AppIcon>
          <span className="hidden sm:inline">کانبان</span>
        </TabsTrigger>
        <TabsTrigger 
          value="scrum"
          className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-luxury-soft transition-all duration-200"
        >
          <AppIcon size="xs"><Filter /></AppIcon>
          <span className="hidden sm:inline">اسکرام</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}