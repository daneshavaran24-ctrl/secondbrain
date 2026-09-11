import React from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  Target, 
  Users, 
  Brain,
  TrendingUp,
  Calendar,
  Lightbulb
} from 'lucide-react';
import { PersianNumber } from '@/components/ui/persian-number';
import { useIsMobile } from '@/hooks/use-mobile';

export function ControlCenter() {
  const isMobile = useIsMobile();
  
  const stats = [
    {
      label: 'وظایف امروز',
      value: 8,
      change: '+3',
      trend: 'up' as const,
      icon: CheckCircle2,
      color: 'text-medical-green',
      bgColor: 'bg-medical-green/10',
      description: 'تکمیل شده'
    },
    {
      label: 'پروژه‌های فعال',
      value: 12,
      change: '+2',
      trend: 'up' as const,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'در حال اجرا'
    },
    {
      label: 'جلسات هفته',
      value: 6,
      change: '0',
      trend: 'stable' as const,
      icon: Calendar,
      color: 'text-medical-purple',
      bgColor: 'bg-medical-purple/10',
      description: 'برنامه‌ریزی شده'
    },
    {
      label: 'ایده‌های جدید',
      value: 15,
      change: '+5',
      trend: 'up' as const,
      icon: Lightbulb,
      color: 'text-medical-amber',
      bgColor: 'bg-medical-amber/10',
      description: 'ثبت شده'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-primary text-primary-foreground">
          <Brain className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">مرکز کنترل</h2>
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4",
        isMobile 
          ? "grid-cols-2" 
          : "grid-cols-2 md:grid-cols-4 gap-6"
      )}>
        {stats.map((stat, index) => (
          <StatCard 
            key={stat.label} 
            {...stat} 
            delay={`${index * 100}ms`}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Quick Insights */}
      <div className={cn(
        "grid gap-4 mt-6",
        isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2 gap-6 mt-8"
      )}>
        <InsightCard
          title="بهره‌وری امروز"
          value="94%"
          description="بالاتر از میانگین هفته"
          trend="up"
          color="text-medical-green"
          delay="400ms"
        />
        <InsightCard
          title="فوکوس هوشمند"
          value="7.2"
          description="ساعت کار موثر"
          trend="up"
          color="text-tech-cyan"
          delay="500ms"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  delay?: string;
  isMobile?: boolean;
}

function StatCard({ 
  label, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  bgColor, 
  description, 
  delay = '0ms',
  isMobile = false
}: StatCardProps) {
  return (
    <div 
      className={cn(
        "glass-card backdrop-blur-sm bg-card/40 rounded-xl border border-border/50",
        "shadow-card hover:shadow-glass transition-all duration-300 hover:scale-105",
        "animate-fade-in group",
        isMobile ? "p-3" : "p-4 lg:p-6"
      )}
      style={{ animationDelay: delay }}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between",
        isMobile ? "mb-2" : "mb-3 lg:mb-4"
      )}>
        <div className={cn(
          "rounded-lg", 
          bgColor,
          isMobile ? "p-1.5" : "p-2"
        )}>
          <Icon className={cn(
            color,
            isMobile ? "w-4 h-4" : "w-5 h-5"
          )} />
        </div>
        {change !== '0' && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full",
            "text-xs",
            trend === 'up' ? "bg-medical-green/10 text-medical-green" : "bg-destructive/10 text-destructive"
          )}>
            <TrendingUp className={cn(
              "w-3 h-3",
              trend === 'down' && "rotate-180"
            )} />
            <PersianNumber>{change}</PersianNumber>
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn(isMobile ? "mb-1" : "mb-2")}>
        <h3 className={cn(
          "font-bold text-foreground group-hover:text-primary transition-colors",
          isMobile ? "text-xl" : "text-2xl lg:text-3xl"
        )}>
          <PersianNumber>{value}</PersianNumber>
        </h3>
        <p className={cn(
          "text-muted-foreground",
          isMobile ? "text-xs" : "text-sm"
        )}>{description}</p>
      </div>

      {/* Label */}
      <p className={cn(
        "font-medium text-foreground",
        isMobile ? "text-xs" : "text-sm"
      )}>{label}</p>
    </div>
  );
}

interface InsightCardProps {
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down';
  color: string;
  delay?: string;
}

function InsightCard({ title, value, description, trend, color, delay = '0ms' }: InsightCardProps) {
  return (
    <div 
      className={cn(
        "glass-card backdrop-blur-sm bg-card/40 rounded-xl p-6 border border-border/50",
        "shadow-card hover:shadow-glass transition-all duration-300",
        "animate-fade-in"
      )}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-left">
          <div className={cn("text-2xl font-bold", color)}>
            <PersianNumber>{value}</PersianNumber>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className={cn(
              "w-4 h-4",
              trend === 'up' ? "text-medical-green" : "text-destructive rotate-180"
            )} />
          </div>
        </div>
      </div>
    </div>
  );
}