import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ResponsiveCard } from '@/components/ui/responsive-card';

interface PlanningLayoutProps {
  children: React.ReactNode;
  upcomingTasks?: Array<{id: string; title: string; due_date?: string}>;
  showUpcoming?: boolean;
  variant?: 'personal' | 'professional' | 'organizational';
}

export function PlanningLayout({ 
  children, 
  upcomingTasks = [], 
  showUpcoming = true,
  variant = 'personal' 
}: PlanningLayoutProps) {
  const isMobile = useIsMobile();

  const getVariantColors = () => {
    switch (variant) {
      case 'professional':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'organizational':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    }
  };

  return (
    <div className="min-h-screen bg-app-background">
      <div className={cn(
        "container mx-auto max-w-7xl animate-fade-in",
        isMobile ? "p-4 space-y-6" : "p-6 space-y-8"
      )}>
        {children}
        
        {/* Mobile upcoming tasks card */}
        {isMobile && showUpcoming && upcomingTasks.length > 0 && (
          <ResponsiveCard 
            title="وظایف نزدیک به سررسید" 
            className={`${getVariantColors()} mt-6`}
            hover
          >
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {upcomingTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex justify-between items-start p-2 rounded-lg bg-background/50">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">{task.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {task.due_date && new Date(task.due_date).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ResponsiveCard>
        )}
      </div>
    </div>
  );
}