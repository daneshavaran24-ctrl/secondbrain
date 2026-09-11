import React, { useState, useEffect } from 'react';
import { PersonalTask } from '@/types';
import { personalPlanningService } from '@/services/personalPlanningService';
import { organizationalPlanningService } from '@/services/organizationalPlanningService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import TaskForm from './TaskForm';
import ProfessionalTaskForm from './ProfessionalTaskForm';
import OrganizationalTaskForm from './OrganizationalTaskForm';

interface PriorityMatrixProps {
  onTaskUpdate: (id: string, updates: Partial<PersonalTask>) => void;
  onTaskCreate: (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => void;
  domain?: 'personal' | 'professional' | 'organizational';
}

const PriorityMatrix: React.FC<PriorityMatrixProps> = ({ 
  onTaskUpdate, 
  onTaskCreate, 
  domain = 'personal' 
}) => {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<{priority: PersonalTask['priority'], urgency: 'urgent' | 'not_urgent'} | null>(null);

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
    loadTasks();
  }, []);

  const loadTasks = () => {
    const service = getService();
    const allTasks = service.getTasks();
    // Filter out completed tasks for the matrix view
    setTasks(allTasks.filter(task => task.status !== 'completed'));
  };

  const isUrgent = (task: PersonalTask) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3; // Consider urgent if due within 3 days
  };

  const getQuadrantTasks = (priority: PersonalTask['priority'], urgent: boolean) => {
    return tasks.filter(task => {
      const taskUrgent = isUrgent(task);
      return task.priority === priority && taskUrgent === urgent;
    });
  };

  const handleEdit = (task: PersonalTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddTask = (priority: PersonalTask['priority'], urgency: 'urgent' | 'not_urgent') => {
    setSelectedQuadrant({ priority, urgency });
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (taskData: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => {
    const finalTaskData = { ...taskData };

    // If adding to a specific quadrant, adjust due date for urgency
    if (selectedQuadrant && !editingTask) {
      finalTaskData.priority = selectedQuadrant.priority;
      
      if (selectedQuadrant.urgency === 'urgent' && !finalTaskData.due_date) {
        // Set due date to tomorrow for urgent tasks
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        finalTaskData.due_date = tomorrow.toISOString().split('T')[0];
      }
    }

    if (editingTask) {
      onTaskUpdate(editingTask.id, finalTaskData);
    } else {
      onTaskCreate(finalTaskData);
    }
    
    setIsFormOpen(false);
    setEditingTask(null);
    setSelectedQuadrant(null);
    loadTasks();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setSelectedQuadrant(null);
  };

  const handleTaskComplete = (task: PersonalTask) => {
    onTaskUpdate(task.id, { status: 'completed' });
    loadTasks();
  };

  const handleTaskDelete = (task: PersonalTask) => {
    if (window.confirm('آیا از حذف این وظیفه اطمینان دارید؟')) {
      personalPlanningService.deleteTask(task.id);
      loadTasks();
    }
  };

  const renderTaskCard = (task: PersonalTask) => (
    <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-app-readable text-sm leading-tight">{task.title}</h4>
        <div className="flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTaskComplete(task)}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            title="تکمیل"
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(task)}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
            title="ویرایش"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTaskDelete(task)}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            title="حذف"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-app-subtitle mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <Badge
          variant={task.status === 'in_progress' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {task.status === 'in_progress' ? 'در حال انجام' : 'انتظار'}
        </Badge>
        {task.due_date && (
          <span className={`text-xs ${
            isUrgent(task) ? 'text-red-600 font-medium' : 'text-app-subtitle'
          }`}>
            {new Date(task.due_date).toLocaleDateString('fa-IR')}
          </span>
        )}
      </div>
    </div>
  );

  const renderQuadrant = (
    title: string, 
    description: string, 
    priority: PersonalTask['priority'], 
    urgent: boolean, 
    bgColor: string,
    borderColor: string
  ) => {
    const quadrantTasks = getQuadrantTasks(priority, urgent);
    
    return (
      <Card className={`${bgColor} ${borderColor} card-app-spacious`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">{title}</CardTitle>
              <p className="text-sm text-app-subtitle">{description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddTask(priority, urgent ? 'urgent' : 'not_urgent')}
              className="text-sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
          {quadrantTasks.length === 0 ? (
            <div className="text-center py-8 text-app-subtitle">
              <div className="text-sm">هیچ وظیفه‌ای در این بخش نیست</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddTask(priority, urgent ? 'urgent' : 'not_urgent')}
                className="mt-2 text-xs"
              >
                اولین وظیفه را اضافه کنید
              </Button>
            </div>
          ) : (
            quadrantTasks.map(renderTaskCard)
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Matrix Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-app-title mb-2">ماتریس اولویت‌بندی اهمیت/فوریت</h2>
        <p className="text-app-subtitle text-lg">
          ماتریس آیزنهاور برای مدیریت بهتر وظایف - تمرکز روی مهم و فوری
        </p>
      </div>

      {/* Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quadrant 1: Important & Urgent (High Priority + Urgent) */}
        {renderQuadrant(
          '۱. مهم و فوری',
          'انجام فوری - بحران‌ها و ضروری‌ها',
          'high',
          true,
          'bg-red-50',
          'border-red-300'
        )}

        {/* Quadrant 2: Important & Not Urgent (High Priority + Not Urgent) */}
        {renderQuadrant(
          '۲. مهم و غیرفوری',
          'برنامه‌ریزی کنید - هدف‌ها و پیشگیری',
          'high',
          false,
          'bg-green-50',
          'border-green-300'
        )}

        {/* Quadrant 3: Not Important & Urgent (Medium/Low Priority + Urgent) */}
        {renderQuadrant(
          '۳. غیرمهم و فوری',
          'واگذار کنید - مزاحمت‌ها و وقفه‌ها',
          'medium',
          true,
          'bg-yellow-50',
          'border-yellow-300'
        )}

        {/* Quadrant 4: Not Important & Not Urgent (Low Priority + Not Urgent) */}
        {renderQuadrant(
          '۴. غیرمهم و غیرفوری',
          'حذف کنید - اتلاف وقت و سرگرمی‌ها',
          'low',
          false,
          'bg-gray-50',
          'border-gray-300'
        )}
      </div>

      {/* Matrix Guidelines */}
      <Card className="card-app-spacious bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl">راهنمای استفاده از ماتریس</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-app-readable">
            <div>
              <h4 className="font-semibold text-red-700 mb-1">۱. مهم و فوری (قرمز)</h4>
              <p className="text-sm">بحران‌ها و ضروری‌ها - فوراً انجام دهید</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-1">۲. مهم و غیرفوری (سبز)</h4>
              <p className="text-sm">اهداف و پیشگیری - برنامه‌ریزی کنید</p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-700 mb-1">۳. غیرمهم و فوری (زرد)</h4>
              <p className="text-sm">مزاحمت‌ها - واگذار یا کم کنید</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">۴. غیرمهم و غیرفوری (خاکستری)</h4>
              <p className="text-sm">اتلاف وقت - حذف کنید</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      {isFormOpen && (
        <>
          {domain === 'personal' && (
            <TaskForm
              task={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
          {domain === 'professional' && (
            <ProfessionalTaskForm
              task={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
          {domain === 'organizational' && (
            <OrganizationalTaskForm
              task={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PriorityMatrix;