import { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PositionGoal, SuccessionServiceAPI } from "@/services/successionServiceTypes";

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: PositionGoal;
  organizationId?: string;
  positionId?: string;
  service: SuccessionServiceAPI;
  onSuccess: () => void;
}

export function GoalForm({ open, onOpenChange, goal, organizationId, positionId, service, onSuccess }: GoalFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PositionGoal>>({
    goal_type: 'short_term',
    status: 'planning',
    priority: 'medium',
    progress: 0,
    currency: 'IRR',
    ...goal
  });

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    } else {
      setFormData({
        goal_type: 'short_term',
        status: 'planning',
        priority: 'medium',
        progress: 0,
        currency: 'IRR',
        position_id: positionId,
        organization_id: organizationId
      });
    }
  }, [goal, positionId, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (goal?.id) {
        await service.updatePositionGoal(goal.id, formData);
        toast.success("هدف با موفقیت بروزرسانی شد");
      } else {
        await service.createPositionGoal({
          ...formData,
          organization_id: organizationId,
          position_id: positionId,
        } as Omit<PositionGoal, 'id' | 'created_at' | 'updated_at'>);
        toast.success("هدف با موفقیت ایجاد شد");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error("خطا در ذخیره هدف");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
        انصراف
      </Button>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "در حال ذخیره..." : goal?.id ? "بروزرسانی" : "ایجاد"}
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={goal?.id ? "ویرایش هدف" : "ایجاد هدف جدید"}
      description={goal?.id ? "ویرایش اطلاعات هدف" : "تعریف هدف جدید برای سمت"}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal_type">نوع هدف</Label>
          <Select
            value={formData.goal_type}
            onValueChange={(value) => setFormData({ ...formData, goal_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_term">کوتاه‌مدت (۳-۶ ماه)</SelectItem>
              <SelectItem value="long_term">بلندمدت (۱-۳ سال)</SelectItem>
              <SelectItem value="strategic">استراتژیک (۳+ سال)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">عنوان هدف *</Label>
          <Input
            id="title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: توسعه مهارت‌های رهبری"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">شرح هدف</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="توضیحات تکمیلی هدف..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">برنامه‌ریزی</SelectItem>
                <SelectItem value="in_progress">در حال اجرا</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">اولویت</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">پایین</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
                <SelectItem value="critical">بحرانی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_date">تاریخ هدف</Label>
          <Input
            type="date"
            value={formData.target_date || ''}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsible_person">مسئول اجرا</Label>
          <Input
            id="responsible_person"
            value={formData.responsible_person || ''}
            onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
            placeholder="نام مسئول اجرای هدف"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">بودجه</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">پیشرفت (%)</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress || 0}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">یادداشت‌ها</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="یادداشت‌های تکمیلی..."
            rows={2}
          />
        </div>
      </form>
    </ResponsiveDialog>
  );
}
