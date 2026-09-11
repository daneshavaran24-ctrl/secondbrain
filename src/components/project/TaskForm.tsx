import React, { useState } from 'react';
import { ProjectTask, ProjectMember, Priority, TaskStatus, NotificationMethod } from '@/types';
import { projectManagementService } from '@/services/projectManagementService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Plus, User, Clock, Bell, Flag, Tag, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { convertGregorianToJalali, convertJalaliToGregorian } from '@/lib/date-utils';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: ProjectTask | null;
  initialStatus?: TaskStatus;
  onSuccess: () => void;
}

const priorityOptions = [
  { value: 'low', label: 'کم', color: 'bg-gray-500/10 text-gray-700' },
  { value: 'medium', label: 'متوسط', color: 'bg-yellow-500/10 text-yellow-700' },
  { value: 'high', label: 'بالا', color: 'bg-orange-500/10 text-orange-700' },
  { value: 'urgent', label: 'فوری', color: 'bg-red-500/10 text-red-700' }
];

const statusOptions = [
  { value: 'pending', label: 'در انتظار' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'blocked', label: 'مسدود شده' }
];

const notificationOptions = [
  { value: 'email', label: 'ایمیل', icon: '📧' },
  { value: 'sms', label: 'پیامک', icon: '📱' },
  { value: 'secretary', label: 'منشی', icon: '👩‍💼' }
];

export function TaskForm({ open, onOpenChange, projectId, task, initialStatus, onSuccess }: TaskFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [members] = useState<ProjectMember[]>(projectManagementService.getMembers());
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedToId: task?.assigneeId || '',
    priority: (task?.priority || 'medium') as Priority,
    status: (task?.status || initialStatus || 'pending') as TaskStatus,
    deadline: task?.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
    notificationMethod: (task?.notificationMethod || 'email') as NotificationMethod,
    estimatedHours: task?.estimatedHours || undefined,
    tags: task?.tags || [],
    story_points: task?.story_points || undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.assignedToId || !formData.deadline) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const assignedMember = members.find(m => m.id === formData.assignedToId);
      if (!assignedMember) throw new Error('عضو انتخاب شده یافت نشد');

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigneeId: formData.assignedToId,
        priority: formData.priority,
        status: formData.status,
        deadline: new Date(formData.deadline).toISOString(),
        notificationMethod: formData.notificationMethod,
        estimatedHours: formData.estimatedHours,
        tags: formData.tags,
        story_points: formData.story_points,
        projectId
      };

      if (task) {
        // Update existing task
        const updatedTask = projectManagementService.updateTask(task.id, taskData);
        if (updatedTask) {
          toast({
            title: "موفقیت",
            description: "وظیفه با موفقیت به‌روزرسانی شد"
          });
        }
      } else {
        // Create new task
        const newTask = projectManagementService.createTask(taskData);
        if (newTask) {
          toast({
            title: "موفقیت", 
            description: "وظیفه جدید با موفقیت ایجاد شد"
          });
        }
      }
      
      onSuccess();
      onOpenChange(false);
      resetForm();
      
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطایی در ذخیره وظیفه رخ داد",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedToId: '',
      priority: 'medium',
      status: 'pending',
      deadline: '',
      notificationMethod: 'email',
      estimatedHours: undefined,
      tags: [],
      story_points: undefined
    });
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.currentTarget === e.target) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-right pr-8">
            <Flag className="h-5 w-5 text-primary" />
            {task ? 'ویرایش وظیفه' : 'ایجاد وظیفه جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان وظیفه *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان وظیفه را وارد کنید..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="توضیحات تکمیلی وظیفه..."
              rows={3}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>تخصیص به *</Label>
            <Select 
              value={formData.assignedToId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کنید..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اولویت</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: Priority) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <Badge className={option.color}>
                        {option.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>وضعیت</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: TaskStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline, Estimated Hours, and Story Points */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">ددلاین *</Label>
              <PersianDatePicker
                value={formData.deadline ? new Date(formData.deadline) : null}
                onChange={(date) => {
                  const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                  setFormData(prev => ({ ...prev, deadline: gregorianDate }));
                }}
                placeholder="تاریخ ددلاین را انتخاب کنید"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">تخمین زمان (ساعت)</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimatedHours || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="مثال: 8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="story_points" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-tech-cyan" />
                امتیاز داستان
              </Label>
              <Select 
                value={formData.story_points?.toString() || undefined} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  story_points: value ? parseInt(value) : undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="بدون امتیاز - انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - بسیار آسان</SelectItem>
                  <SelectItem value="2">2 - آسان</SelectItem>
                  <SelectItem value="3">3 - متوسط</SelectItem>
                  <SelectItem value="5">5 - متوسط به بالا</SelectItem>
                  <SelectItem value="8">8 - سخت</SelectItem>
                  <SelectItem value="13">13 - بسیار سخت</SelectItem>
                  <SelectItem value="21">21 - پیچیده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notification Method */}
          <div className="space-y-2">
            <Label>روش اطلاع‌رسانی</Label>
            <Select 
              value={formData.notificationMethod} 
              onValueChange={(value: NotificationMethod) => setFormData(prev => ({ ...prev, notificationMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>برچسب‌ها</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="برچسب جدید..."
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'در حال ذخیره...' : task ? 'به‌روزرسانی' : 'ایجاد وظیفه'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}