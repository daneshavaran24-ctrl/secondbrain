import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Calendar,
  CheckSquare,
  Lightbulb,
  Users,
  Brain,
  FileText,
  Scale,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Plus,
  Building2
} from 'lucide-react';

export function QuickLaunchPad() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load main company
  const getMainCompany = () => {
    try {
      const stored = localStorage.getItem('main_company');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading main company:', e);
    }
    return null;
  };

  // Load main organization
  const getMainOrganization = () => {
    try {
      const stored = localStorage.getItem('main_organization');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading main organization:', e);
    }
    return null;
  };

  const mainCompany = getMainCompany();
  const mainOrg = getMainOrganization();

  const quickActions = [
    ...(mainCompany ? [{
      id: 'main-company',
      title: mainCompany.company_name,
      description: 'شرکت اصلی من',
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      gradient: 'bg-gradient-primary',
      route: '/companies'
    }] : []),
    ...(mainOrg ? [{
      id: 'main-organization',
      title: mainOrg.name,
      description: 'سازمان اصلی من',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      gradient: 'bg-gradient-organizational',
      route: '/user-management'
    }] : []),
    {
      id: 'planning',
      title: 'برنامه‌ریزی فردی',
      description: 'مدیریت وظایف شخصی',
      icon: CheckSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      gradient: 'bg-gradient-primary',
      route: '/personal-planning'
    },
    {
      id: 'professional',
      title: 'برنامه‌ریزی حرفه‌ای',
      description: 'پروژه‌های کاری',
      icon: Users,
      color: 'text-medical-blue',
      bgColor: 'bg-medical-blue/10',
      gradient: 'bg-gradient-professional',
      route: '/professional-planning'
    },
    {
      id: 'ideas',
      title: 'بانک ایده‌ها',
      description: 'ثبت و مدیریت ایده‌ها',
      icon: Lightbulb,
      color: 'text-medical-amber',
      bgColor: 'bg-medical-amber/10',
      gradient: 'bg-gradient-luxury-gold',
      route: '/ideas'
    },
    {
      id: 'ai-chat',
      title: 'مشاور هوشمند',
      description: 'چت با AI',
      icon: Brain,
      color: 'text-tech-cyan',
      bgColor: 'bg-tech-cyan/10',
      gradient: 'bg-gradient-hero',
      route: '/ai-chat'
    },
    {
      id: 'legal',
      title: 'امور حقوقی',
      description: 'مدیریت پرونده‌ها',
      icon: Scale,
      color: 'text-medical-purple',
      bgColor: 'bg-medical-purple/10',
      gradient: 'bg-gradient-luxury-rose',
      route: '/legal'
    },
    {
      id: 'knowledge',
      title: 'بانک دانش',
      description: 'مدیریت اسناد',
      icon: BookOpen,
      color: 'text-tech-violet',
      bgColor: 'bg-tech-violet/10',
      gradient: 'bg-gradient-medical',
      route: '/knowledge'
    }
  ];

  const recentActivity = [
    { title: 'بررسی پروژه جدید', time: '30 دقیقه پیش', type: 'task' },
    { title: 'ایده بازاریابی', time: '2 ساعت پیش', type: 'idea' },
    { title: 'جلسه تیم', time: '4 ساعت پیش', type: 'meeting' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">دسترسی سریع</h2>
      </div>

      {/* Quick Actions Grid */}
      <div className={cn(
        "grid gap-4",
        isMobile 
          ? "grid-cols-1" 
          : "grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
      )}>
        {quickActions.map((action, index) => (
          <QuickActionCard 
            key={action.id} 
            action={action} 
            onClick={() => navigate(action.route)}
            delay={`${index * 50}ms`}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">فعالیت‌های اخیر</h3>
          <button className="flex items-center gap-1 text-sm text-foreground/70 hover:text-primary transition-colors">
            مشاهده همه
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <RecentActivityItem 
              key={index} 
              activity={activity} 
              delay={`${(index + 6) * 50}ms`}
            />
          ))}
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="pt-4">
        <button className={cn(
          "w-full p-4 rounded-xl border-2 border-dashed border-border/50",
          "hover:border-primary/50 hover:bg-primary/5 transition-all duration-300",
          "flex items-center justify-center gap-2 text-muted-foreground hover:text-primary",
          "animate-fade-in"
        )}
        style={{ animationDelay: '500ms' }}
        >
          <Plus className="w-5 h-5" />
          <span>افزودن سریع</span>
        </button>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  action: {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    gradient: string;
  };
  onClick: () => void;
  delay?: string;
  isMobile?: boolean;
}

function QuickActionCard({ action, onClick, delay = '0ms', isMobile = false }: QuickActionCardProps) {
  const { title, description, icon: Icon, color, bgColor, gradient } = action;

  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card backdrop-blur-sm bg-card/40 rounded-xl border border-border/50",
        "shadow-card hover:shadow-glass transition-all duration-300 hover:scale-105",
        "text-right group animate-fade-in relative overflow-hidden",
        isMobile ? "p-3" : "p-4"
      )}
      style={{ animationDelay: delay }}
    >
      <div className={cn(
        "flex items-start",
        isMobile ? "gap-2.5" : "gap-3"
      )}>
        <div className={cn(
          "rounded-xl transition-all duration-300",
          bgColor,
          "group-hover:shadow-glow",
          isMobile ? "p-2" : "p-2.5 lg:p-3"
        )}>
          <Icon className={cn(
            color,
            isMobile ? "w-5 h-5" : "w-6 h-6"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-foreground group-hover:text-primary transition-colors mb-1",
            isMobile ? "text-sm" : "text-base"
          )}>
            {title}
          </h3>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {description}
          </p>
        </div>
      </div>

      {/* Hover Effect Background */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300",
        gradient
      )} />
    </button>
  );
}

interface RecentActivityItemProps {
  activity: {
    title: string;
    time: string;
    type: string;
  };
  delay?: string;
}

function RecentActivityItem({ activity, delay = '0ms' }: RecentActivityItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckSquare;
      case 'idea': return Lightbulb;
      case 'meeting': return Calendar;
      default: return FileText;
    }
  };

  const TypeIcon = getTypeIcon(activity.type);

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "hover:bg-muted/20 transition-colors duration-200",
        "animate-fade-in"
      )}
      style={{ animationDelay: delay }}
    >
      <div className="p-1.5 rounded-lg bg-muted">
        <TypeIcon className="w-4 h-4 text-foreground/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {activity.title}
        </p>
        <p className="text-xs text-foreground/60">
          {activity.time}
        </p>
      </div>
    </div>
  );
}