import React, { useState, useEffect } from 'react';
import { Grid, Brain, UserCheck, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppIcon } from '@/components/ui/app-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { PlanningActionsMenu } from '@/components/ui/planning-actions-menu';
import { PlanningViewTabs } from '@/components/ui/planning-view-tabs';
import { PlanningStatsCards } from '@/components/ui/planning-stats-cards';
import { PlanningLayout } from '@/components/ui/planning-layout';
import { cn } from '@/lib/utils';
import TaskManager from '@/components/planning/TaskManager';
import TaskStats from '@/components/planning/TaskStats';
import TaskCalendar from '@/components/planning/TaskCalendar';
import PriorityMatrix from '@/components/planning/PriorityMatrix';
import ChatInterface from '@/components/ai-chat/ChatInterface';
import { professionalPlanningService } from '@/services/professionalPlanningService';
import { PersonalTask, TaskFilter } from '@/types';
import { toast } from '@/hooks/use-toast';
import { PersonalKanbanBoard } from '@/components/planning/PersonalKanbanBoard';
import { PersonalScrumBoard } from '@/components/planning/PersonalScrumBoard';
import { IranianKanbanBoard } from '@/components/planning/IranianKanbanBoard';
import { ProfessionalPlanningHelpGuide } from '@/components/planning/ProfessionalPlanningHelpGuide';

const ProfessionalPlanningPage: React.FC = () => {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'matrix' | 'stats' | 'kanban' | 'scrum'>('list');
  const [filter, setFilter] = useState<TaskFilter>({
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'priority',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [chatModal, setChatModal] = useState<{ 
    open: boolean; 
    type: 'mentor' | 'coach' | null;
    taskContext?: string;
  }>({
    open: false,
    type: null,
    taskContext: undefined
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [shouldOpenTaskForm, setShouldOpenTaskForm] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = () => {
    setIsLoading(true);
    try {
      const filteredTasks = professionalPlanningService.getFilteredTasks(filter);
      setTasks(filteredTasks);
    } catch (error) {
      toast({
        title: "خطا در بارگذاری وظایف حرفه‌ای",
        description: "نتوانستیم وظایف حرفه‌ای شما را بارگذاری کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCreate = (taskData: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => {
    try {
      professionalPlanningService.createTask(taskData);
      loadTasks();
      toast({
        title: "وظیفه حرفه‌ای جدید اضافه شد",
        description: `وظیفه "${taskData.title}" با موفقیت ایجاد شد.`,
      });
    } catch (error) {
      toast({
        title: "خطا در ایجاد وظیفه حرفه‌ای",
        description: "نتوانستیم وظیفه جدید را ایجاد کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleTaskUpdate = (id: string, updates: Partial<PersonalTask>) => {
    try {
      professionalPlanningService.updateTask(id, updates);
      loadTasks();
      toast({
        title: "وظیفه حرفه‌ای بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد.",
      });
    } catch (error) {
      toast({
        title: "خطا در بروزرسانی وظیفه حرفه‌ای",
        description: "نتوانستیم تغییرات را ذخیره کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleTaskDelete = (id: string) => {
    try {
      professionalPlanningService.deleteTask(id);
      loadTasks();
      toast({
        title: "وظیفه حرفه‌ای حذف شد",
        description: "وظیفه با موفقیت حذف شد.",
      });
    } catch (error) {
      toast({
        title: "خطا در حذف وظیفه حرفه‌ای",
        description: "نتوانستیم وظیفه را حذف کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleOpenAIChat = (type: 'mentor' | 'coach', task: PersonalTask) => {
    const taskInfo = `وظیفه حرفه‌ای مورد بحث:
عنوان: ${task.title}
${task.description ? `توضیحات: ${task.description}` : ''}
اولویت: ${task.priority === 'high' ? 'بالا' : task.priority === 'medium' ? 'متوسط' : 'پایین'}
وضعیت: ${task.status === 'completed' ? 'تکمیل شده' : task.status === 'in_progress' ? 'در حال انجام' : 'در انتظار'}
${task.due_date ? `سررسید: ${new Date(task.due_date).toLocaleDateString('fa-IR')}` : ''}
${task.progress > 0 ? `پیشرفت: ${task.progress}%` : ''}

لطفاً در مورد این وظیفه حرفه‌ای راهنمایی ارائه دهید.`;

    setChatModal({
      open: true,
      type,
      taskContext: taskInfo
    });
  };

  const stats = professionalPlanningService.getTaskStats();
  const overdueTasks = professionalPlanningService.getOverdueTasks();
  const upcomingTasks = professionalPlanningService.getUpcomingTasks();

  const isMobile = useIsMobile();

  return (
    <PlanningLayout 
      upcomingTasks={upcomingTasks} 
      showUpcoming={activeView !== 'stats'}
      variant="professional"
    >
      {/* Header */}
      <SectionHeader
        title="برنامه‌ریزی حرفه‌ای"
        subtitle="مدیریت وظایف و پروژه‌های کاری و حرفه‌ای"
        icon={<Grid />}
        gradient
        action={
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              راهنما
            </button>
            <PlanningActionsMenu
              onNewTask={() => {
                setActiveView('list');
                setShouldOpenTaskForm(true);
              }}
              onOpenMentor={() => setChatModal({ open: true, type: 'mentor', taskContext: undefined })}
              onOpenCoach={() => setChatModal({ open: true, type: 'coach', taskContext: undefined })}
              newTaskLabel={isMobile ? "وظیفه جدید" : "وظیفه حرفه‌ای جدید"}
              mentorLabel="منتور حرفه‌ای AI"
              coachLabel="کوچ کاری AI"
              variant="professional"
            />
          </div>
        }
      />

      {/* Quick Stats */}
      <PlanningStatsCards 
        stats={stats} 
        overdueCount={overdueTasks.length}
        variant="professional" 
      />

      {/* View Navigation */}
      <div className="mb-8">
        <PlanningViewTabs 
          activeView={activeView} 
          onViewChange={setActiveView} 
        />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {activeView === 'list' && (
          <TaskManager
            tasks={tasks}
            filter={filter}
            onFilterChange={setFilter}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            isLoading={isLoading}
            onOpenAIChat={handleOpenAIChat}
            domain="professional"
            shouldOpenForm={shouldOpenTaskForm}
            onFormStateChange={setShouldOpenTaskForm}
          />
        )}

        {activeView === 'calendar' && (
          <TaskCalendar
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
          />
        )}

        {activeView === 'matrix' && (
          <PriorityMatrix
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
          />
        )}

        {activeView === 'stats' && (
          <TaskStats
            stats={stats}
            overdueTasks={overdueTasks}
            upcomingTasks={upcomingTasks}
          />
        )}

        {activeView === 'kanban' && (
          <IranianKanbanBoard
            tasks={tasks}
            onStatusChange={(id, status) => handleTaskUpdate(id, { status })}
          />
        )}

        {activeView === 'scrum' && (
          <PersonalScrumBoard
            tasks={tasks}
            onStatusChange={(id, status) => handleTaskUpdate(id, { status })}
          />
        )}
      </div>

      {/* Help Guide */}
      <ProfessionalPlanningHelpGuide 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* AI Chat Modal */}
      <Dialog open={chatModal.open} onOpenChange={(open) => setChatModal({ open, type: null, taskContext: undefined })}>
        <DialogContent className={cn(
          isMobile 
            ? "w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col m-2"
            : "max-w-4xl h-[80vh]"
        )}>
          <DialogHeader className={cn(
            isMobile ? "p-4 pb-0 flex-shrink-0" : "p-6 pb-4"
          )}>
            <DialogTitle className={cn(
              "flex items-center gap-2",
              isMobile ? "text-base" : "text-lg"
            )}>
              {chatModal.type === 'mentor' ? (
                <>
                  <AppIcon size="sm">
                    <Brain className="text-blue-600" />
                  </AppIcon>
                  منتور حرفه‌ای AI
                </>
              ) : (
                <>
                  <AppIcon size="sm">
                    <UserCheck className="text-green-600" />
                  </AppIcon>
                  کوچ کاری AI
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {chatModal.type === 'mentor' 
                ? 'راهنمایی و مشاوره برای رشد حرفه‌ای و بهبود عملکرد کاری'
                : 'کمک به ایجاد برنامه‌های حرفه‌ای موثر و دستیابی به اهداف شغلی'
              }
            </DialogDescription>
          </DialogHeader>
          {chatModal.type && (
            <div className={cn(
              isMobile ? "flex-1 overflow-hidden" : "h-full"
            )}>
              <ChatInterface 
                sessionType={chatModal.type}
                initialContext={chatModal.taskContext}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PlanningLayout>
  );
};

export default ProfessionalPlanningPage;