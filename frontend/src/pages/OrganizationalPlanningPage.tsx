import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Grid, Brain, UserCheck, HelpCircle, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskManager from '@/components/planning/TaskManager';
import TaskStats from '@/components/planning/TaskStats';
import TaskCalendar from '@/components/planning/TaskCalendar';
import PriorityMatrix from '@/components/planning/PriorityMatrix';
import OrganizationalTaskForm from '@/components/planning/OrganizationalTaskForm';
import ChatInterface from '@/components/ai-chat/ChatInterface';
import { organizationalPlanningService } from '@/services/organizationalPlanningService';
import { PersonalTask, TaskFilter } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PersonalKanbanBoard } from '@/components/planning/PersonalKanbanBoard';
import { PersonalScrumBoard } from '@/components/planning/PersonalScrumBoard';
import { IranianKanbanBoard } from '@/components/planning/IranianKanbanBoard';
import { AppIcon } from '@/components/ui/app-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { PlanningActionsMenu } from '@/components/ui/planning-actions-menu';
import { PlanningViewTabs } from '@/components/ui/planning-view-tabs';
import { PlanningStatsCards } from '@/components/ui/planning-stats-cards';
import { PlanningLayout } from '@/components/ui/planning-layout';
import { useIsMobile } from '@/hooks/use-mobile';
import { OrganizationalPlanningHelpGuide } from '@/components/planning/OrganizationalPlanningHelpGuide';
import { QuickNetworkingEmail } from '@/components/networking/QuickNetworkingEmail';

const OrganizationalPlanningPage: React.FC = () => {
  const isMobile = useIsMobile();
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
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
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const loadTasks = useCallback(() => {
    setIsLoading(true);
    try {
      const filteredTasks = organizationalPlanningService.getFilteredTasks(filter);
      setTasks(filteredTasks);
    } catch (error) {
      toast({
        title: "خطا در بارگذاری وظایف سازمانی",
        description: "نتوانستیم وظایف سازمانی شما را بارگذاری کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskCreate = (taskData: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => {
    try {
      organizationalPlanningService.createTask(taskData);
      // Refresh tasks based on current filter
      const filteredTasks = organizationalPlanningService.getFilteredTasks(filter);
      setTasks(filteredTasks);
      setIsFormOpen(false);
      setEditingTask(null);
      toast({
        title: "وظیفه سازمانی جدید اضافه شد",
        description: `وظیفه "${taskData.title}" با موفقیت ایجاد شد.`,
      });
    } catch (error) {
      toast({
        title: "خطا در ایجاد وظیفه سازمانی",
        description: "نتوانستیم وظیفه جدید را ایجاد کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleTaskUpdate = (id: string, updates: Partial<PersonalTask>) => {
    try {
      organizationalPlanningService.updateTask(id, updates);
      // Refresh tasks based on current filter
      const filteredTasks = organizationalPlanningService.getFilteredTasks(filter);
      setTasks(filteredTasks);
      setIsFormOpen(false);
      setEditingTask(null);
      toast({
        title: "وظیفه سازمانی بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد.",
      });
    } catch (error) {
      toast({
        title: "خطا در بروزرسانی وظیفه سازمانی",
        description: "نتوانستیم تغییرات را ذخیره کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleTaskDelete = (id: string) => {
    try {
      organizationalPlanningService.deleteTask(id);
      // Refresh tasks based on current filter
      const filteredTasks = organizationalPlanningService.getFilteredTasks(filter);
      setTasks(filteredTasks);
      toast({
        title: "وظیفه سازمانی حذف شد",
        description: "وظیفه با موفقیت حذف شد.",
      });
    } catch (error) {
      toast({
        title: "خطا در حذف وظیفه سازمانی",
        description: "نتوانستیم وظیفه را حذف کنیم. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = (taskData: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => {
    if (editingTask) {
      // Update existing task
      handleTaskUpdate(editingTask.id, taskData);
    } else {
      // Create new task
      handleTaskCreate(taskData);
    }
  };

  const handleOpenTaskForm = (task?: PersonalTask) => {
    setEditingTask(task || null);
    setIsFormOpen(true);
    setActiveView('list'); // Switch to list view to show the form
  };

  const handleCloseTaskForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleOpenAIChat = (type: 'mentor' | 'coach', task: PersonalTask) => {
    const taskInfo = `وظیفه سازمانی مورد بحث:
عنوان: ${task.title}
${task.description ? `توضیحات: ${task.description}` : ''}
اولویت: ${task.priority === 'high' ? 'بالا' : task.priority === 'medium' ? 'متوسط' : 'پایین'}
وضعیت: ${task.status === 'completed' ? 'تکمیل شده' : task.status === 'in_progress' ? 'در حال انجام' : 'در انتظار'}
${task.due_date ? `سررسید: ${new Date(task.due_date).toLocaleDateString('fa-IR')}` : ''}
${task.progress > 0 ? `پیشرفت: ${task.progress}%` : ''}

لطفاً در مورد این وظیفه سازمانی راهنمایی ارائه دهید.`;

    setChatModal({
      open: true,
      type,
      taskContext: taskInfo
    });
  };

  // Calculate stats and related data with memoization
  const stats = useMemo(() => organizationalPlanningService.getTaskStats(), [tasks]);
  const overdueTasks = useMemo(() => organizationalPlanningService.getOverdueTasks(), [tasks]);
  const upcomingTasks = useMemo(() => organizationalPlanningService.getUpcomingTasks(), [tasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-muted-foreground">در حال بارگذاری وظایف سازمانی...</p>
        </div>
      </div>
    );
  }

  return (
    <PlanningLayout 
      upcomingTasks={upcomingTasks} 
      showUpcoming={activeView !== 'stats'}
      variant="organizational"
    >
      {/* Header */}
      <SectionHeader
        title="برنامه‌ریزی سازمانی"
        subtitle="مدیریت وظایف و پروژه‌های سازمانی و تیمی"
        icon={<Grid />}
        gradient
        action={
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setShowEmailDialog(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">ایمیل نتورک</span>
            </button>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              راهنما
            </button>
            <PlanningActionsMenu
              onNewTask={() => handleOpenTaskForm()}
              onOpenMentor={() => setChatModal({ open: true, type: 'mentor', taskContext: undefined })}
              onOpenCoach={() => setChatModal({ open: true, type: 'coach', taskContext: undefined })}
              newTaskLabel={isMobile ? "وظیفه جدید" : "وظیفه سازمانی جدید"}
              mentorLabel="منتور سازمانی AI"
              coachLabel="کوچ رهبری AI"
              variant="organizational"
            />
          </div>
        }
      />

      {/* Quick Stats */}
      <PlanningStatsCards 
        stats={stats} 
        overdueCount={overdueTasks.length}
        variant="organizational" 
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
        {tasks.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground mb-6">
              <Grid className="h-20 w-20 mx-auto mb-6 text-purple-200" />
              <h3 className="text-xl font-semibold text-foreground mb-3">شروع برنامه‌ریزی سازمانی</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                برای مدیریت موثر وظایف سازمانی، اولین وظیفه خود را اضافه کنید
              </p>
            </div>
            <PlanningActionsMenu
              onNewTask={() => handleOpenTaskForm()}
              onOpenMentor={() => setChatModal({ open: true, type: 'mentor', taskContext: undefined })}
              onOpenCoach={() => setChatModal({ open: true, type: 'coach', taskContext: undefined })}
              newTaskLabel="اضافه کردن وظیفه اول"
              mentorLabel="راهنمای سازمانی"
              coachLabel="کوچ رهبری"
              variant="organizational"
            />
          </div>
        ) : (
          <>
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
                domain="organizational"
              />
            )}

            {activeView === 'calendar' && (
              <TaskCalendar
                onTaskUpdate={handleTaskUpdate}
                onTaskCreate={handleTaskCreate}
                domain="organizational"
              />
            )}

            {activeView === 'matrix' && (
              <PriorityMatrix
                onTaskUpdate={handleTaskUpdate}
                onTaskCreate={handleTaskCreate}
                domain="organizational"
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
          </>
        )}
      </div>

        {/* Task Form Modal */}
        {isFormOpen && (
          <OrganizationalTaskForm
            task={editingTask}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseTaskForm}
          />
        )}

        {/* Help Guide */}
        <OrganizationalPlanningHelpGuide 
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        {/* AI Chat Modal */}
        <Dialog open={chatModal.open} onOpenChange={(open) => setChatModal({ open, type: null, taskContext: undefined })}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {chatModal.type === 'mentor' ? (
                  <>
                    <Brain className="h-5 w-5 text-purple-600" />
                    منتور سازمانی AI - راهنمای برنامه‌ریزی سازمانی
                  </>
                ) : (
                  <>
                    <UserCheck className="h-5 w-5 text-green-600" />
                    کوچ رهبری AI - راهنمای برنامه‌ریزی سازمانی
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            {chatModal.type && (
              <div className="h-full">
                <ChatInterface 
                  sessionType={chatModal.type}
                  initialContext={chatModal.taskContext}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <QuickNetworkingEmail open={showEmailDialog} onOpenChange={setShowEmailDialog} />
    </PlanningLayout>
  );
};

export default OrganizationalPlanningPage;