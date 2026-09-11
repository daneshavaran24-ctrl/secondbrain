import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Info, Calendar, Brain, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PersianNumber } from "@/components/ui/persian-number";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "reminder";
  title: string;
  message: string;
  time: string;
  icon?: React.ComponentType<{ className?: string }>;
  read?: boolean;
}

class NotificationService {
  private readonly storageKey = 'ui_notifications';

  getNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(notifications));
  }

  clearAllNotifications(): void {
    localStorage.removeItem(this.storageKey);
  }

  getUnreadCount(): number {
    const notifications = this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }
}

const notificationService = new NotificationService();

export { notificationService };

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationChange?: () => void;
}

export function NotificationCenter({ isOpen, onClose, onNotificationChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(notificationService.getNotifications());
  }, []);

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    notificationService.saveNotifications(updatedNotifications);
    onNotificationChange?.();
  };

  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== id);
    setNotifications(updatedNotifications);
    notificationService.saveNotifications(updatedNotifications);
    onNotificationChange?.();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return CheckCircle;
      case "warning": return AlertCircle;
      case "info": return Info;
      case "reminder": return Calendar;
      default: return Info;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success": return "text-medical-green";
      case "warning": return "text-medical-amber";
      case "info": return "text-medical-blue";
      case "reminder": return "text-medical-purple";
      default: return "text-muted-foreground";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-center bg-background border border-border/50 rounded-xl shadow-floating animate-scale-in" style={{ zIndex: 10000 }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">اعلانات</h3>
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-primary">
                <PersianNumber>{unreadCount}</PersianNumber>
              </span> اعلان خوانده نشده
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover-scale transition-elegant"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">اعلانی وجود ندارد</p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification, index) => {
              const IconComponent = notification.icon || getIcon(notification.type);

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative p-3 rounded-lg mb-2 transition-elegant cursor-pointer",
                    "hover:bg-gradient-glow hover-lift",
                    !notification.read && "bg-primary/5 border border-primary/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      !notification.read ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <IconComponent className={cn("h-4 w-4", getIconColor(notification.type))} />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "text-sm font-medium",
                          !notification.read ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {notification.time}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full absolute top-3 right-3"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full text-xs hover-scale transition-elegant"
            onClick={() => {
              const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
              setNotifications(updatedNotifications);
              notificationService.saveNotifications(updatedNotifications);
              onNotificationChange?.();
            }}
          >
            علامت‌گذاری همه به عنوان خوانده شده
          </Button>
        </div>
      )}
    </div>
  );
}