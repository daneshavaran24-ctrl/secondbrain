import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfessionalCompanyGoal, professionalGoalsService } from "@/services/professionalCompanyGoalsService";
import { PlusCircle, Trash2 } from "lucide-react";

interface CompanyGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  goal?: ProfessionalCompanyGoal;
  onSuccess: () => void;
}

export function CompanyGoalForm({ open, onOpenChange, companyId, goal, onSuccess }: CompanyGoalFormProps) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    goal_type: goal?.goal_type || 'short_term',
    status: goal?.status || 'planning',
    priority: goal?.priority || 'medium',
    target_date: goal?.target_date || '',
    responsible_person: goal?.responsible_person || '',
    budget: goal?.budget?.toString() || '',
    currency: goal?.currency || 'IRR',
    progress: goal?.progress || 0,
    roi_target: goal?.roi_target?.toString() || '',
    actual_roi: goal?.actual_roi?.toString() || '',
    market_strategy: goal?.market_strategy || '',
    competitive_advantage: goal?.competitive_advantage || '',
    notes: goal?.notes || '',
  });

  const [metrics, setMetrics] = useState<Array<{ metric: string; target: string; current?: string }>>(
    goal?.success_metrics || []
  );
  const [risks, setRisks] = useState<Array<{ risk: string; severity: string; mitigation: string }>>(
    goal?.risk_assessment || []
  );
  const [milestones, setMilestones] = useState<Array<{ title: string; date: string; completed: boolean }>>(
    goal?.milestones || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const goalData = {
      company_id: companyId,
      title: formData.title,
      description: formData.description,
      goal_type: formData.goal_type as any,
      status: formData.status as any,
      priority: formData.priority as any,
      target_date: formData.target_date || undefined,
      responsible_person: formData.responsible_person || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      currency: formData.currency,
      progress: formData.progress,
      roi_target: formData.roi_target ? parseFloat(formData.roi_target) : undefined,
      actual_roi: formData.actual_roi ? parseFloat(formData.actual_roi) : undefined,
      market_strategy: formData.market_strategy || undefined,
      competitive_advantage: formData.competitive_advantage || undefined,
      notes: formData.notes || undefined,
      success_metrics: metrics.length > 0 ? metrics : undefined,
      risk_assessment: risks.length > 0 ? risks : undefined,
      milestones: milestones.length > 0 ? milestones : undefined,
    };

    if (goal) {
      const success = await professionalGoalsService.updateGoal(goal.id, goalData);
      if (success) {
        onSuccess();
        onOpenChange(false);
      }
    } else {
      const newGoal = await professionalGoalsService.addGoal(goalData);
      if (newGoal) {
        onSuccess();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'ویرایش هدف' : 'افزودن هدف جدید'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">عنوان هدف *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">شرح</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="goal_type">نوع هدف *</Label>
              <Select value={formData.goal_type} onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}>
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

            <div>
              <Label htmlFor="status">وضعیت *</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">برنامه‌ریزی</SelectItem>
                  <SelectItem value="in_progress">در حال اجرا</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="on_hold">متوقف</SelectItem>
                  <SelectItem value="cancelled">لغو شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">اولویت *</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">پایین</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="critical">حیاتی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_date">تاریخ هدف</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="responsible_person">مسئول اجرا</Label>
              <Input
                id="responsible_person"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="progress">پیشرفت (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Financial Info */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">اطلاعات مالی</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">بودجه</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="currency">واحد پول</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IRR">ریال</SelectItem>
                    <SelectItem value="USD">دلار</SelectItem>
                    <SelectItem value="EUR">یورو</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="roi_target">ROI هدف (%)</Label>
                <Input
                  id="roi_target"
                  type="number"
                  value={formData.roi_target}
                  onChange={(e) => setFormData({ ...formData, roi_target: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="actual_roi">ROI واقعی (%)</Label>
                <Input
                  id="actual_roi"
                  type="number"
                  value={formData.actual_roi}
                  onChange={(e) => setFormData({ ...formData, actual_roi: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Strategy Info */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">استراتژی و رقابت</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="market_strategy">استراتژی بازار</Label>
                <Textarea
                  id="market_strategy"
                  value={formData.market_strategy}
                  onChange={(e) => setFormData({ ...formData, market_strategy: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="competitive_advantage">مزیت رقابتی</Label>
                <Textarea
                  id="competitive_advantage"
                  value={formData.competitive_advantage}
                  onChange={(e) => setFormData({ ...formData, competitive_advantage: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">معیارهای موفقیت</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMetrics([...metrics, { metric: '', target: '', current: '' }])}
              >
                <PlusCircle className="w-4 h-4 ml-2" />
                افزودن معیار
              </Button>
            </div>
            {metrics.map((metric, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                <Input
                  placeholder="معیار"
                  value={metric.metric}
                  onChange={(e) => {
                    const newMetrics = [...metrics];
                    newMetrics[index].metric = e.target.value;
                    setMetrics(newMetrics);
                  }}
                />
                <Input
                  placeholder="هدف"
                  value={metric.target}
                  onChange={(e) => {
                    const newMetrics = [...metrics];
                    newMetrics[index].target = e.target.value;
                    setMetrics(newMetrics);
                  }}
                />
                <Input
                  placeholder="وضعیت فعلی"
                  value={metric.current}
                  onChange={(e) => {
                    const newMetrics = [...metrics];
                    newMetrics[index].current = e.target.value;
                    setMetrics(newMetrics);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMetrics(metrics.filter((_, i) => i !== index))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">یادداشت‌ها</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit">
              {goal ? 'به‌روزرسانی' : 'افزودن'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
