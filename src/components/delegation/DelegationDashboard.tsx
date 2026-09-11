import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DelegationStats } from './DelegationStats';
import { DelegationFilters } from './DelegationFilters';
import { DelegationActivity } from './DelegationActivity';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  MessageSquare, 
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface DelegationTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  delegatee_id?: string | null;
  delegator_id: string;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  delegation_notifications?: any[];
}

interface DelegationDashboardProps {
  domain?: string;
}

export function DelegationDashboard({ domain = 'personal' }: DelegationDashboardProps) {
  const [tasks, setTasks] = useState<DelegationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  const [chatOpen, setChatOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('delegation_tasks')
        .select('*')
        .eq('delegator_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data as DelegationTask[] || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری وظایف",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [domain]);

  // Initial load and realtime subscriptions
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const channel = supabase
      .channel('delegation-tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delegation_tasks' },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTasks]);

  const sendReminder = async (taskId: string) => {
    try {
      // Create a notification as reminder
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('delegation_notifications')
        .insert({
          user_id: user?.id || '',
          task_id: taskId,
          title: 'یادآوری وظیفه',
          message: 'یادآوری برای انجام وظیفه ارسال گردید.',
          read: false
        });
      if (error) throw error;
      toast({
        title: 'یادآوری ارسال شد',
        description: 'یادآوری برای انجام وظیفه ارسال گردید.'
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: 'خطا',
        description: 'ارسال یادآوری ناموفق بود',
        variant: 'destructive'
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: DelegationTask['status']) => {
    try {
      const { error } = await supabase
        .from('delegation_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast({
        title: "موفقیت",
        description: "وضعیت وظیفه به‌روزرسانی شد",
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت",
        variant: "destructive"
      });
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesMethod = methodFilter === 'all';
      
      const matchesDateRange = (() => {
        if (dateRangeFilter === 'all') return true;
        
        const taskDate = new Date(task.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateRangeFilter) {
          case 'today':
            return taskDate >= today;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return taskDate >= yesterday && taskDate < today;
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            return taskDate >= weekStart;
          case 'last_week':
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);
            return taskDate >= lastWeekStart && taskDate < lastWeekEnd;
          case 'this_month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return taskDate >= monthStart;
          case 'last_month':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
            return taskDate >= lastMonthStart && taskDate < lastMonthEnd;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesPriority && matchesMethod && matchesDateRange;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, methodFilter, dateRangeFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const in_progress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const declined = tasks.filter(t => t.status === 'declined').length;
    
    const overdue = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && 
      t.status !== 'completed' && t.status !== 'declined'
    ).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const avgResponseTime = completedTasks.length > 0 
      ? completedTasks.reduce((acc, task) => {
          const created = new Date(task.created_at);
          const updated = new Date(task.updated_at);
          return acc + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        }, 0) / completedTasks.length
      : 0;
    
    return {
      total,
      pending,
      in_progress,
      completed,
      declined,
      overdue,
      completionRate,
      avgResponseTime
    };
  }, [tasks]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setMethodFilter('all');
    setDateRangeFilter('all');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'secretary': return <MessageSquare className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const renderTaskCard = (task: DelegationTask) => (
    <Card key={task.id} className="card-glass hover:card-glow transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
            <CardDescription className="text-sm">
              {task.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
              {task.priority === 'high' ? 'بالا' : 
               task.priority === 'medium' ? 'متوسط' : 'پایین'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <Badge variant={getStatusVariant(task.status) as any} className="text-xs">
              {task.status === 'pending' ? 'در انتظار' :
               task.status === 'in_progress' ? 'در حال انجام' :
               task.status === 'completed' ? 'تکمیل شده' : 'لغو شده'}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(task.created_at), { 
              addSuffix: true, 
              locale: faIR 
            })}
          </div>
        </div>

        {task.due_date && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            مهلت: {new Date(task.due_date).toLocaleDateString('fa-IR')}
          </div>
        )}

        {task.delegatee_id && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            واگذار شده
          </div>
        )}

        {task.status !== 'completed' && task.status !== 'declined' && (
          <div className="flex gap-2 pt-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTaskStatus(task.id, 'in_progress')}
              >
                شروع انجام
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => updateTaskStatus(task.id, 'completed')}
              >
                تکمیل شده
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => sendReminder(task.id)}
            >
              یادآوری
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateTaskStatus(task.id, 'declined')}
            >
              رد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">داشبورد واگذاری وظایف</h2>
          <p className="text-muted-foreground">مدیریت و پیگیری وظایف واگذار شده</p>
        </div>
      </div>

      {/* Stats Overview */}
      <DelegationStats stats={stats} />

      {/* Advanced Filters */}
      <DelegationFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        methodFilter={methodFilter}
        dateRangeFilter={dateRangeFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onMethodChange={setMethodFilter}
        onDateRangeChange={setDateRangeFilter}
        onClearFilters={clearFilters}
        onRefresh={loadTasks}
      />

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(renderTaskCard)}
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-lg font-semibold mt-4 mb-2">تاریخچه فعالیت‌ها</h3>
        <DelegationActivity limit={30} />
      </div>

      {filteredTasks.length === 0 && (
        <Card className="card-glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">هیچ وظیفه‌ای یافت نشد</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'با فیلترهای انتخاب شده وظیفه‌ای یافت نشد'
                : 'هنوز هیچ وظیفه‌ای واگذار نشده است'}
            </p>
          </CardContent>
        </Card>
      )}
      {chatOpen && activeChannel && (
        <ChatPanel
          open={chatOpen}
          onOpenChange={setChatOpen}
          channelId={activeChannel}
          taskTitle={activeTaskTitle}
        />
      )}
    </div>
  );
}