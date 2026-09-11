import { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  MessageSquare,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { secretaryService } from '@/services/secretaryService';
import { SecretaryNotification, SecretaryRequest } from '@/types';

const SecretaryRequestsPanel = () => {
  const [notifications, setNotifications] = useState<SecretaryNotification[]>([]);
  const [requests, setRequests] = useState<SecretaryRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Listen for real-time notifications
    const handleNotification = (event: CustomEvent) => {
      const newNotification = event.detail as SecretaryNotification;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('secretary-notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('secretary-notification', handleNotification as EventListener);
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [notificationData, requestData] = await Promise.all([
        secretaryService.getDoctorNotifications(),
        secretaryService.getSecretaryRequests()
      ]);

      setNotifications(notificationData);
      setRequests(requestData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load secretary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await secretaryService.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: SecretaryNotification['type']) => {
    switch (type) {
      case 'new_request':
        return <Calendar className="h-4 w-4 text-medical-blue" />;
      case 'meeting_update':
        return <Clock className="h-4 w-4 text-medical-amber" />;
      case 'urgent_message':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <MessageSquare className="h-4 w-4 text-medical-purple" />;
    }
  };

  const getRequestTypeIcon = (type: SecretaryRequest['type']) => {
    switch (type) {
      case 'meeting_create':
        return <Calendar className="h-4 w-4 text-medical-blue" />;
      case 'meeting_update':
        return <Clock className="h-4 w-4 text-medical-amber" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-medical-purple" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-medical-green" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRequestTypeLabel = (type: SecretaryRequest['type']) => {
    switch (type) {
      case 'meeting_create':
        return 'ایجاد جلسه';
      case 'meeting_update':
        return 'به‌روزرسانی جلسه';
      case 'message':
        return 'پیام';
      case 'reminder':
        return 'یادآوری';
      default:
        return 'نامشخص';
    }
  };

  const getStatusBadge = (status: SecretaryRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-medical-amber border-medical-amber/30">در انتظار</Badge>;
      case 'processed':
        return <Badge variant="outline" className="text-medical-green border-medical-green/30">پردازش شده</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-medical-blue border-medical-blue/30">تایید شده</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-destructive border-destructive/30">رد شده</Badge>;
      default:
        return <Badge variant="outline">نامشخص</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-medical-purple/10 rounded-lg">
              <Shield className="h-5 w-5 text-medical-purple" />
            </div>
            درخواست‌های منشی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card hover-glow transition-elegant">
      <CardHeader className="pb-3 lg:pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="relative p-1.5 lg:p-2 bg-medical-purple/10 rounded-lg">
              <Shield className="h-4 w-4 lg:h-5 lg:w-5 text-medical-purple" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{unreadCount}</span>
                </div>
              )}
            </div>
            <span className="text-xs lg:text-sm xl:text-base font-medium">درخواست‌های منشی</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2">
            <Badge variant="outline" className="bg-background/50 text-xs">
              <Activity className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
              {requests.length}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/secretary-portal', '_blank')}
              className="hover-scale transition-elegant text-xs lg:text-sm p-1 lg:p-2"
            >
              <ExternalLink className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
              <span className="hidden lg:inline">پورتال</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 lg:space-y-6 p-3 lg:p-6">
        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2 lg:space-y-3">
            <div className="flex items-center gap-2 text-xs lg:text-sm font-medium text-foreground">
              <Bell className="h-3 w-3 lg:h-4 lg:w-4" />
              اعلان‌های جدید
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <ScrollArea className="h-48">
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative overflow-hidden cursor-pointer ${!notification.read ? 'bg-gradient-glow' : 'bg-muted/30'
                      } rounded-lg p-3 border border-border/50 hover:border-primary/20 hover-lift transition-elegant`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${!notification.read ? 'bg-medical-purple/10' : 'bg-muted/50'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-medical-purple rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.created_at).toLocaleString('fa-IR')}
                        </div>
                      </div>
                    </div>

                    {notification.type === 'urgent_message' && (
                      <div className="absolute top-2 left-2 w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Recent Requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4" />
              درخواست‌های اخیر
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="hover-scale transition-elegant"
            >
              <Activity className="h-3 w-3 mr-1" />
              به‌روزرسانی
            </Button>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-3">
              {requests.slice(0, 8).map((request) => (
                <div
                  key={request.id}
                  className="group relative overflow-hidden bg-gradient-glow rounded-lg p-4 border border-border/50 hover:border-primary/20 hover-lift transition-elegant"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-muted/50 rounded-lg">
                        {getRequestTypeIcon(request.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          {getRequestTypeLabel(request.type)}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleString('fa-IR')}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {/* Request Details */}
                  {request.data.meeting && (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                      <p className="font-medium mb-1">{request.data.meeting.title}</p>
                      <p>{new Date(request.data.meeting.date).toLocaleDateString('fa-IR')} - {request.data.meeting.time}</p>
                      {request.data.meeting.organization && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {request.data.meeting.organization}
                        </Badge>
                      )}
                    </div>
                  )}

                  {request.data.message && (
                    <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                      <p className="font-medium mb-1">{request.data.message.title}</p>
                      <p className="line-clamp-2">{request.data.message.content}</p>
                      {request.data.message.priority && (
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${request.data.message.priority === 'high' ? 'border-destructive text-destructive' :
                              request.data.message.priority === 'medium' ? 'border-medical-amber text-medical-amber' :
                                'border-medical-green text-medical-green'
                            }`}
                        >
                          اولویت {request.data.message.priority === 'high' ? 'بالا' : request.data.message.priority === 'medium' ? 'متوسط' : 'پایین'}
                        </Badge>
                      )}
                    </div>
                  )}

                  {request.status === 'processed' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-medical-green" />
                    </div>
                  )}
                </div>
              ))}

              {requests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>هنوز درخواستی از منشی دریافت نشده است</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecretaryRequestsPanel;