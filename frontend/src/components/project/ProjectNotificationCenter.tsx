import React, { useState, useEffect } from 'react';
import { projectManagementService } from '@/services/projectManagementService';
import { ProjectNotification } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ProjectNotificationCenterProps {
  userId?: string;
  projectId?: string;
}

export function ProjectNotificationCenter({ userId, projectId }: ProjectNotificationCenterProps) {
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Check for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, projectId]);

  const loadNotifications = () => {
    let allNotifications = projectManagementService.getNotifications(userId);
    
    if (projectId) {
      allNotifications = allNotifications.filter(n => n.projectId === projectId);
    }
    
    // Sort by newest first
    allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.isRead).length);
  };

  const markAsRead = (notificationId: string) => {
    projectManagementService.markNotificationAsRead(notificationId);
    loadNotifications();
    toast.success('اعلان به‌عنوان خوانده‌شده علامت‌گذاری شد');
  };

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.isRead) {
        projectManagementService.markNotificationAsRead(notification.id);
      }
    });
    loadNotifications();
    toast.success('همه اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند');
  };

  const getNotificationIcon = (type: ProjectNotification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'deadline_reminder':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: ProjectNotification['type']) => {
    switch (type) {
      case 'task_assigned':
        return 'تخصیص وظیفه';
      case 'task_completed':
        return 'تکمیل وظیفه';
      case 'deadline_reminder':
        return 'یادآوری ددلاین';
      default:
        return 'اعلان';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            اعلان‌ها
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              همه را خوانده‌شده علامت‌گذاری کن
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>اعلانی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    notification.isRead 
                      ? 'bg-background border-border' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'HH:mm')}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 h-6 px-2 text-xs"
                        >
                          <Check className="h-3 w-3 ml-1" />
                          علامت‌گذاری به‌عنوان خوانده‌شده
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}