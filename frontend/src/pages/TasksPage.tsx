import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { useIsMobile } from '@/hooks/use-mobile';

interface OutletContext {
  sidebarOpen: boolean;
}

const TasksPage = () => {
  const { sidebarOpen } = useOutletContext<OutletContext>();
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState([
    { id: 1, title: 'بررسی گزارش مالی انجمن', priority: 'high', completed: false, dueDate: '1403-04-25' },
    { id: 2, title: 'پیگیری پروژه کیوسک‌های هوشمند', priority: 'medium', completed: false, dueDate: '1403-04-28' },
    { id: 3, title: 'جلسه با تیم فنی ورید هلث', priority: 'high', completed: true, dueDate: '1403-04-20' },
    { id: 4, title: 'تهیه پرزنتیشن نمایشگاه', priority: 'medium', completed: false, dueDate: '1403-05-02' },
    { id: 5, title: 'بررسی قراردادهای جدید', priority: 'low', completed: false, dueDate: '1403-05-05' },
    { id: 6, title: 'ملاقات با رئیس اتاق بازرگانی', priority: 'high', completed: false, dueDate: '1403-04-30' },
    { id: 7, title: 'آپدیت سیستم مدیریت دانش', priority: 'medium', completed: true, dueDate: '1403-04-18' },
    { id: 8, title: 'تحلیل بازار تجهیزات پزشکی', priority: 'low', completed: false, dueDate: '1403-05-08' }
  ]);

  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        title: newTask,
        priority: 'medium',
        completed: false,
        dueDate: new Date().toLocaleDateString('fa-IR')
      }]);
      setNewTask('');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">اولویت بالا</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">متوسط</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">پایین</Badge>;
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <SectionHeader
        title="مدیریت وظایف"
        subtitle="پیگیری و سازماندهی کارها"
        icon={<AppIcon size={isMobile ? "md" : "lg"}><FileText /></AppIcon>}
        gradient
      />

      {/* Stats */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, md: 4 }} gap="md" className="mb-6">
        <ResponsiveCard title="کل وظایف" hover glow>
          <div className="text-center">
            <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-primary`}>{tasks.length}</div>
          </div>
        </ResponsiveCard>
        <ResponsiveCard title="تکمیل شده" hover glow>
          <div className="text-center">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-emerald-600`}>{completedTasks.length}</div>
          </div>
        </ResponsiveCard>
        <ResponsiveCard title="در انتظار" hover glow>
          <div className="text-center">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-amber-600`}>{pendingTasks.length}</div>
          </div>
        </ResponsiveCard>
        <ResponsiveCard title="درصد تکمیل" hover glow>
          <div className="text-center">
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary`}>
              {Math.round((completedTasks.length / tasks.length) * 100)}%
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      <ResponsiveCard
        title="اضافه کردن وظیفه جدید"
        icon={<Plus />}
        hover
        glow
      >
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
          <Input
            placeholder="عنوان وظیفه..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            className="flex-1"
          />
          <ModernButton 
            onClick={addTask} 
            disabled={!newTask.trim()} 
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            magnetic
            size={isMobile ? "default" : "default"}
          >
            <AppIcon size="sm"><Plus /></AppIcon>
            افزودن
          </ModernButton>
        </div>
      </ResponsiveCard>

      <ResponsiveGrid cols={{ default: 1, xl: 2 }} gap="md">
        {/* Pending Tasks */}
        <ResponsiveCard
          title={`وظایف در انتظار (${pendingTasks.length})`}
          icon={<Clock />}
          hover
          glow
        >
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-lux border border-lux-gold/20">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
                 <div className="flex-1 min-w-0">
                   <div className={`flex ${isMobile ? 'flex-col' : 'items-start justify-between'} gap-2`}>
                     <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                     <div className="flex items-center gap-2 flex-shrink-0">
                       <AppIcon size="xs">{getPriorityIcon(task.priority)}</AppIcon>
                       {getPriorityBadge(task.priority)}
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">
                     موعد: {task.dueDate}
                   </p>
                 </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-lux-emerald" />
                <p className="text-body">همه وظایف تکمیل شده!</p>
              </div>
            )}
           </div>
        </ResponsiveCard>

        {/* Completed Tasks */}
        <ResponsiveCard
          title={`وظایف تکمیل شده (${completedTasks.length})`}
          icon={<CheckCircle />}
          hover
          glow
        >
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-lux border border-lux-gold/20 opacity-75">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-lux-midnight line-through">{task.title}</h4>
                    <Badge variant="outline" className="text-xs bg-lux-emerald/10 text-lux-emerald border-lux-emerald">
                      تکمیل شده
                    </Badge>
                  </div>
                  <p className="text-xs text-body mt-1">
                    تکمیل شده در: {task.dueDate}
                  </p>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-body" />
                <p className="text-body">هنوز وظیفه‌ای تکمیل نشده</p>
              </div>
            )}
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>
    </div>
  );
};

export default TasksPage;