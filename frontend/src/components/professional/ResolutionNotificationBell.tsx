import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns-jalali";
import { MeetingResolution } from "@/types";
import { isPast, addDays } from "date-fns-jalali";

interface Notification {
  id: string;
  type: 'before_due' | 'overdue' | 'completed' | 'comment_added' | 'status_changed';
  title: string;
  message: string;
  resolutionId: string;
  timestamp: string;
  read: boolean;
}

interface ResolutionNotificationBellProps {
  resolutions: MeetingResolution[];
  onNotificationClick: (resolutionId: string) => void;
}

export const ResolutionNotificationBell = ({ 
  resolutions, 
  onNotificationClick 
}: ResolutionNotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const newNotifications: Notification[] = [];

    resolutions.forEach((resolution) => {
      if (resolution.status === 'completed') return;

      // بررسی عقب‌افتاده‌ها
      if (resolution.due_date && isPast(new Date(resolution.due_date))) {
        newNotifications.push({
          id: `overdue-${resolution.id}`,
          type: 'overdue',
          title: 'مصوبه عقب‌افتاده',
          message: `"${resolution.title}" از مهلت خود گذشته است`,
          resolutionId: resolution.id,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
      // بررسی نزدیک به سررسید (3 روز)
      else if (resolution.due_date) {
        const daysUntilDue = Math.floor(
          (new Date(resolution.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue <= 3 && daysUntilDue > 0) {
          newNotifications.push({
            id: `due-soon-${resolution.id}`,
            type: 'before_due',
            title: 'نزدیک به سررسید',
            message: `"${resolution.title}" ${daysUntilDue} روز دیگر سررسید دارد`,
            resolutionId: resolution.id,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }

      // بررسی نظرات جدید (24 ساعت اخیر)
      resolution.comments?.forEach((comment) => {
        const hoursSinceComment = Math.floor(
          (new Date().getTime() - new Date(comment.created_at).getTime()) / (1000 * 60 * 60)
        );

        if (hoursSinceComment < 24) {
          newNotifications.push({
            id: `comment-${comment.id}`,
            type: 'comment_added',
            title: 'نظر جدید',
            message: `${comment.user_name} نظری در "${resolution.title}" ثبت کرد`,
            resolutionId: resolution.id,
            timestamp: comment.created_at,
            read: false
          });
        }
      });
    });

    setNotifications(newNotifications.slice(0, 20));
  }, [resolutions]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    onNotificationClick(notification.resolutionId);
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'overdue': return 'text-destructive';
      case 'before_due': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      default: return 'text-primary';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">اعلان‌ها</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} اعلان خوانده نشده
            </p>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              اعلانی وجود ندارد
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};