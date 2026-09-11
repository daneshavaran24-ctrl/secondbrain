import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { strategyNotificationService } from '@/services/strategyNotificationService';

interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  weight: number;
}

interface OKRFormProps {
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  existingData?: any;
}

export function OKRForm({ organizationId, onSuccess, onCancel, existingData }: OKRFormProps) {
  const [objective, setObjective] = useState(existingData?.content?.objective || '');
  const [description, setDescription] = useState(existingData?.content?.description || '');
  const [quarter, setQuarter] = useState(existingData?.content?.quarter || 'Q1');
  const [year, setYear] = useState(existingData?.content?.year || new Date().getFullYear());
  const [owner, setOwner] = useState(existingData?.content?.owner || '');
  const [keyResults, setKeyResults] = useState<KeyResult[]>(
    existingData?.content?.keyResults || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addKeyResult = () => {
    setKeyResults([
      ...keyResults,
      {
        id: crypto.randomUUID(),
        title: '',
        target: 100,
        current: 0,
        unit: '%',
        weight: 25,
      },
    ]);
  };

  const removeKeyResult = (id: string) => {
    setKeyResults(keyResults.filter((kr) => kr.id !== id));
  };

  const updateKeyResult = (id: string, field: keyof KeyResult, value: any) => {
    setKeyResults(
      keyResults.map((kr) => (kr.id === id ? { ...kr, [field]: value } : kr))
    );
  };

  const calculateProgress = () => {
    if (keyResults.length === 0) return 0;
    const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedProgress = keyResults.reduce((sum, kr) => {
      const krProgress = (kr.current / kr.target) * 100;
      return sum + (krProgress * kr.weight) / totalWeight;
    }, 0);
    return Math.min(100, Math.round(weightedProgress));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || keyResults.length === 0) {
      toast.error('لطفاً هدف و حداقل یک نتیجه کلیدی وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      const progress = calculateProgress();
      const content = {
        objective,
        description,
        quarter,
        year,
        owner,
        keyResults,
        progress,
        status: progress >= 100 ? 'achieved' : progress > 0 ? 'active' : 'draft',
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
          title: objective,
          strategy_type: 'okr',
          content: content as any 
        })
        .select()
        .single();

      if (strategyError) throw strategyError;

      // Save key results
      if (keyResults.length > 0) {
        const { error: krError } = await supabase
          .from('organization_okr_key_results')
          .insert(
            keyResults.map((kr) => ({
              strategy_id: newStrategy.id,
              title: kr.title,
              target: kr.target,
              current_value: kr.current,
              unit: kr.unit,
              weight: kr.weight,
            }))
          );
        if (krError) throw krError;
      }

      toast.success('OKR با موفقیت ذخیره شد');
      
      // Send notification
      await strategyNotificationService.notifyOKRCreated(
        organizationId,
        objective,
        user.id
      );
      
      // If achieved, send achievement notification
      if (content.status === 'achieved') {
        await strategyNotificationService.notifyOKRAchieved(organizationId, objective);
      }
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در ذخیره OKR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = calculateProgress();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>هدف اصلی (Objective)</Label>
          <TextInputWithVoice
            value={objective}
            onChange={setObjective}
            placeholder="هدف اصلی خود را وارد کنید..."
            type="textarea"
            rows={2}
          />
        </div>

        <div>
          <Label>توضیحات</Label>
          <TextInputWithVoice
            value={description}
            onChange={setDescription}
            placeholder="توضیحات تکمیلی..."
            type="textarea"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>فصل</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1">Q1</SelectItem>
                <SelectItem value="Q2">Q2</SelectItem>
                <SelectItem value="Q3">Q3</SelectItem>
                <SelectItem value="Q4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>سال</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min={2020}
              max={2030}
            />
          </div>

          <div className="col-span-2">
            <Label>مسئول</Label>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="نام مسئول"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">نتایج کلیدی (Key Results)</Label>
          <Button type="button" onClick={addKeyResult} size="sm" variant="outline">
            <Plus className="h-4 w-4 ml-2" />
            افزودن KR
          </Button>
        </div>

        {keyResults.map((kr, index) => (
          <Card key={kr.id}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <Label>نتیجه کلیدی #{index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKeyResult(kr.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <TextInputWithVoice
                value={kr.title}
                onChange={(v) => updateKeyResult(kr.id, 'title', v)}
                placeholder="عنوان نتیجه کلیدی..."
                type="textarea"
                rows={2}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">مقدار هدف</Label>
                  <Input
                    type="number"
                    value={kr.target}
                    onChange={(e) =>
                      updateKeyResult(kr.id, 'target', parseFloat(e.target.value))
                    }
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs">مقدار فعلی</Label>
                  <Input
                    type="number"
                    value={kr.current}
                    onChange={(e) =>
                      updateKeyResult(kr.id, 'current', parseFloat(e.target.value))
                    }
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs">واحد</Label>
                  <Input
                    value={kr.unit}
                    onChange={(e) => updateKeyResult(kr.id, 'unit', e.target.value)}
                    placeholder="%، عدد، تومان"
                  />
                </div>
                <div>
                  <Label className="text-xs">وزن (%)</Label>
                  <Input
                    type="number"
                    value={kr.weight}
                    onChange={(e) =>
                      updateKeyResult(kr.id, 'weight', parseInt(e.target.value))
                    }
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>پیشرفت</span>
                  <span>{Math.round((kr.current / kr.target) * 100)}%</span>
                </div>
                <Progress value={(kr.current / kr.target) * 100} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {keyResults.length > 0 && (
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-lg">پیشرفت کلی OKR</Label>
                <span className="text-2xl font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            لغو
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'در حال ذخیره...' : existingData ? 'به‌روزرسانی OKR' : 'ذخیره OKR'}
        </Button>
      </div>
    </form>
  );
}
