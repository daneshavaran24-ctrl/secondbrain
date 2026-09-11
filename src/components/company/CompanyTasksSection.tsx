import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { companyService, CompanyTask } from '@/services/companyService';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TasksSectionProps {
  companyId: string;
}

const CATEGORIES = [
  { value: 'marketing', label: 'بازاریابی' },
  { value: 'operations', label: 'عملیات' },
  { value: 'finance', label: 'مالی' },
  { value: 'hr', label: 'منابع انسانی' },
  { value: 'sales', label: 'فروش' },
  { value: 'tech', label: 'فنی' },
];

const PRIORITIES = [
  { value: 'low', label: 'کم', color: 'bg-gray-500' },
  { value: 'medium', label: 'متوسط', color: 'bg-blue-500' },
  { value: 'high', label: 'زیاد', color: 'bg-orange-500' },
  { value: 'urgent', label: 'فوری', color: 'bg-red-500' },
];

const STATUSES = [
  { value: 'pending', label: 'در انتظار', icon: Clock },
  { value: 'in_progress', label: 'در حال انجام', icon: AlertCircle },
  { value: 'completed', label: 'تکمیل شده', icon: CheckCircle2 },
  { value: 'cancelled', label: 'لغو شده', icon: Clock },
];

export function CompanyTasksSection({ companyId }: TasksSectionProps) {
  const [tasks, setTasks] = useState<CompanyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CompanyTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<CompanyTask>>({
    title: '',
    description: '',
    category: 'marketing',
    priority: 'medium',
    status: 'pending',
  });

  useEffect(() => {
    loadTasks();
  }, [companyId, filterStatus, filterCategory]);

  const loadTasks = async () => {
    setIsLoading(true);
    const filters: any = {};
    if (filterStatus !== 'all') filters.status = filterStatus;
    if (filterCategory !== 'all') filters.category = filterCategory;
    
    const data = await companyService.getTasks(companyId, filters);
    setTasks(data);
    setIsLoading(false);
  };

  const handleOpenDialog = (task?: CompanyTask) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        category: 'marketing',
        priority: 'medium',
        status: 'pending',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('عنوان وظیفه الزامی است');
      return;
    }

    if (editingTask) {
      const success = await companyService.updateTask(editingTask.id, formData);
      if (success) {
        toast.success('وظیفه با موفقیت بروزرسانی شد');
        setIsDialogOpen(false);
        loadTasks();
      } else {
        toast.error('خطا در بروزرسانی وظیفه');
      }
    } else {
      const task = await companyService.createTask(companyId, formData);
      if (task) {
        toast.success('وظیفه با موفقیت ایجاد شد');
        setIsDialogOpen(false);
        loadTasks();
      } else {
        toast.error('خطا در ایجاد وظیفه');
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('آیا از حذف این وظیفه اطمینان دارید؟')) {
      const success = await companyService.deleteTask(taskId);
      if (success) {
        toast.success('وظیفه با موفقیت حذف شد');
        loadTasks();
      } else {
        toast.error('خطا در حذف وظیفه');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const statusObj = STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.icon : Clock;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>وظایف و پروژه‌ها</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                وظیفه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'ویرایش وظیفه' : 'وظیفه جدید'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>عنوان *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان وظیفه"
                  />
                </div>

                <div className="space-y-2">
                  <Label>توضیحات</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="توضیحات وظیفه"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>دسته‌بندی</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>اولویت</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>وضعیت</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>تاریخ سررسید</Label>
                    <Input
                      type="date"
                      value={formData.due_date || ''}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>تخصیص به</Label>
                  <Input
                    value={formData.assigned_to || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    placeholder="نام فرد مسئول"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button onClick={handleSave}>ذخیره</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="همه وضعیت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="همه دسته‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">هیچ وظیفه‌ای یافت نشد</p>
            ) : (
              tasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status);
                return (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                          {PRIORITIES.find(p => p.value === task.priority)?.label}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>دسته: {CATEGORIES.find(c => c.value === task.category)?.label}</span>
                        <span>وضعیت: {STATUSES.find(s => s.value === task.status)?.label}</span>
                        {task.due_date && <span>سررسید: {new Date(task.due_date).toLocaleDateString('fa-IR')}</span>}
                        {task.assigned_to && <span>مسئول: {task.assigned_to}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(task)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
