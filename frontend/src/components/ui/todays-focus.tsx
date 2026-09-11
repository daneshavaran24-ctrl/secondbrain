import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Star, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { PersianNumber } from '@/components/ui/persian-number';

export function TodaysFocus() {
  const focusTasks = [
    {
      id: 1,
      title: 'بررسی پروژه نرم‌افزاری جدید',
      category: 'کاری',
      priority: 'high' as const,
      dueTime: '14:30',
      completed: false,
      progress: 75
    },
    {
      id: 2,
      title: 'جلسه تیم توسعه',
      category: 'جلسه',
      priority: 'urgent' as const,
      dueTime: '16:00',
      completed: false,
      progress: 0
    },
    {
      id: 3,
      title: 'مطالعه کتاب مدیریت',
      category: 'شخصی',
      priority: 'medium' as const,
      dueTime: '20:00',
      completed: true,
      progress: 100
    }
  ];

  const priorityConfig = {
    urgent: { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
    high: { color: 'text-medical-amber', bg: 'bg-medical-amber/10', icon: Star },
    medium: { color: 'text-primary', bg: 'bg-primary/10', icon: Clock }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-hero text-primary-foreground">
            <Star className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">فوکوس امروز</h2>
        </div>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          مشاهده همه
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        {focusTasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            priorityConfig={priorityConfig}
            delay={`${index * 100}ms`}
          />
        ))}
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <SummaryItem
          icon={CheckCircle2}
          label="تکمیل شده"
          value="1 از 3"
          color="text-medical-green"
          delay="300ms"
        />
        <SummaryItem
          icon={Calendar}
          label="باقی‌مانده"
          value="2 وظیفه"
          color="text-primary"
          delay="400ms"
        />
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    category: string;
    priority: 'urgent' | 'high' | 'medium';
    dueTime: string;
    completed: boolean;
    progress: number;
  };
  priorityConfig: any;
  delay?: string;
}

function TaskCard({ task, priorityConfig, delay = '0ms' }: TaskCardProps) {
  const config = priorityConfig[task.priority];
  const PriorityIcon = config.icon;

  return (
    <div 
      className={cn(
        "glass-card backdrop-blur-sm bg-card/40 rounded-xl p-4 border border-border/50",
        "shadow-card hover:shadow-glass transition-all duration-300 hover:scale-[1.02]",
        "animate-fade-in group",
        task.completed && "opacity-75"
      )}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-4">
        {/* Status Indicator */}
        <div className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all",
          task.completed 
            ? "bg-medical-green border-medical-green" 
            : "border-border group-hover:border-primary"
        )}>
          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className={cn(
              "font-semibold text-foreground group-hover:text-primary transition-colors",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={cn("p-1 rounded", config.bg)}>
                <PriorityIcon className={cn("w-3 h-3", config.color)} />
              </div>
              <span className="text-xs text-muted-foreground">
                <PersianNumber>{task.dueTime}</PersianNumber>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{task.category}</span>
            <div className="text-xs text-muted-foreground">
              <PersianNumber>{task.progress}%</PersianNumber>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted/30 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                task.completed ? "bg-medical-green" : "bg-primary"
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  delay?: string;
}

function SummaryItem({ icon: Icon, label, value, color, delay = '0ms' }: SummaryItemProps) {
  return (
    <div 
      className={cn(
        "glass-card backdrop-blur-sm bg-card/40 rounded-lg p-4 border border-border/50",
        "shadow-card hover:shadow-glass transition-all duration-300",
        "animate-fade-in"
      )}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", color)} />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}