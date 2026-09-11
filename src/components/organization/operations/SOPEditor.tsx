import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SOPStep {
  id: string;
  number: string;
  title: string;
  description: string;
  responsible: string;
  duration: string;
  warning?: string;
}

interface SOPEditorProps {
  organizationId?: string;
  onSuccess?: () => void;
  existingData?: any;
}

export function SOPEditor({ organizationId, onSuccess, existingData }: SOPEditorProps) {
  const [title, setTitle] = useState(existingData?.content?.title || '');
  const [code, setCode] = useState(existingData?.content?.code || '');
  const [version, setVersion] = useState(existingData?.content?.version || '1.0');
  const [category, setCategory] = useState(existingData?.content?.category || '');
  const [purpose, setPurpose] = useState(existingData?.content?.purpose || '');
  const [scope, setScope] = useState(existingData?.content?.scope || '');
  const [steps, setSteps] = useState<SOPStep[]>(existingData?.content?.steps || []);
  const [status, setStatus] = useState(existingData?.content?.status || 'draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: crypto.randomUUID(),
        number: `${steps.length + 1}`,
        title: '',
        description: '',
        responsible: '',
        duration: '',
        warning: '',
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
    // Renumber steps
    const newSteps = steps.filter((s) => s.id !== id);
    newSteps.forEach((step, index) => {
      step.number = `${index + 1}`;
    });
    setSteps(newSteps);
  };

  const updateStep = (id: string, field: keyof SOPStep, value: any) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || steps.length === 0) {
      toast.error('لطفاً عنوان و حداقل یک مرحله وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      const content = {
        type: 'sop',
        title,
        code,
        version,
        category,
        purpose,
        scope,
        steps,
        status,
        updatedAt: new Date().toISOString(),
      };

      if (!organizationId) {
        toast.error('شناسه سازمان یافت نشد');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('کاربر وارد نشده است');
        return;
      }

      const { data: newOp, error: opError } = await supabase
        .from('organization_operations')
        .insert({ 
          organization_id: organizationId,
          user_id: user.id,
          title: title,
          operation_type: 'sop',
          content: content as any 
        })
        .select()
        .single();

      if (opError) throw opError;

      // Save steps
      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('organization_sop_steps')
          .insert(
            steps.map((s) => ({
              operations_id: newOp.id,
              step_number: s.number,
              title: s.title,
              description: s.description,
              responsible: s.responsible,
              duration: s.duration,
              warning: s.warning,
            }))
          );
        if (stepsError) throw stepsError;
      }

      toast.success('SOP با موفقیت ذخیره شد');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در ذخیره SOP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>کد SOP</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SOP-001" />
        </div>
        <div>
          <Label>نسخه</Label>
          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0"
          />
        </div>
        <div>
          <Label>وضعیت</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">پیش‌نویس</SelectItem>
              <SelectItem value="review">در حال بررسی</SelectItem>
              <SelectItem value="approved">تأیید شده</SelectItem>
              <SelectItem value="obsolete">منسوخ شده</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>عنوان SOP</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان رویه..."
        />
      </div>

      <div>
        <Label>دسته‌بندی</Label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="مثلاً: فرآیندهای عملیاتی، مالی، منابع انسانی"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>هدف</Label>
          <TextInputWithVoice
            value={purpose}
            onChange={setPurpose}
            placeholder="هدف از این رویه چیست؟"
            type="textarea"
            rows={3}
          />
        </div>
        <div>
          <Label>محدوده</Label>
          <TextInputWithVoice
            value={scope}
            onChange={setScope}
            placeholder="این رویه شامل چه مواردی می‌شود؟"
            type="textarea"
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">مراحل (Procedure)</Label>
          <Button type="button" onClick={addStep} size="sm" variant="outline">
            <Plus className="h-4 w-4 ml-2" />
            افزودن مرحله
          </Button>
        </div>

        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">مرحله {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(step.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">عنوان مرحله</Label>
                <Input
                  value={step.title}
                  onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                  placeholder="عنوان..."
                />
              </div>

              <div>
                <Label className="text-xs">شرح مرحله</Label>
                <TextInputWithVoice
                  value={step.description}
                  onChange={(v) => updateStep(step.id, 'description', v)}
                  placeholder="شرح کامل مرحله..."
                  type="textarea"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">مسئول</Label>
                  <Input
                    value={step.responsible}
                    onChange={(e) => updateStep(step.id, 'responsible', e.target.value)}
                    placeholder="نام مسئول"
                  />
                </div>
                <div>
                  <Label className="text-xs">مدت زمان</Label>
                  <Input
                    value={step.duration}
                    onChange={(e) => updateStep(step.id, 'duration', e.target.value)}
                    placeholder="مثلاً 30 دقیقه"
                  />
                </div>
              </div>

              {step.warning && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <Label className="text-xs text-yellow-600 dark:text-yellow-400">
                        هشدار
                      </Label>
                      <TextInputWithVoice
                        value={step.warning}
                        onChange={(v) => updateStep(step.id, 'warning', v)}
                        placeholder="نکات ایمنی یا هشدارها..."
                        type="textarea"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!step.warning && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateStep(step.id, 'warning', '')}
                >
                  <AlertTriangle className="h-3 w-3 ml-2" />
                  افزودن هشدار
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'در حال ذخیره...' : 'ذخیره SOP'}
        </Button>
      </div>
    </form>
  );
}
