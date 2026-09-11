import React, { useState, useEffect } from 'react';
import { Project, ProjectTask, TaskStatus } from '@/types';
import { supabaseProjectService } from '@/services/supabaseProjectService';
import { ProjectEmptyState } from '@/components/project/ProjectEmptyState';
import { ProjectBoard } from '@/components/project/ProjectBoard';
import { ProjectDashboard } from '@/components/project/ProjectDashboard';
import { TaskForm } from '@/components/project/TaskForm';
import { ProjectForm } from '@/components/project/ProjectForm';
import { TaskDelegationPanel } from '@/components/delegation/TaskDelegationPanel';
import { ProjectScrumBoard } from '@/components/project/ProjectScrumBoard';
import { AgileModeToggle } from '@/components/agile/AgileModeToggle';
import { SectionHeader } from '@/components/ui/section-header';
import { LuxuryTabs } from '@/components/ui/luxury-tabs';
import { LuxuryToolbar } from '@/components/ui/luxury-toolbar';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectNotificationCenter } from '@/components/project/ProjectNotificationCenter';
import { ProjectTeamChat } from '@/components/project/ProjectTeamChat';
import { PersonalProjectDashboard } from '@/components/project/PersonalProjectDashboard';
import { ProjectTimeline } from '@/components/project/ProjectTimeline';
import { ProjectFileSharing } from '@/components/project/ProjectFileSharing';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AppIcon } from '@/components/ui/app-icon';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { MobileSheetFilter } from '@/components/ui/mobile-sheet-filter';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Plus, 
  BarChart3, 
  Calendar, 
  Search, 
  Filter,
  FolderPlus,
  Briefcase,
  Users,
  Target,
  Activity,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectManagementPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'dashboard' | 'timeline' | 'chat' | 'files'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [taskFormStatus, setTaskFormStatus] = useState<TaskStatus>('pending');
  const [agileMode, setAgileMode] = useState<'kanban' | 'scrum'>('kanban');

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  const loadProjects = async () => {
    const allProjects = await supabaseProjectService.getProjects();
    setProjects(allProjects);
    
    // Set default project if none selected
    if (!selectedProject && allProjects.length > 0) {
      setSelectedProject(allProjects[0]);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('board');
  };

  const handleCreateProject = () => {
    setShowProjectForm(true);
  };

  const handleAddTask = (status: TaskStatus = 'pending') => {
    if (!selectedProject) {
      toast({
        title: "خطا",
        description: "ابتدا یک پروژه انتخاب کنید",
        variant: "destructive"
      });
      return;
    }
    setTaskFormStatus(status);
    setShowTaskForm(true);
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleSuccess = async () => {
    await loadProjects();
    // Refresh selected project  
    if (selectedProject) {
      const allProjects = await supabaseProjectService.getProjects();
      const updatedProject = allProjects.find(p => p.id === selectedProject.id);
      if (updatedProject) {
        setSelectedProject(updatedProject);
      }
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, onHold: 0 });
  
  const loadStats = async () => {
    const projectStats = await supabaseProjectService.getProjectStats();
    setStats(projectStats);
  };

  useEffect(() => {
    if (selectedProject) {
      const key = `agile_mode_project_${selectedProject.id}`;
      const saved = (localStorage.getItem(key) as 'kanban' | 'scrum' | null);
      if (saved) setAgileMode(saved);
    }
  }, [selectedProject?.id]);

  const tabItems = [
    {
      value: "board",
      label: "بورد وظایف", 
      icon: <Activity className="h-4 w-4" />
    },
    {
      value: "dashboard",
      label: "داشبورد",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      value: "timeline",
      label: "تایم‌لاین",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      value: "chat",
      label: "چت تیم",
      icon: <Users className="h-4 w-4" />
    },
    {
      value: "files",
      label: "فایل‌ها",
      icon: <Settings className="h-4 w-4" />
    }
  ];

  // Stats are now loaded asynchronously

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <SectionHeader
          title="مدیریت پروژه‌ها"
          subtitle="مدیریت هوشمند پروژه‌ها و وظایف با امکانات پیشرفته"
          icon={<AppIcon size={isMobile ? "md" : "lg"}><Briefcase /></AppIcon>}
          action={
            <ModernButton 
              onClick={handleCreateProject}
              icon={<AppIcon size="sm"><FolderPlus /></AppIcon>}
              magnetic
              glow
              size={isMobile ? "sm" : "default"}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isMobile ? "پروژه" : "پروژه جدید"}
            </ModernButton>
          }
          gradient
        />

        {/* Stats Cards */}
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="md">
          <ResponsiveCard hover glow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">کل پروژه‌ها</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-primary`}>{stats.total}</p>
              </div>
              <div className="p-2 md:p-3 bg-gradient-to-r from-primary to-primary/80 rounded-xl text-white shadow-md flex-shrink-0">
                <AppIcon size={isMobile ? "sm" : "md"}><Briefcase /></AppIcon>
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard hover glow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">فعال</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-emerald-600`}>{stats.active}</p>
              </div>
              <div className="p-2 md:p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-white shadow-md flex-shrink-0">
                <AppIcon size={isMobile ? "sm" : "md"}><Activity /></AppIcon>
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard hover glow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">تکمیل شده</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-blue-600`}>{stats.completed}</p>
              </div>
              <div className="p-2 md:p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white shadow-md flex-shrink-0">
                <AppIcon size={isMobile ? "sm" : "md"}><Target /></AppIcon>
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard hover glow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">متوقف</p>
                <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-amber-600`}>{stats.onHold}</p>
              </div>
              <div className="p-2 md:p-3 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl text-white shadow-md flex-shrink-0">
                <AppIcon size={isMobile ? "sm" : "md"}><Calendar /></AppIcon>
              </div>
            </div>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Personal Dashboard */}
        <div className="mb-6">
          <PersonalProjectDashboard />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Notifications Panel */}
          <div className="lg:col-span-1">
            <ProjectNotificationCenter 
              userId={undefined} 
              projectId={selectedProject?.id}
            />
          </div>
          <ModernCard 
            title="پروژه‌ها"
            icon={<Briefcase className="h-5 w-5" />}
            className="lg:col-span-1"
            hover
            glow
          >
            <LuxuryToolbar className="mb-4">
              <div className="space-y-3 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-body" />
                  <Input
                    placeholder="جستجو در پروژه‌ها..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="فیلتر وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="planning">در حال برنامه‌ریزی</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="on-hold">متوقف</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="cancelled">لغو شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </LuxuryToolbar>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProjects.length === 0 ? (
                projects.length === 0 ? (
                  <ProjectEmptyState 
                    onCreateProject={handleCreateProject}
                    onDataInitialized={async () => {
                      await loadProjects();
                      await loadStats();
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={<Briefcase className="h-12 w-12" />}
                    title="پروژه‌ای یافت نشد"
                    description="فیلترهای جستجو را تغییر دهید"
                  />
                )
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border transition-elegant cursor-pointer hover-lift ${
                      selectedProject?.id === project.id
                        ? 'border-lux-gold bg-gradient-luxury-gold/10'
                        : 'border-border/50 hover:border-lux-gold/50'
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold heading-secondary mb-1 line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-body line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="w-3 h-3 rounded-full ml-2 mt-1 flex-shrink-0 bg-gradient-luxury-gold" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={project.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                         {project.status === 'active' ? 'فعال' : 
                         project.status === 'completed' ? 'تکمیل' :
                         project.status === 'on_hold' ? 'متوقف' : 'برنامه‌ریزی'}
                      </Badge>
                      
                      <div className="flex items-center gap-2 text-xs text-body">
                        <Users className="h-3 w-3" />
                        <span>{project.teamMembers.length}</span>
                        <span>•</span>
                        <span>{Math.round(project.progress)}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="w-full bg-border/50 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-luxury-gold h-1.5 rounded-full transition-elegant" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ModernCard>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <ModernCard 
                title={selectedProject.name}
                icon={<div className="w-4 h-4 rounded-full bg-gradient-luxury-gold" />}
                className="h-full"
                hover
                glow
              >
                <div className="space-y-6">
                  <LuxuryToolbar>
                    <div className="flex items-center justify-between w-full">
                      <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                         {selectedProject.status === 'active' ? 'فعال' : 
                         selectedProject.status === 'completed' ? 'تکمیل شده' :
                         selectedProject.status === 'on_hold' ? 'متوقف' : 'برنامه‌ریزی'}
                      </Badge>
                      
                      <div className="flex items-center gap-3">
                        <AgileModeToggle
                          value={agileMode}
                          onChange={(mode) => {
                            setAgileMode(mode);
                            localStorage.setItem(`agile_mode_project_${selectedProject.id}`, mode);
                          }}
                          storageKey={`agile_mode_project_${selectedProject.id}`}
                        />
                        
                        <TaskDelegationPanel 
                          projectId={selectedProject.id}
                          onDelegationCreated={handleSuccess}
                        />
                        
                        <ModernButton 
                          onClick={() => handleAddTask()} 
                          size="sm" 
                          icon={<Plus className="h-4 w-4" />}
                          magnetic
                          glow
                          className="bg-gradient-luxury-gold hover:bg-gradient-luxury-ember"
                        >
                          وظیفه جدید
                        </ModernButton>
                      </div>
                    </div>
                  </LuxuryToolbar>

                  <LuxuryTabs
                    items={tabItems}
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as any)}
                  >
                    <div className="space-y-6">
                      {activeTab === 'board' && (
                        agileMode === 'kanban' ? (
                          <ProjectBoard
                            project={selectedProject}
                            onTaskClick={handleTaskClick}
                            onAddTask={handleAddTask}
                            onRefresh={handleSuccess}
                          />
                        ) : (
                          <ProjectScrumBoard
                            project={selectedProject}
                            onTaskClick={handleTaskClick}
                            onAddTask={handleAddTask}
                            onRefresh={handleSuccess}
                          />
                        )
                      )}
                      
                      {activeTab === 'dashboard' && (
                        <ProjectDashboard
                          project={selectedProject}
                          onRefresh={handleSuccess}
                        />
                      )}
                      
                      {activeTab === 'timeline' && (
                        <ProjectTimeline
                          project={selectedProject}
                          onTaskClick={handleTaskClick}
                        />
                      )}
                      
                      {activeTab === 'chat' && (
                        <ProjectTeamChat
                          project={selectedProject}
                          currentUserId="member_1"
                        />
                      )}
                      
                      {activeTab === 'files' && (
                        <ProjectFileSharing
                          project={selectedProject}
                          currentUserId="member_1"
                        />
                      )}
                    </div>
                  </LuxuryTabs>
                </div>
              </ModernCard>
            ) : (
              <EmptyState
                icon={<Briefcase className="h-16 w-16" />}
                title="پروژه‌ای انتخاب نشده"
                description="برای مشاهده جزئیات، یک پروژه از فهرست انتخاب کنید"
                action={{
                  label: "ایجاد پروژه جدید",
                  onClick: handleCreateProject,
                  icon: <Plus className="h-4 w-4" />
                }}
                className="h-full"
              />
            )}
          </div>
        </div>

        {/* Modals */}
        <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>پروژه جدید</DialogTitle>
              <DialogDescription>
                ایجاد پروژه جدید برای مدیریت وظایف و منابع
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              open={showProjectForm}
              onOpenChange={setShowProjectForm}
              onSuccess={() => {
                handleSuccess();
                setShowProjectForm(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>وظیفه جدید</DialogTitle>
              <DialogDescription>
                افزودن وظیفه جدید به پروژه انتخاب شده
              </DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <TaskForm
                open={showTaskForm}
                onOpenChange={setShowTaskForm}
                projectId={selectedProject.id}
                initialStatus={taskFormStatus}
                onSuccess={() => {
                  handleSuccess();
                  setShowTaskForm(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>جزئیات وظیفه</DialogTitle>
              <DialogDescription>
                مشاهده و ویرایش جزئیات کامل وظیفه
              </DialogDescription>
            </DialogHeader>
            {selectedTask && selectedProject && (
              <TaskForm
                open={showTaskDetails}
                onOpenChange={setShowTaskDetails}
                projectId={selectedProject.id}
                task={selectedTask}
                onSuccess={() => {
                  handleSuccess();
                  setShowTaskDetails(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}