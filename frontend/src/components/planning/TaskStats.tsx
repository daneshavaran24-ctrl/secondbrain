import React from 'react';
import { PersonalTask, TaskStats as TaskStatsType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Star
} from 'lucide-react';

interface TaskStatsProps {
  stats: TaskStatsType;
  overdueTasks: PersonalTask[];
  upcomingTasks: PersonalTask[];
}

const TaskStats: React.FC<TaskStatsProps> = ({ stats, overdueTasks, upcomingTasks }) => {
  const formatDays = (days: number) => {
    if (days < 1) return 'کمتر از یک روز';
    return `${Math.round(days)} روز`;
  };

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: 'عالی', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'خوب', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { level: 'متوسط', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'نیازمند بهبود', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const productivity = getProductivityLevel(stats.productivity_score);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-app-spacious bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">کل وظایف</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-app-spacious bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-700">تکمیل شده</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-app-spacious bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
                <div className="text-sm text-yellow-700">در حال انجام</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-app-spacious bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-sm text-red-700">معوقه</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <Card className="card-app-spacious">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5" />
              نرخ تکمیل وظایف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {Math.round(stats.completion_rate)}%
              </div>
              <Progress value={stats.completion_rate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
                <div className="text-sm text-app-subtitle">تکمیل شده</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-600">{stats.total - stats.completed}</div>
                <div className="text-sm text-app-subtitle">باقی‌مانده</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Score */}
        <Card className="card-app-spacious">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Star className="h-5 w-5" />
              امتیاز بهره‌وری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${productivity.color}`}>
                {Math.round(stats.productivity_score)}
              </div>
              <Badge className={`${productivity.bg} ${productivity.color} text-lg px-4 py-2`}>
                {productivity.level}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-app-readable">
                میانگین زمان تکمیل
              </div>
              <div className="text-app-subtitle">
                {formatDays(stats.average_completion_time)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <Card className="card-app-spacious">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-5 w-5" />
              توزیع دسته‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.category_breakdown).map(([category, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const categoryLabels = {
                work: 'کار',
                personal: 'شخصی',
                health: 'سلامت',
                family: 'خانواده',
                learning: 'یادگیری',
                finance: 'مالی',
              };
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between text-app-readable">
                    <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Priorities */}
        <Card className="card-app-spacious">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5" />
              توزیع اولویت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.priority_breakdown).map(([priority, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const priorityLabels = {
                high: 'بالا',
                medium: 'متوسط',
                low: 'پایین',
              };
              const colors = {
                high: 'bg-red-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500',
              };
              
              return (
                <div key={priority} className="space-y-2">
                  <div className="flex justify-between text-app-readable">
                    <span>{priorityLabels[priority as keyof typeof priorityLabels]}</span>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[priority as keyof typeof colors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="card-app-spacious">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            پیشرفت هفتگی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {stats.weekly_progress.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-app-subtitle mb-2">
                  {new Date(day.date).toLocaleDateString('fa-IR', { weekday: 'short' })}
                </div>
                <div className="space-y-1">
                  <div className="bg-green-100 rounded p-2">
                    <div className="text-lg font-bold text-green-600">{day.completed}</div>
                    <div className="text-xs text-green-700">تکمیل</div>
                  </div>
                  <div className="bg-blue-100 rounded p-2">
                    <div className="text-lg font-bold text-blue-600">{day.created}</div>
                    <div className="text-xs text-blue-700">ایجاد</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming & Overdue Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <Card className="card-app-spacious border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-red-800">
              <AlertTriangle className="h-5 w-5" />
              وظایف معوقه ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {overdueTasks.length === 0 ? (
              <div className="text-center py-4 text-red-700">
                هیچ وظیفه معوقه‌ای وجود ندارد! 🎉
              </div>
            ) : (
              overdueTasks.map(task => (
                <div key={task.id} className="bg-white p-3 rounded border border-red-200">
                  <div className="font-medium text-red-900">{task.title}</div>
                  <div className="text-sm text-red-700">
                    سررسید: {task.due_date && new Date(task.due_date).toLocaleDateString('fa-IR')}
                  </div>
                  <Badge variant="destructive" className="text-xs mt-1">
                    {task.priority === 'high' ? 'بالا' : 
                     task.priority === 'medium' ? 'متوسط' : 'پایین'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="card-app-spacious border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-yellow-800">
              <Clock className="h-5 w-5" />
              وظایف نزدیک به سررسید ({upcomingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-4 text-yellow-700">
                هیچ وظیفه نزدیک به سررسیدی وجود ندارد
              </div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="bg-white p-3 rounded border border-yellow-200">
                  <div className="font-medium text-yellow-900">{task.title}</div>
                  <div className="text-sm text-yellow-700">
                    سررسید: {task.due_date && new Date(task.due_date).toLocaleDateString('fa-IR')}
                  </div>
                  <Badge 
                    variant={task.priority === 'high' ? 'destructive' : 'default'} 
                    className="text-xs mt-1"
                  >
                    {task.priority === 'high' ? 'بالا' : 
                     task.priority === 'medium' ? 'متوسط' : 'پایین'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskStats;