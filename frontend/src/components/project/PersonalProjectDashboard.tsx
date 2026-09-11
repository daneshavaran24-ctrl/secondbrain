import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp, User, Briefcase, Target, Plus } from 'lucide-react';
import { projectManagementService } from '@/services/projectManagementService';
import { Project, ProjectTask, ProjectMember, ProjectNotification } from '@/types';
import { format, isToday, isTomorrow, isThisWeek, isPast, startOfWeek, endOfWeek } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MobileEnhancedCard, MobileCardGrid } from '@/components/ui/mobile-enhanced-card';
import { PullToRefresh } from '@/components/ui/mobile-pull-to-refresh';
import { TouchOptimizedButton } from '@/components/ui/cross-platform-optimized';
import { useIsMobile } from '@/hooks/use-mobile';

interface PersonalProjectDashboardProps {
  userId?: string;
}

export function PersonalProjectDashboard({ userId: propUserId }: PersonalProjectDashboardProps) {
  const { user: authUser } = useAuth();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<ProjectTask[]>([]);
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [user, setUser] = useState<ProjectMember | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use auth user ID or fallback to prop
  const userId = propUserId || authUser?.id || 'guest_user';
  const displayName = authUser?.display_name || 'کاربر گرامی';

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const allProjects = projectManagementService.getProjects();
      const allTasks = projectManagementService.getTasks();
      const allMembers = projectManagementService.getMembers();
      const userNotifications = projectManagementService.getNotifications(userId);
      
      // Filter projects managed by this user
      const userProjects = allProjects.filter(p => p.managerId === userId);
      
      // Filter tasks assigned to this user
      const userTasks = allTasks.filter(t => t.assigneeId === userId);
      
      // Find user info
      const userInfo = allMembers.find(m => m.id === userId);
      
      setProjects(userProjects);
      setMyTasks(userTasks);
      setNotifications(userNotifications);
      setUser(userInfo || null);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('خطا در بارگذاری داده‌ها');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('داده‌ها به‌روزرسانی شد');
  };

  // Check if user has any data
  const hasData = projectManagementService.hasData();

  const getTaskStats = useMemo(() => {
    const total = myTasks.length;
    const completed = myTasks.filter(task => task.status === 'completed').length;
    const pending = myTasks.filter(task => task.status === 'pending').length;
    const inProgress = myTasks.filter(task => task.status === 'in_progress').length;
    const overdue = myTasks.filter(task => 
      task.status !== 'completed' && new Date(task.deadline) < new Date()
    ).length;

    return { total, completed, pending, inProgress, overdue };
  }, [myTasks]);

  const getUpcomingTasks = useMemo(() => {
    return myTasks
      .filter(task => task.status !== 'completed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [myTasks]);

  const getTasksForToday = useMemo(() => {
    return myTasks.filter(task => 
      task.status !== 'completed' && isToday(new Date(task.deadline))
    );
  }, [myTasks]);

  const getTasksForThisWeek = useMemo(() => {
    return myTasks.filter(task => 
      task.status !== 'completed' && isThisWeek(new Date(task.deadline))
    );
  }, [myTasks]);

  const getProductivityScore = useMemo(() => {
    const thisWeekTasks = getTasksForThisWeek;
    const completedThisWeek = thisWeekTasks.filter(task => task.status === 'completed');
    return thisWeekTasks.length > 0 ? Math.round((completedThisWeek.length / thisWeekTasks.length) * 100) : 0;
  }, [getTasksForThisWeek]);

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    if (isToday(date)) return 'امروز';
    if (isTomorrow(date)) return 'فردا';
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: faIR });
    return format(date, 'dd MMM', { locale: faIR });
  };

  const getDeadlineColor = (deadline: string, status: string) => {
    if (status === 'completed') return 'text-green-600';
    const date = new Date(deadline);
    if (isPast(date)) return 'text-red-600';
    if (isToday(date)) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  // Render empty state for new users
  if (!hasData) {
    return (
      <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
        <div className="space-y-6">
          <MobileEnhancedCard className="text-center" variant="touch-friendly">
            <div className={`py-${isMobile ? '8' : '12'}`}>
              <div className={`w-${isMobile ? '20' : '24'} h-${isMobile ? '20' : '24'} mx-auto mb-6 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center`}>
                <Briefcase className={`h-${isMobile ? '10' : '12'} w-${isMobile ? '10' : '12'} text-primary/70`} />
              </div>
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground mb-2`}>
                خوش آمدید {displayName}!
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                شما هنوز هیچ پروژه‌ای ندارید. برای شروع، پروژه جدیدی ایجاد کنید.
              </p>
              <div className="flex items-center justify-center gap-4">
                <TouchOptimizedButton 
                  size={isMobile ? "lg" : "lg"}
                  variant="primary"
                  className="gap-2 touch-target"
                  onClick={() => {}}
                >
                  <Plus className="h-4 w-4" />
                  پروژه جدید
                </TouchOptimizedButton>
              </div>
            </div>
          </MobileEnhancedCard>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
      <div className="space-y-6">
        {/* Header with Greeting */}
        <div className={`flex items-center ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
          <div className={isMobile ? 'text-center' : ''}>
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>
              سلام {displayName}!
            </h2>
            <p className="text-muted-foreground mt-1">
              امروز {getTasksForToday.length} وظیفه در برنامه شما است
            </p>
          </div>
          <div className={`flex items-center gap-4 ${isMobile ? 'justify-center' : ''}`}>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">امتیاز بهره‌وری</div>
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary`}>
                {getProductivityScore}%
              </div>
            </div>
            <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center`}>
              <TrendingUp className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary-foreground`} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <MobileCardGrid cols={isMobile ? 2 : 5} gap="md">
          <MobileEnhancedCard variant="compact" hover={!isMobile}>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary`}>
                {getTaskStats.total}
              </div>
              <div className="text-sm text-muted-foreground">کل وظایف</div>
            </div>
          </MobileEnhancedCard>
          
          <MobileEnhancedCard variant="compact" hover={!isMobile}>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                {getTaskStats.completed}
              </div>
              <div className="text-sm text-muted-foreground">تکمیل شده</div>
            </div>
          </MobileEnhancedCard>
          
          <MobileEnhancedCard variant="compact" hover={!isMobile}>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
                {getTaskStats.inProgress}
              </div>
              <div className="text-sm text-muted-foreground">در حال انجام</div>
            </div>
          </MobileEnhancedCard>
          
          <MobileEnhancedCard variant="compact" hover={!isMobile}>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-amber-600`}>
                {getTaskStats.pending}
              </div>
              <div className="text-sm text-muted-foreground">در انتظار</div>
            </div>
          </MobileEnhancedCard>
          
          <MobileEnhancedCard variant="compact" hover={!isMobile}>
            <div className="text-center">
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-red-600`}>
                {getTaskStats.overdue}
              </div>
              <div className="text-sm text-muted-foreground">عقب افتاده</div>
            </div>
          </MobileEnhancedCard>
        </MobileCardGrid>

        <MobileCardGrid cols={1} gap="md">
          {/* Today's Tasks */}
          <MobileEnhancedCard 
            title="وظایف امروز"
            icon={<Calendar />}
            variant={isMobile ? "touch-friendly" : "default"}
          >
            {getTasksForToday.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>وظیفه‌ای برای امروز ندارید</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getTasksForToday.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isMobile ? 'active:bg-muted/50' : ''}`}>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status === 'completed' ? 'تکمیل' : 
                           task.status === 'in_progress' ? 'در حال انجام' : 'در انتظار'}
                        </Badge>
                        <span className={`text-sm ${getDeadlineColor(task.deadline, task.status)}`}>
                          <Clock className="h-4 w-4 inline mr-1" />
                          {formatDeadline(task.deadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MobileEnhancedCard>

          {/* Upcoming Tasks */}
          <MobileEnhancedCard 
            title="وظایف آینده"
            icon={<AlertCircle />}
            variant={isMobile ? "touch-friendly" : "default"}
          >
            <ScrollArea className={isMobile ? "h-40" : "h-48"}>
              {getUpcomingTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>وظیفه‌ای در برنامه ندارید</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUpcomingTasks.map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isMobile ? 'active:bg-muted/50' : ''}`}>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status === 'completed' ? 'تکمیل' : 
                             task.status === 'in_progress' ? 'در حال انجام' : 'در انتظار'}
                          </Badge>
                          <span className={`text-sm ${getDeadlineColor(task.deadline, task.status)}`}>
                            <Clock className="h-4 w-4 inline mr-1" />
                            {formatDeadline(task.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </MobileEnhancedCard>
        </MobileCardGrid>

        {/* My Projects */}
        <MobileEnhancedCard 
          title="پروژه‌های من"
          icon={<Briefcase />}
          variant={isMobile ? "touch-friendly" : "default"}
        >
          <p className="text-muted-foreground text-sm mb-4">
            پروژه‌هایی که مدیریت می‌کنید
          </p>
          
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>شما هیچ پروژه‌ای مدیریت نمی‌کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className={`p-4 rounded-lg border transition-shadow ${
                    isMobile ? 'active:bg-muted/50 touch-manipulation' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                        {project.name}
                      </h3>
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                        {project.description}
                      </p>
                    </div>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status === 'active' ? 'فعال' : 
                       project.status === 'completed' ? 'تکمیل' : 
                       project.status === 'planning' ? 'برنامه‌ریزی' : 'متوقف'}
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>پیشرفت</span>
                      <span>{Math.round(project.progress)}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{project.teamMembers?.length || 0} نفر</span>
                      </div>
                      {project.endDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(project.endDate), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MobileEnhancedCard>
      </div>
    </PullToRefresh>
  );
}