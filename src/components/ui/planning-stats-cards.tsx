import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { Progress } from '@/components/ui/progress';
import { AppIcon } from '@/components/ui/app-icon';

interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
}

interface PlanningStatsCardsProps {
  stats: TaskStats;
  overdueCount: number;
  variant?: 'personal' | 'professional' | 'organizational';
}

export function PlanningStatsCards({ stats, overdueCount, variant = 'personal' }: PlanningStatsCardsProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'professional':
        return {
          completed: 'bg-blue-50 border-blue-200 text-blue-600',
          progress: 'bg-amber-50 border-amber-200 text-amber-600', 
          overdue: 'bg-red-50 border-red-200 text-red-600'
        };
      case 'organizational':
        return {
          completed: 'bg-purple-50 border-purple-200 text-purple-600',
          progress: 'bg-indigo-50 border-indigo-200 text-indigo-600',
          overdue: 'bg-red-50 border-red-200 text-red-600'
        };
      default:
        return {
          completed: 'bg-emerald-50 border-emerald-200 text-emerald-600',
          progress: 'bg-orange-50 border-orange-200 text-orange-600',
          overdue: 'bg-red-50 border-red-200 text-red-600'
        };
    }
  };

  const colors = getVariantColors();

  return (
    <ResponsiveGrid cols={{ default: 1, sm: 3 }} gap="md" className="mb-8">
      {/* Completed Tasks */}
      <ResponsiveCard className={`${colors.completed} hover:shadow-luxury-soft transition-all duration-200`} hover>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl md:text-3xl font-bold mb-1">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">تکمیل شده</div>
            <Progress value={stats.completion_rate} className="mt-2 h-1.5" />
          </div>
          <AppIcon size="lg" className="opacity-20">
            <CheckCircle />
          </AppIcon>
        </div>
      </ResponsiveCard>

      {/* In Progress Tasks */}
      <ResponsiveCard className={`${colors.progress} hover:shadow-luxury-soft transition-all duration-200`} hover>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl md:text-3xl font-bold mb-1">{stats.in_progress}</div>
            <div className="text-sm text-muted-foreground">در حال انجام</div>
            <Progress value={(stats.in_progress / stats.total) * 100} className="mt-2 h-1.5" />
          </div>
          <AppIcon size="lg" className="opacity-20">
            <Clock />
          </AppIcon>
        </div>
      </ResponsiveCard>

      {/* Overdue Tasks */}
      <ResponsiveCard className={`${colors.overdue} hover:shadow-luxury-soft transition-all duration-200`} hover>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl md:text-3xl font-bold mb-1">{overdueCount}</div>
            <div className="text-sm text-muted-foreground">معوقه</div>
            {overdueCount > 0 && (
              <div className="mt-2 text-xs animate-pulse">نیاز به توجه فوری</div>
            )}
          </div>
          <AppIcon size="lg" className="opacity-20">
            <AlertCircle />
          </AppIcon>
        </div>
      </ResponsiveCard>
    </ResponsiveGrid>
  );
}