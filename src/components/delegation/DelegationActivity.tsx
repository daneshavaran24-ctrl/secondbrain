import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  MessageSquare,
  AlertTriangle,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'created' | 'status_changed' | 'reminder_sent' | 'completed' | 'declined' | 'updated';
  taskId: string;
  taskTitle: string;
  description: string;
  timestamp: string;
  actor: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    method?: string;
    recipient?: string;
  };
}

interface DelegationActivityProps {
  taskId?: string; // If provided, show activity for specific task
  limit?: number;
}

export function DelegationActivity({ taskId, limit = 50 }: DelegationActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Load events from Supabase
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Get real delegation task events from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setActivities([]);
          return;
        }

        let query = supabase
          .from('delegation_task_events')
          .select(`
            id,
            event_type,
            description,
            created_at,
            user_id,
            metadata,
            task_id,
            delegation_tasks!inner (
              id,
              title,
              delegator_id
            )
          `)
          .eq('delegation_tasks.delegator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        // Filter by specific task if provided
        if (taskId) {
          query = query.eq('task_id', taskId);
        }

        const { data: events, error } = await query;

        if (error) {
          console.error('Error fetching delegation events:', error);
          setActivities([]);
          return;
        }

        // Transform events to ActivityItem format
        const activities: ActivityItem[] = (events || []).map(event => ({
          id: event.id,
          type: event.event_type as ActivityItem['type'],
          taskId: event.task_id,
          taskTitle: event.delegation_tasks?.title || 'وظیفه نامشخص',
          description: event.description,
          timestamp: event.created_at,
          actor: 'سیستم', // You might want to get this from user_profiles later
          metadata: (event.metadata as any) || {}
        }));

        setActivities(activities);
      } catch (err) {
        console.error('Error loading activities:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [taskId, limit]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!supabase) return;

    let subscription: any;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to delegation task events in real-time
      subscription = supabase
        .channel('delegation_task_events')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'delegation_task_events'
          },
          () => {
            // Trigger a reload by changing a dependency
            setActivities(current => [...current]);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'status_changed':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'reminder_sent':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'created':
        return 'ایجاد وظیفه';
      case 'status_changed':
        return 'تغییر وضعیت';
      case 'reminder_sent':
        return 'ارسال یادآوری';
      case 'completed':
        return 'تکمیل وظیفه';
      case 'declined':
        return 'رد وظیفه';
      case 'updated':
        return 'بروزرسانی';
      default:
        return 'فعالیت';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار';
      case 'in_progress':
        return 'در حال انجام';
      case 'completed':
        return 'تکمیل شده';
      case 'declined':
        return 'رد شده';
      default:
        return status || 'نامشخص';
    }
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(activity => activity.type === filter);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            فعالیت‌های اخیر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            در حال بارگذاری...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            فعالیت‌های اخیر
            {taskId && <Badge variant="outline">وظیفه خاص</Badge>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">همه فعالیت‌ها</option>
              <option value="created">ایجاد</option>
              <option value="status_changed">تغییر وضعیت</option>
              <option value="reminder_sent">یادآوری</option>
              <option value="completed">تکمیل</option>
              <option value="declined">رد</option>
            </select>
          </div>
        </div>
        
        {!taskId && (
          <CardDescription>
            آخرین فعالیت‌های سیستم واگذاری وظایف
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            هیچ فعالیتی یافت نشد
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          {getActivityTitle(activity.type)}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                            locale: faIR
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Badge variant="secondary">
                          {activity.taskTitle}
                        </Badge>
                        
                        {activity.metadata?.oldStatus && activity.metadata?.newStatus && (
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded ${getStatusBadgeColor(activity.metadata.oldStatus)}`}>
                              {getStatusText(activity.metadata.oldStatus)}
                            </span>
                            <span className="text-muted-foreground">←</span>
                            <span className={`px-2 py-1 rounded ${getStatusBadgeColor(activity.metadata.newStatus)}`}>
                              {getStatusText(activity.metadata.newStatus)}
                            </span>
                          </div>
                        )}
                        
                        {activity.metadata?.method && (
                          <Badge variant="outline">
                            {activity.metadata.method === 'email' ? (
                              <>
                                <Mail className="h-3 w-3 ml-1" />
                                ایمیل
                              </>
                            ) : activity.metadata.method === 'sms' ? (
                              <>
                                <Phone className="h-3 w-3 ml-1" />
                                پیامک
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3 w-3 ml-1" />
                                {activity.metadata.method}
                              </>
                            )}
                          </Badge>
                        )}
                        
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {activity.actor}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredActivities.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {filteredActivities.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 ml-2" />
              مشاهده تاریخچه کامل
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}