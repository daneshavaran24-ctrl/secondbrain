import React, { useState } from 'react';
import { PersonalTask, TaskFilter } from '@/types';
import TaskForm from './TaskForm';
import ProfessionalTaskForm from './ProfessionalTaskForm';
import OrganizationalTaskForm from './OrganizationalTaskForm';
import TaskFilters from './TaskFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Edit, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  Circle, 
  Clock,
  AlertCircle,
  Plus,
  Brain,
  UserCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickTaskForm } from '@/components/ui/quick-task-form';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface TaskManagerProps {
  tasks: PersonalTask[];
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onTaskCreate: (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => void;
  onTaskUpdate: (id: string, updates: Partial<PersonalTask>) => void;
  onTaskDelete: (id: string) => void;
  isLoading: boolean;
  onOpenAIChat?: (type: 'mentor' | 'coach', task: PersonalTask) => void;
  domain?: 'personal' | 'professional' | 'organizational';
  shouldOpenForm?: boolean;
  onFormStateChange?: (isOpen: boolean) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  filter,
  onFilterChange,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  isLoading,
  onOpenAIChat,
  domain = 'personal',
  shouldOpenForm,
  onFormStateChange
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const isMobile = useIsMobile();

  // Handle external form trigger
  React.useEffect(() => {
    if (shouldOpenForm) {
      setIsFormOpen(true);
      onFormStateChange?.(false); // Reset the trigger
    }
  }, [shouldOpenForm, onFormStateChange]);

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  const priorityLabels = {
    high: 'بالا',
    medium: 'متوسط',
    low: 'پایین',
  };

  const statusIcons = {
    todo: Circle,
    in_progress: Clock,
    completed: CheckCircle,
  };

  const statusLabels = {
    todo: 'انتظار',
    in_progress: 'در حال انجام',
    completed: 'تکمیل شده',
  };

  const categoryLabels = {
    work: 'کار',
    personal: 'شخصی',
    health: 'سلامت',
    family: 'خانواده',
    learning: 'یادگیری',
    finance: 'مالی',
    spiritual_development: 'رشد معنوی',
    educational_development: 'رشد آموزشی',
    moral_development: 'رشد اخلاقی',
    social_development: 'رشد اجتماعی',
  };

  const mainCategoryLabels = {
    personal_life: 'زندگی شخصی',
    personal_development: 'رشد و توسعه فردی',
  };

  const getCategoryDisplay = (task: PersonalTask) => {
    // For professional and organizational domains, use custom category if available
    if (domain !== 'personal' && task.customCategory) {
      return task.customCategory;
    }
    
    // For personal domain or tasks without custom category, use the structured categories
    const mainCat = task.mainCategory || (
      ['spiritual_development', 'educational_development', 'moral_development', 'social_development'].includes(task.category!)
        ? 'personal_development' 
        : 'personal_life'
    );
    const subCat = task.subCategory || task.category!;
    
    return `${mainCategoryLabels[mainCat]} / ${categoryLabels[subCat]}`;
  };

  const handleEdit = (task: PersonalTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleStatusToggle = (task: PersonalTask) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    onTaskUpdate(task.id, { status: newStatus });
  };

  const handleFormSubmit = (taskData: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at' | 'progress'>) => {
    if (editingTask) {
      onTaskUpdate(editingTask.id, taskData);
    } else {
      onTaskCreate(taskData);
    }
    setIsFormOpen(false);
    setEditingTask(null);
    onFormStateChange?.(false);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    onFormStateChange?.(false);
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(tasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkStatusUpdate = (status: PersonalTask['status']) => {
    selectedTasks.forEach(taskId => {
      onTaskUpdate(taskId, { status });
    });
    setSelectedTasks([]);
    toast({
      title: "بروزرسانی انجام شد",
      description: `وضعیت ${selectedTasks.length} وظیفه تغییر کرد.`,
    });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      open: true,
      title: 'حذف وظایف',
      description: `آیا از حذف ${selectedTasks.length} وظیفه اطمینان دارید؟`,
      onConfirm: () => {
        selectedTasks.forEach(taskId => {
          onTaskDelete(taskId);
        });
        setSelectedTasks([]);
        toast({
          title: "حذف انجام شد",
          description: `${selectedTasks.length} وظیفه حذف شد.`,
        });
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleSingleTaskDelete = (taskId: string) => {
    setConfirmDialog({
      open: true,
      title: 'حذف وظیفه',
      description: 'آیا از حذف این وظیفه اطمینان دارید؟',
      onConfirm: () => {
        onTaskDelete(taskId);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && tasks.find(t => t.due_date === dueDate)?.status !== 'completed';
  };

  return (
    <div className="space-y-6">
        {/* Filters */}
      <TaskFilters
        filter={filter}
        onFilterChange={onFilterChange}
        tasksCount={tasks.length}
        domain={domain}
      />

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="card-app-spacious bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-app-readable font-medium">
              {selectedTasks.length} وظیفه انتخاب شده
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('completed')}
                className="text-sm"
              >
                تکمیل همه
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('todo')}
                className="text-sm"
              >
                برگشت به انتظار
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="text-sm"
              >
                حذف همه
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedTasks.length === tasks.length && tasks.length > 0}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-app-readable font-medium">
              انتخاب همه ({tasks.length} وظیفه)
            </span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsQuickFormOpen(true)} size={isMobile ? "sm" : "default"}>
              <Plus className="h-4 w-4 ml-2" />
              {isMobile ? 'جدید' : 'وظیفه جدید'}
            </Button>
            {!isMobile && (
              <Button 
                variant="outline" 
                onClick={() => setIsFormOpen(true)}
                size="default"
              >
                <Edit className="h-4 w-4 ml-2" />
                فرم کامل
              </Button>
            )}
          </div>
        </div>

        {/* Tasks */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-app-subtitle text-lg">در حال بارگذاری...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 card-app-spacious">
            <div className="text-app-subtitle text-lg mb-4">هیچ وظیفه‌ای یافت نشد</div>
            <Button
              onClick={() => setIsQuickFormOpen(true)}
              className="btn-professional"
            >
              <Plus className="h-4 w-4 ml-2" />
              اولین وظیفه را اضافه کنید
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const StatusIcon = statusIcons[task.status];
              const isTaskOverdue = task.due_date && isOverdue(task.due_date);
              
              return (
                <div
                  key={task.id}
                  className={`card-app-spacious border-2 transition-all hover:shadow-md ${
                    isTaskOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  } ${
                    selectedTasks.includes(task.id) ? 'ring-2 ring-primary ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                      className="mt-2 data-[state=checked]:bg-primary"
                    />

                    {/* Status Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(task)}
                      className="mt-1 p-0 h-auto"
                    >
                      <StatusIcon 
                        className={`h-5 w-5 ${
                          task.status === 'completed' ? 'text-green-600' :
                          task.status === 'in_progress' ? 'text-yellow-600' :
                          'text-gray-400'
                        }`} 
                      />
                    </Button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className={`text-app-readable font-semibold text-lg mb-1 ${
                            task.status === 'completed' ? 'line-through text-gray-500' : ''
                          }`}>
                            {task.title}
                            {isTaskOverdue && (
                              <AlertCircle className="inline h-4 w-4 text-red-500 mr-2" />
                            )}
                          </h3>
                          
                          {task.description && (
                            <p className="text-app-subtitle text-base mb-2">{task.description}</p>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={priorityColors[task.priority]}>
                              {priorityLabels[task.priority]}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              {getCategoryDisplay(task)}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              {statusLabels[task.status]}
                            </Badge>
                            {task.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Progress */}
                          {task.progress > 0 && task.status !== 'completed' && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-app-subtitle mb-1">
                                <span>پیشرفت</span>
                                <span>{task.progress}%</span>
                              </div>
                              <Progress value={task.progress} className="h-2" />
                            </div>
                          )}

                          {/* Dates */}
                          <div className="flex flex-wrap gap-4 text-sm text-app-subtitle">
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className={isTaskOverdue ? 'text-red-600 font-medium' : ''}>
                                  سررسید: {new Date(task.due_date).toLocaleDateString('fa-IR')}
                                </span>
                              </div>
                            )}
                            <div>
                              ایجاد: {new Date(task.created_at).toLocaleDateString('fa-IR')}
                            </div>
                            {task.completed_at && (
                              <div>
                                تکمیل: {new Date(task.completed_at).toLocaleDateString('fa-IR')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mr-4">
                          {onOpenAIChat && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenAIChat('mentor', task)}
                                className="text-sm px-2 py-1 border-blue-200 hover:bg-blue-50"
                                title="منتور AI"
                              >
                                <Brain className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenAIChat('coach', task)}
                                className="text-sm px-2 py-1 border-green-200 hover:bg-green-50"
                                title="کوچ AI"
                              >
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(task)}
                            className="text-sm px-3 py-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleSingleTaskDelete(task.id)}
                             className="text-sm px-3 py-1 text-red-600 hover:text-red-700"
                           >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <QuickTaskForm 
        open={isQuickFormOpen}
        onOpenChange={setIsQuickFormOpen}
        onSubmit={onTaskCreate}
        domain={domain}
      />
      
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default TaskManager;