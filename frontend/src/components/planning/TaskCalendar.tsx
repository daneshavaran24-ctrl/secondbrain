import React, { useState, useEffect } from 'react';
import { PersonalTask } from '@/types';
import { personalPlanningService } from '@/services/personalPlanningService';
import { organizationalPlanningService } from '@/services/organizationalPlanningService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import TaskForm from './TaskForm';
import ProfessionalTaskForm from './ProfessionalTaskForm';
import OrganizationalTaskForm from './OrganizationalTaskForm';

interface TaskCalendarProps {
  onTaskUpdate: (id: string, updates: Partial<PersonalTask>) => void;
  onTaskCreate: (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => void;
  domain?: 'personal' | 'professional' | 'organizational';
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ 
  onTaskUpdate, 
  onTaskCreate, 
  domain = 'personal' 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const persianDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Get the appropriate service based on domain
  const getService = () => {
    switch (domain) {
      case 'organizational':
        return organizationalPlanningService;
      case 'professional':
        return personalPlanningService; // TODO: Add professionalPlanningService when available
      default:
        return personalPlanningService;
    }
  };

  useEffect(() => {
    loadTasksForMonth();
  }, [currentDate]);

  const loadTasksForMonth = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const service = getService();
    const monthTasks = service.getTasksForCalendar(month, year);
    setTasks(monthTasks);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => task.due_date?.startsWith(dateStr));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (taskData: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => {
    const finalTaskData = {
      ...taskData,
      due_date: selectedDate || taskData.due_date,
    };
    onTaskCreate(finalTaskData);
    setIsFormOpen(false);
    setSelectedDate(null);
    loadTasksForMonth();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedDate(null);
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="card-app-spacious">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-app-title">
              {persianMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="text-lg px-4 py-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="text-lg px-4 py-2"
            >
              امروز
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="text-lg px-4 py-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {persianDays.map(day => (
            <div key={day} className="text-center font-medium text-app-subtitle py-3 text-lg">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square" />;
            }
            
            const dayTasks = getTasksForDate(day);
            const hasHighPriority = dayTasks.some(task => task.priority === 'high');
            const hasOverdue = dayTasks.some(task => 
              task.status !== 'completed' && 
              new Date(task.due_date!) < new Date()
            );
            
            return (
              <div
                key={day}
                className={`
                  aspect-square border border-gray-200 p-2 cursor-pointer transition-all hover:bg-gray-50
                  ${isToday(day) ? 'bg-blue-50 border-blue-300' : ''}
                  ${hasOverdue ? 'bg-red-50 border-red-300' : ''}
                  ${hasHighPriority ? 'ring-2 ring-orange-300' : ''}
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-app-text'}`}>
                    {day}
                  </div>
                  
                  {/* Tasks for this day */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className="text-xs p-1 rounded bg-white border border-gray-300 truncate"
                        title={task.title}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                          <span className={task.status === 'completed' ? 'line-through text-gray-500' : ''}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayTasks.length - 3} مورد دیگر
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Month's Tasks */}
        <div className="card-app-spacious">
          <h3 className="text-xl font-semibold text-app-title mb-4">وظایف این ماه</h3>
          <div className="space-y-3">
            {tasks.slice(0, 10).map(task => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                <div className="flex-1">
                  <div className={`font-medium text-app-readable ${
                    task.status === 'completed' ? 'line-through text-gray-500' : ''
                  }`}>
                    {task.title}
                  </div>
                  <div className="text-sm text-app-subtitle">
                    {task.due_date && new Date(task.due_date).toLocaleDateString('fa-IR')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={task.priority === 'high' ? 'destructive' : 
                            task.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {task.priority === 'high' ? 'بالا' : 
                     task.priority === 'medium' ? 'متوسط' : 'پایین'}
                  </Badge>
                  <Badge
                    variant={task.status === 'completed' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {task.status === 'completed' ? 'تکمیل' : 
                     task.status === 'in_progress' ? 'در حال انجام' : 'انتظار'}
                  </Badge>
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-app-subtitle">
                هیچ وظیفه‌ای برای این ماه تعریف نشده است
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card-app-spacious">
          <h3 className="text-xl font-semibold text-app-title mb-4">آمار سریع</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-app-readable">کل وظایف:</span>
              <span className="font-semibold">{tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-readable">تکمیل شده:</span>
              <span className="font-semibold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-readable">در حال انجام:</span>
              <span className="font-semibold text-yellow-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-readable">معوقه:</span>
              <span className="font-semibold text-red-600">
                {tasks.filter(t => 
                  t.status !== 'completed' && 
                  t.due_date && 
                  new Date(t.due_date) < new Date()
                ).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-readable">درصد تکمیل:</span>
              <span className="font-semibold">
                {tasks.length > 0 ? 
                  Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
                }%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {isFormOpen && (
        <>
          {domain === 'personal' && (
            <TaskForm
              task={null}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
          {domain === 'professional' && (
            <ProfessionalTaskForm
              task={null}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
          {domain === 'organizational' && (
            <OrganizationalTaskForm
              task={null}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TaskCalendar;