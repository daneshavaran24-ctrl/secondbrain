import React, { useState, useEffect } from 'react';
import { Project, ProjectTask } from '@/types';
import { projectManagementService } from '@/services/projectManagementService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause,
  Users,
  Filter
} from 'lucide-react';
import { format, differenceInDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface ProjectTimelineProps {
  project: Project;
  onTaskClick?: (task: ProjectTask) => void;
}

export function ProjectTimeline({ project, onTaskClick }: ProjectTimelineProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = () => {
    const projectTasks = projectManagementService.getTasks(project.id);
    setTasks(projectTasks);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 6 }); // Saturday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTasksForDay = (date: Date) => {
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getTaskDuration = (task: ProjectTask) => {
    const start = new Date(task.createdAt);
    const end = new Date(task.deadline);
    return differenceInDays(end, start) + 1;
  };

  const getTaskPosition = (task: ProjectTask, dayIndex: number) => {
    const taskStart = new Date(task.createdAt);
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 6 });
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + dayIndex);
    
    const startDiff = differenceInDays(taskStart, dayStart);
    const duration = getTaskDuration(task);
    
    return {
      left: Math.max(0, -startDiff) * (100 / 7),
      width: Math.min(duration, 7 - Math.max(0, -startDiff)) * (100 / 7)
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in_progress':
        return 'bg-blue-500 text-white';
      case 'blocked':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-green-500';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = getWeekDays();
  const members = projectManagementService.getMembers();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تایم‌لاین پروژه - {project.name}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="in_progress">در حال انجام</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
                <SelectItem value="blocked">مسدود</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              ← هفته قبل
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              امروز
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              هفته بعد →
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {format(weekDays[0], 'dd/MM')} - {format(weekDays[6], 'dd/MM/yyyy')}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`p-2 text-center border rounded-lg ${
                  isToday(day) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <div className="text-xs font-medium">
                  {format(day, 'EEEE')}
                </div>
                <div className="text-sm">
                  {format(day, 'dd')}
                </div>
              </div>
            ))}
          </div>

          {/* Tasks Timeline */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const assignee = members.find(m => m.id === task.assigneeId);
                
                return (
                  <div
                    key={task.id}
                    className={`relative p-3 border-l-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${getPriorityColor(task.priority)}`}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {task.title}
                        </h4>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status === 'completed' ? 'تکمیل' :
                           task.status === 'in_progress' ? 'در حال انجام' :
                           task.status === 'blocked' ? 'مسدود' : 'در انتظار'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {assignee && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">{assignee.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(task.deadline), 'dd/MM')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {task.description}
                    </p>
                    
                    {/* Task progress bar */}
                    <div className="w-full bg-border rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${getStatusColor(task.status)}`}
                        style={{ 
                          width: task.status === 'completed' ? '100%' : 
                                 task.status === 'in_progress' ? '60%' : '20%'
                        }}
                      />
                    </div>
                    
                    {/* Task tags */}
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{task.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>هیچ وظیفه‌ای برای نمایش وجود ندارد</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-l-4 border-l-red-500 bg-muted rounded-sm"></div>
              <span>اولویت بالا</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-l-4 border-l-yellow-500 bg-muted rounded-sm"></div>
              <span>اولویت متوسط</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-l-4 border-l-green-500 bg-muted rounded-sm"></div>
              <span>اولویت پایین</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}