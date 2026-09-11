import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useOrganizationNotifications } from "@/hooks/useOrganizationNotifications";
import { OrganizationNotification } from "@/types/organization";

interface NotificationCenterEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
}

export function NotificationCenterEnhanced({
  isOpen,
  onClose,
  organizationId,
}: NotificationCenterEnhancedProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
  } = useOrganizationNotifications(organizationId);

  const getNotificationIcon = (type: OrganizationNotification['type']) => {
    const iconMap = {
      member_joined: '👥',
      member_left: '👋',
      project_created: '📁',
      project_updated: '📝',
      task_assigned: '✅',
      task_completed: '✨',
      report_generated: '📊',
      settings_changed: '⚙️',
      invitation_sent: '📧',
      invitation_accepted: '🎉',
      role_changed: '🔄',
    };
    return iconMap[type] || '📢';
  };

  const getNotificationColor = (type: OrganizationNotification['type']) => {
    const colorMap = {
      member_joined: 'bg-green-100 text-green-800',
      member_left: 'bg-orange-100 text-orange-800',
      project_created: 'bg-blue-100 text-blue-800',
      project_updated: 'bg-purple-100 text-purple-800',
      task_assigned: 'bg-yellow-100 text-yellow-800',
      task_completed: 'bg-green-100 text-green-800',
      report_generated: 'bg-indigo-100 text-indigo-800',
      settings_changed: 'bg-gray-100 text-gray-800',
      invitation_sent: 'bg-blue-100 text-blue-800',
      invitation_accepted: 'bg-green-100 text-green-800',
      role_changed: 'bg-purple-100 text-purple-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'اکنون';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-0 top-0 h-full w-full max-w-md bg-background shadow-lg border-l animate-in slide-in-from-left">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h2 className="text-lg font-semibold">اعلان‌ها</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 p-4 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="ml-2 h-4 w-4" />
                علامت همه به عنوان خوانده شده
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteAll}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                پاک کردن همه
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">اعلانی وجود ندارد</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.is_read && "bg-muted/30"
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg",
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
