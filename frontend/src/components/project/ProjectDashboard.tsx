import React, { useState, useEffect } from 'react';
import { Project, ProjectStats } from '@/types';
import { projectManagementService } from '@/services/projectManagementService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Calendar,
  Target,
  Activity
} from 'lucide-react';

interface ProjectDashboardProps {
  project: Project;
  onRefresh: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export function ProjectDashboard({ project, onRefresh }: ProjectDashboardProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [project.id]);

  const loadStats = () => {
    setIsLoading(true);
    try {
      const projectStats = projectManagementService.getProjectStats(project.id);
      setStats(projectStats);
    } catch (error) {
      console.error('Error loading project stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pieChartData = [
    { name: 'تکمیل شده', value: stats.completedTasks, color: COLORS[0] },
    { name: 'در حال انجام', value: stats.inProgressTasks, color: COLORS[1] },
    { name: 'در انتظار', value: stats.pendingTasks, color: COLORS[2] },
    { name: 'مسدود شده', value: stats.blockedTasks, color: COLORS[3] }
  ].filter(item => item.value > 0);

  const barChartData = [
    { name: 'تکمیل شده', count: stats.completedTasks },
    { name: 'در حال انجام', count: stats.inProgressTasks },
    { name: 'در انتظار', count: stats.pendingTasks },
    { name: 'مسدود شده', count: stats.blockedTasks }
  ];

  return (
    <div className="space-y-6">
      {/* Project Info Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {project.name}
              </CardTitle>
              <p className="text-muted-foreground mb-4">{project.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>هدف: {project.goal}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.teamMembers.length} عضو</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>از {new Date(project.startDate).toLocaleDateString('fa-IR')} تا {project.endDate ? new Date(project.endDate).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={project.status === 'active' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {project.status === 'active' ? 'فعال' : 
                 project.status === 'completed' ? 'تکمیل شده' :
                 project.status === 'on_hold' ? 'متوقف' : 'در حال برنامه‌ریزی'}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(project.progress)}%</div>
                <div className="text-xs text-muted-foreground">پیشرفت کلی</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={project.progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل وظایف</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTasks}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تکمیل شده</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                <p className="text-xs text-muted-foreground">{Math.round(stats.completionRate)}% تکمیل</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تاخیر دارد</p>
                <p className="text-2xl font-bold text-orange-600">{stats.overdueTasks}</p>
                <p className="text-xs text-muted-foreground">نیاز به توجه</p>
              </div>
              <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط زمان</p>
                <p className="text-2xl font-bold text-blue-600">{stats.averageTaskDuration.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">هر وظیفه</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              توزیع وظایف بر اساس وضعیت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              نسبت وظایف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            اعضای تیم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectManagementService.getMembers().filter(member => project.teamMembers.includes(member.id)).map((member) => {
              const memberTasks = projectManagementService.getTasks(project.id)
                .filter(task => task.assigneeId === member.id);
              const completedTasks = memberTasks.filter(task => task.status === 'completed').length;
              const completionRate = memberTasks.length > 0 ? (completedTasks / memberTasks.length) * 100 : 0;
              
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {memberTasks.length} وظیفه ({Math.round(completionRate)}% تکمیل)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}