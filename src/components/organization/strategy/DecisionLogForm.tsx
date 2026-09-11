import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { strategyNotificationService } from '@/services/strategyNotificationService';

interface Option {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  cost: string;
  timeEstimate: string;
  score: number;
}

interface DecisionLogFormProps {
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  existingData?: any;
}

const IMPACT_LEVELS = [
  { value: 'low', label: 'کم', color: 'bg-blue-500' },
  { value: 'medium', label: 'متوسط', color: 'bg-yellow-500' },
  { value: 'high', label: 'زیاد', color: 'bg-orange-500' },
  { value: 'critical', label: 'حیاتی', color: 'bg-red-500' },
];

export function DecisionLogForm({ organizationId, onSuccess, onCancel, existingData }: DecisionLogFormProps) {
  const [title, setTitle] = useState(existingData?.content?.title || '');
  const [context, setContext] = useState(existingData?.content?.context || '');
  const [rationale, setRationale] = useState(existingData?.content?.rationale || '');
  const [chosenOption, setChosenOption] = useState(existingData?.content?.chosenOption || '');
  const [decisionMakers, setDecisionMakers] = useState(existingData?.content?.decisionMakers || '');
  const [impact, setImpact] = useState(existingData?.content?.impact || 'medium');
  const [options, setOptions] = useState<Option[]>(existingData?.content?.options || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    setOptions([
      ...options,
      {
        id: crypto.randomUUID(),
        title: '',
        pros: [],
        cons: [],
        cost: '',
        timeEstimate: '',
        score: 50,
      },
    ]);
  };

  const removeOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, field: keyof Option, value: any) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const addPro = (optionId: string) => {
    updateOption(optionId, 'pros', [
      ...options.find((o) => o.id === optionId)!.pros,
      '',
    ]);
  };

  const updatePro = (optionId: string, index: number, value: string) => {
    const option = options.find((o) => o.id === optionId)!;
    const newPros = [...option.pros];
    newPros[index] = value;
    updateOption(optionId, 'pros', newPros);
  };

  const removePro = (optionId: string, index: number) => {
    const option = options.find((o) => o.id === optionId)!;
    updateOption(
      optionId,
      'pros',
      option.pros.filter((_, i) => i !== index)
    );
  };

  const addCon = (optionId: string) => {
    updateOption(optionId, 'cons', [
      ...options.find((o) => o.id === optionId)!.cons,
      '',
    ]);
  };

  const updateCon = (optionId: string, index: number, value: string) => {
    const option = options.find((o) => o.id === optionId)!;
    const newCons = [...option.cons];
    newCons[index] = value;
    updateOption(optionId, 'cons', newCons);
  };

  const removeCon = (optionId: string, index: number) => {
    const option = options.find((o) => o.id === optionId)!;
    updateOption(
      optionId,
      'cons',
      option.cons.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || options.length === 0) {
      toast.error('لطفاً عنوان و حداقل یک گزینه وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      const content = {
        type: 'decision_log',
        title,
        context,
        rationale,
        chosenOption,
        decisionMakers: decisionMakers.split(',').map((s) => s.trim()),
        impact,
        options,
        date: new Date().toISOString(),
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('کاربر وارد نشده است');
        return;
      }

      const { data: newStrategy, error: strategyError } = await supabase
        .from('organization_strategies')
        .insert({ 
          organization_id: organizationId,
          user_id: user.id,
          title: title,
          strategy_type: 'decision_log',
          content: content as any 
        })
        .select()
        .single();

      if (strategyError) throw strategyError;

      // Save options
      if (options.length > 0) {
        const { error: optError } = await supabase
          .from('organization_decision_options')
          .insert(
            options.map((o) => ({
              strategy_id: newStrategy.id,
              title: o.title,
              pros: o.pros,
              cons: o.cons,
              cost: o.cost,
              time_estimate: o.timeEstimate,
              score: o.score,
            }))
          );
        if (optError) throw optError;
      }

      toast.success('لاگ تصمیم با موفقیت ذخیره شد');
      
      // Send notification
      const impactLabels = {
        low: 'کم',
        medium: 'متوسط',
        high: 'زیاد',
        critical: 'حیاتی'
      };
      
      await strategyNotificationService.notifyNewDecision(
        organizationId,
        title,
        impactLabels[impact as keyof typeof impactLabels],
        user.id
      );
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در ذخیره لاگ تصمیم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>عنوان تصمیم</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان تصمیم..."
          />
        </div>

        <div>
          <Label>زمینه و شرایط تصمیم</Label>
          <TextInputWithVoice
            value={context}
            onChange={setContext}
            placeholder="شرایط و زمینه‌ای که تصمیم در آن گرفته می‌شود..."
            type="textarea"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>تصمیم‌گیرندگان (جدا شده با ,)</Label>
            <Input
              value={decisionMakers}
              onChange={(e) => setDecisionMakers(e.target.value)}
              placeholder="نام1، نام2، نام3"
            />
          </div>
          <div>
            <Label>تأثیر تصمیم</Label>
            <Select value={impact} onValueChange={setImpact}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPACT_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${level.color}`} />
                      {level.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">گزینه‌های بررسی شده</Label>
          <Button type="button" onClick={addOption} size="sm" variant="outline">
            <Plus className="h-4 w-4 ml-2" />
            افزودن گزینه
          </Button>
        </div>

        {options.map((option, index) => (
          <Card key={option.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">گزینه #{index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={option.title}
                onChange={(e) => updateOption(option.id, 'title', e.target.value)}
                placeholder="عنوان گزینه..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      مزایا
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => addPro(option.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {option.pros.map((pro, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={pro}
                        onChange={(e) => updatePro(option.id, i, e.target.value)}
                        placeholder="مزیت..."
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removePro(option.id, i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      معایب
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => addCon(option.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {option.cons.map((con, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={con}
                        onChange={(e) => updateCon(option.id, i, e.target.value)}
                        placeholder="معایب..."
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCon(option.id, i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">هزینه</Label>
                  <Input
                    value={option.cost}
                    onChange={(e) => updateOption(option.id, 'cost', e.target.value)}
                    placeholder="هزینه تقریبی..."
                  />
                </div>
                <div>
                  <Label className="text-xs">زمان تخمینی</Label>
                  <Input
                    value={option.timeEstimate}
                    onChange={(e) =>
                      updateOption(option.id, 'timeEstimate', e.target.value)
                    }
                    placeholder="مثلاً 2 ماه"
                  />
                </div>
                <div>
                  <Label className="text-xs">امتیاز ({option.score})</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={option.score}
                    onChange={(e) =>
                      updateOption(option.id, 'score', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {options.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label>گزینه انتخاب شده</Label>
            <Select value={chosenOption} onValueChange={setChosenOption}>
              <SelectTrigger>
                <SelectValue placeholder="گزینه نهایی را انتخاب کنید..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.title}>
                    {opt.title || `گزینه ${options.indexOf(opt) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>دلیل انتخاب</Label>
            <TextInputWithVoice
              value={rationale}
              onChange={setRationale}
              placeholder="چرا این گزینه انتخاب شد؟ دلایل و توجیهات..."
              type="textarea"
              rows={4}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            لغو
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'در حال ذخیره...' : existingData ? 'به‌روزرسانی لاگ تصمیم' : 'ذخیره لاگ تصمیم'}
        </Button>
      </div>
    </form>
  );
}
