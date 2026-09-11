import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import {
  createPerformanceEvaluation,
  updatePerformanceEvaluation,
  type PerformanceEvaluation,
  type Employee,
} from '@/services/hrService';

interface PerformanceFormProps {
  organizationId: string;
  employees: Employee[];
  evaluation: PerformanceEvaluation | null;
  onClose: () => void;
}

export function PerformanceForm({ organizationId, employees, evaluation, onClose }: PerformanceFormProps) {
  const [formData, setFormData] = useState({
    employee_id: evaluation?.employee_id || '',
    evaluator_name: evaluation?.evaluator_name || '',
    evaluation_period: evaluation?.evaluation_period || '',
    evaluation_date: evaluation?.evaluation_date || new Date().toISOString().split('T')[0],
    performance_score: evaluation?.performance_score || 3,
    goals_achieved: evaluation?.goals_achieved || 50,
    strengths: evaluation?.strengths || [],
    areas_for_improvement: evaluation?.areas_for_improvement || [],
    goals_for_next_period: evaluation?.goals_for_next_period || [],
    feedback: evaluation?.feedback || '',
    employee_comments: evaluation?.employee_comments || '',
    status: evaluation?.status || 'draft',
  });
  const [strengthInput, setStrengthInput] = useState('');
  const [improvementInput, setImprovementInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.evaluator_name.trim()) {
      toast({
        title: 'خطا',
        description: 'کارمند و نام ارزیابی‌کننده الزامی است',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const evaluationData = {
        organization_id: organizationId,
        employee_id: formData.employee_id,
        evaluator_name: formData.evaluator_name,
        evaluation_period: formData.evaluation_period,
        evaluation_date: formData.evaluation_date,
        performance_score: formData.performance_score,
        goals_achieved: formData.goals_achieved,
        strengths: formData.strengths.length > 0 ? formData.strengths : undefined,
        areas_for_improvement: formData.areas_for_improvement.length > 0 ? formData.areas_for_improvement : undefined,
        goals_for_next_period: formData.goals_for_next_period.length > 0 ? formData.goals_for_next_period : undefined,
        feedback: formData.feedback || undefined,
        employee_comments: formData.employee_comments || undefined,
        status: formData.status,
      };

      if (evaluation) {
        await updatePerformanceEvaluation(evaluation.id, evaluationData);
        toast({
          title: 'موفق',
          description: 'ارزیابی با موفقیت بروزرسانی شد',
        });
      } else {
        await createPerformanceEvaluation(evaluationData);
        toast({
          title: 'موفق',
          description: 'ارزیابی با موفقیت ثبت شد',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast({
        title: 'خطا',
        description: 'ذخیره ارزیابی با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStrength = () => {
    if (strengthInput.trim()) {
      setFormData({
        ...formData,
        strengths: [...formData.strengths, strengthInput.trim()],
      });
      setStrengthInput('');
    }
  };

  const removeStrength = (index: number) => {
    setFormData({
      ...formData,
      strengths: formData.strengths.filter((_, i) => i !== index),
    });
  };

  const addImprovement = () => {
    if (improvementInput.trim()) {
      setFormData({
        ...formData,
        areas_for_improvement: [...formData.areas_for_improvement, improvementInput.trim()],
      });
      setImprovementInput('');
    }
  };

  const removeImprovement = (index: number) => {
    setFormData({
      ...formData,
      areas_for_improvement: formData.areas_for_improvement.filter((_, i) => i !== index),
    });
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      setFormData({
        ...formData,
        goals_for_next_period: [...formData.goals_for_next_period, goalInput.trim()],
      });
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals_for_next_period: formData.goals_for_next_period.filter((_, i) => i !== index),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <CardTitle>{evaluation ? 'ویرایش ارزیابی' : 'ارزیابی جدید'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">کارمند *</Label>
              <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کارمند" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} {emp.position && `- ${emp.position}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluator_name">نام ارزیابی‌کننده *</Label>
              <Input
                id="evaluator_name"
                value={formData.evaluator_name}
                onChange={(e) => setFormData({ ...formData, evaluator_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluation_period">دوره ارزیابی</Label>
              <Input
                id="evaluation_period"
                placeholder="مثال: Q4-1403"
                value={formData.evaluation_period}
                onChange={(e) => setFormData({ ...formData, evaluation_period: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluation_date">تاریخ ارزیابی</Label>
              <Input
                id="evaluation_date"
                type="date"
                value={formData.evaluation_date}
                onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>امتیاز عملکرد: {formData.performance_score}/5</Label>
            <Slider
              value={[formData.performance_score]}
              onValueChange={([value]) => setFormData({ ...formData, performance_score: value })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>تحقق اهداف: {formData.goals_achieved}%</Label>
            <Slider
              value={[formData.goals_achieved]}
              onValueChange={([value]) => setFormData({ ...formData, goals_achieved: value })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>نقاط قوت</Label>
            <div className="flex gap-2">
              <Input
                value={strengthInput}
                onChange={(e) => setStrengthInput(e.target.value)}
                placeholder="نقطه قوت را وارد کنید..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrength())}
              />
              <Button type="button" onClick={addStrength}>افزودن</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                  <span className="text-sm">{strength}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStrength(index)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>نقاط ضعف / نیاز به بهبود</Label>
            <div className="flex gap-2">
              <Input
                value={improvementInput}
                onChange={(e) => setImprovementInput(e.target.value)}
                placeholder="نقطه ضعف را وارد کنید..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImprovement())}
              />
              <Button type="button" onClick={addImprovement}>افزودن</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.areas_for_improvement.map((area, index) => (
                <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                  <span className="text-sm">{area}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImprovement(index)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>اهداف دوره بعد</Label>
            <div className="flex gap-2">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="هدف را وارد کنید..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
              />
              <Button type="button" onClick={addGoal}>افزودن</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.goals_for_next_period.map((goal, index) => (
                <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                  <span className="text-sm">{goal}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(index)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">بازخورد کلی</Label>
            <Textarea
              id="feedback"
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={4}
              placeholder="توضیحات کامل در مورد عملکرد کارمند..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_comments">نظر کارمند</Label>
            <Textarea
              id="employee_comments"
              value={formData.employee_comments}
              onChange={(e) => setFormData({ ...formData, employee_comments: e.target.value })}
              rows={3}
              placeholder="نظرات کارمند در مورد ارزیابی..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">پیش‌نویس</SelectItem>
                <SelectItem value="submitted">ارسال شده</SelectItem>
                <SelectItem value="approved">تأیید شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
