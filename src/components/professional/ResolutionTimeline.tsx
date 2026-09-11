import { ResolutionActivity } from "@/types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileEdit, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Calendar,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns-jalali";

interface ResolutionTimelineProps {
  activities: ResolutionActivity[];
}

export const ResolutionTimeline = ({ activities }: ResolutionTimelineProps) => {
  const getActivityIcon = (action: ResolutionActivity['action']) => {
    switch (action) {
      case 'created': return <Plus className="h-4 w-4" />;
      case 'updated': return <FileEdit className="h-4 w-4" />;
      case 'status_changed': return <CheckCircle2 className="h-4 w-4" />;
      case 'progress_updated': return <TrendingUp className="h-4 w-4" />;
      case 'comment_added': return <MessageSquare className="h-4 w-4" />;
      case 'responsible_changed': return <Users className="h-4 w-4" />;
      case 'due_date_changed': return <Calendar className="h-4 w-4" />;
      default: return <FileEdit className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: ResolutionActivity): string => {
    switch (activity.action) {
      case 'created':
        return 'مصوبه ایجاد شد';
      case 'status_changed':
        return `وضعیت از "${activity.details.old_value}" به "${activity.details.new_value}" تغییر کرد`;
      case 'progress_updated':
        return `پیشرفت از ${activity.details.old_value}% به ${activity.details.new_value}% به‌روز شد`;
      case 'comment_added':
        return `نظر جدید: "${activity.details.comment}"`;
      case 'responsible_changed':
        return `مسئول تغییر کرد`;
      case 'due_date_changed':
        return `مهلت از "${activity.details.old_value}" به "${activity.details.new_value}" تغییر کرد`;
      default:
        return `فیلد "${activity.details.field}" به‌روز شد`;
    }
  };

  const getActivityColor = (action: ResolutionActivity['action']): string => {
    switch (action) {
      case 'created': return 'bg-blue-500';
      case 'status_changed': return 'bg-purple-500';
      case 'progress_updated': return 'bg-green-500';
      case 'comment_added': return 'bg-yellow-500';
      default: return 'bg-primary';
    }
  };

  if (activities.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        هنوز فعالیتی ثبت نشده است
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          {/* Timeline Line */}
          <div className="flex flex-col items-center">
            <div className={`${getActivityColor(activity.action)} rounded-full p-2 text-white`}>
              {getActivityIcon(activity.action)}
            </div>
            {index !== activities.length - 1 && (
              <div className="w-0.5 h-full bg-border my-2" />
            )}
          </div>

          {/* Activity Content */}
          <Card className="flex-1 p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {activity.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{activity.user_name}</span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {getActivityDescription(activity)}
                </p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.timestamp), { 
                  addSuffix: true
                })}
              </span>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};