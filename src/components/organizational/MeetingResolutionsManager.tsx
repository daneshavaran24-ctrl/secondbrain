import React, { useState } from 'react';
import { Meeting, MeetingResolution, ResponsibleParty, ResolutionActivity, ResolutionComment, ResolutionReminder } from '@/types';
import { Plus, Edit, Trash2, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';

interface MeetingResolutionsManagerProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MeetingResolutionsManager: React.FC<MeetingResolutionsManagerProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResolution, setEditingResolution] = useState<MeetingResolution | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as MeetingResolution['status'],
    priority: 'medium' as MeetingResolution['priority'],
    responsible_party: '',
    responsible_parties: [] as ResponsibleParty[],
    activity_log: [] as ResolutionActivity[],
    comments: [] as ResolutionComment[],
    reminders: [] as ResolutionReminder[],
    auto_create_task: false,
    due_date: ''
  });
  
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      responsible_party: '',
      responsible_parties: [],
      activity_log: [],
      comments: [],
      reminders: [],
      auto_create_task: false,
      due_date: ''
    });
  };

  const handleAddResolution = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'خطا',
        description: 'عنوان مصوبه الزامی است',
        variant: 'destructive'
      });
      return;
    }

    try {
      await meetingService.addResolution(meeting.id, formData);
      onUpdate();
      setIsAddModalOpen(false);
      resetForm();
      toast({
        title: 'موفقیت',
        description: 'مصوبه جدید اضافه شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در افزودن مصوبه',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateResolution = async () => {
    if (!editingResolution) return;

    try {
      await meetingService.updateResolution(meeting.id, editingResolution.id, formData);
      onUpdate();
      setEditingResolution(null);
      resetForm();
      toast({
        title: 'موفقیت',
        description: 'مصوبه به‌روزرسانی شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی مصوبه',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteResolution = async (resolutionId: string) => {
    try {
      await meetingService.deleteResolution(meeting.id, resolutionId);
      onUpdate();
      toast({
        title: 'موفقیت',
        description: 'مصوبه حذف شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف مصوبه',
        variant: 'destructive'
      });
    }
  };

  const openEditModal = (resolution: MeetingResolution) => {
    setEditingResolution(resolution);
    setFormData({
      title: resolution.title,
      description: resolution.description,
      status: resolution.status,
      priority: resolution.priority,
      responsible_party: resolution.responsible_party,
      responsible_parties: resolution.responsible_parties || [],
      activity_log: resolution.activity_log || [],
      comments: resolution.comments || [],
      reminders: resolution.reminders || [],
      auto_create_task: resolution.auto_create_task || false,
      due_date: resolution.due_date || ''
    });
  };

  const getStatusBadge = (status: MeetingResolution['status']) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      under_review: 'outline'
    } as const;

    const labels = {
      pending: 'در انتظار',
      approved: 'تایید شده',
      rejected: 'رد شده',
      under_review: 'در حال بررسی'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityIcon = (priority: MeetingResolution['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={onClose}
        title="مدیریت مصوبات"
        description={`مدیریت مصوبات جلسه: ${meeting.title}`}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              تعداد مصوبات: {meeting.resolutions.length}
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              افزودن مصوبه
            </Button>
          </div>

          {meeting.resolutions.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عنوان</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">اولویت</TableHead>
                    <TableHead className="text-right">مسئول</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meeting.resolutions.map((resolution) => (
                    <TableRow key={resolution.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{resolution.title}</div>
                          {resolution.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {resolution.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(resolution.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(resolution.priority)}
                          <span className="text-sm">
                            {resolution.priority === 'high' ? 'بالا' : 
                             resolution.priority === 'medium' ? 'متوسط' : 'پایین'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{resolution.responsible_party}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(resolution)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteResolution(resolution.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              هیچ مصوبه‌ای ثبت نشده است
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      {/* Add/Edit Resolution Modal */}
      <ResponsiveDialog
        open={isAddModalOpen || editingResolution !== null}
        onOpenChange={() => {
          setIsAddModalOpen(false);
          setEditingResolution(null);
          resetForm();
        }}
        title={editingResolution ? 'ویرایش مصوبه' : 'افزودن مصوبه جدید'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان مصوبه</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان مصوبه را وارد کنید"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">شرح مصوبه</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="شرح کامل مصوبه را وارد کنید"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>وضعیت</Label>
              <Select
                value={formData.status}
                onValueChange={(value: MeetingResolution['status']) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="approved">تایید شده</SelectItem>
                  <SelectItem value="rejected">رد شده</SelectItem>
                  <SelectItem value="under_review">در حال بررسی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>اولویت</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: MeetingResolution['priority']) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">پایین</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">مسئول اجرا</Label>
            <Input
              id="responsible"
              value={formData.responsible_party}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible_party: e.target.value }))}
              placeholder="نام مسئول اجرای مصوبه"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">مهلت اجرا</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingResolution(null);
                resetForm();
              }}
            >
              انصراف
            </Button>
            <Button
              onClick={editingResolution ? handleUpdateResolution : handleAddResolution}
            >
              {editingResolution ? 'به‌روزرسانی' : 'افزودن'}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
};