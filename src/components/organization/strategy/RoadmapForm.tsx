import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Trash2, Circle, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns-jalali';
import { strategyNotificationService } from '@/services/strategyNotificationService';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  owner: string;
  deliverables: string[];
}

interface RoadmapFormProps {
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  existingData?: any;
}

const STATUS_CONFIG = {
  pending: { label: 'در انتظار', icon: Circle, color: 'text-muted-foreground' },
  'in-progress': { label: 'در حال انجام', icon: Circle, color: 'text-blue-500' },
  completed: { label: 'تکمیل شده', icon: CheckCircle2, color: 'text-green-500' },
  blocked: { label: 'مسدود شده', icon: AlertCircle, color: 'text-destructive' },
};

export function RoadmapForm({ organizationId, onSuccess, onCancel, existingData }: RoadmapFormProps) {
  const [title, setTitle] = useState(existingData?.content?.title || '');
  const [description, setDescription] = useState(existingData?.content?.description || '');
  const [startDate, setStartDate] = useState(existingData?.content?.startDate || '');
  const [endDate, setEndDate] = useState(existingData?.content?.endDate || '');
  const [milestones, setMilestones] = useState<Milestone[]>(
    existingData?.content?.milestones || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        targetDate: '',
        status: 'pending',
        owner: '',
        deliverables: [],
      },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || milestones.length === 0) {
      toast.error('لطفاً عنوان و حداقل یک نقطه عطف وارد کنید');
      return;
    }

    setIsSubmitting(true);
    try {
      const content = {
        type: 'roadmap',
        title,
        description,
        startDate,
        endDate,
        milestones,
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
          strategy_type: 'roadmap',
          content: content as any 
        })
        .select()
        .single();

      if (strategyError) throw strategyError;

      // Save milestones
      if (milestones.length > 0) {
        const { error: msError } = await supabase
          .from('organization_roadmap_milestones')
          .insert(
            milestones.map((m) => ({
              strategy_id: newStrategy.id,
              title: m.title,
              description: m.description,
              target_date: m.targetDate,
              status: m.status,
              owner: m.owner,
              deliverables: m.deliverables,
            }))
          );
        if (msError) throw msError;
      }

      toast.success('نقشه راه با موفقیت ذخیره شد');
      
      // Send notification
      await strategyNotificationService.notifyRoadmapCreated(
        organizationId,
        title,
        user.id
      );
      
      // Check for completed/blocked milestones
      const completedMilestones = milestones.filter(m => m.status === 'completed');
      const blockedMilestones = milestones.filter(m => m.status === 'blocked');
      
      for (const milestone of completedMilestones) {
        await strategyNotificationService.notifyMilestoneCompleted(
          organizationId,
          milestone.title,
          title
        );
      }
      
      for (const milestone of blockedMilestones) {
        await strategyNotificationService.notifyMilestoneBlocked(
          organizationId,
          milestone.title,
          title
        );
      }
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'خطا در ذخیره نقشه راه');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>عنوان نقشه راه</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان نقشه راه..."
          />
        </div>

        <div>
          <Label>توضیحات</Label>
          <TextInputWithVoice
            value={description}
            onChange={setDescription}
            placeholder="توضیحات کلی نقشه راه..."
            type="textarea"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>تاریخ شروع</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>تاریخ پایان</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">نقاط عطف (Milestones)</Label>
          <Button type="button" onClick={addMilestone} size="sm" variant="outline">
            <Plus className="h-4 w-4 ml-2" />
            افزودن نقطه عطف
          </Button>
        </div>

        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const StatusIcon = STATUS_CONFIG[milestone.status].icon;
            return (
              <Card key={milestone.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${STATUS_CONFIG[milestone.status].color}`} />
                      <CardTitle className="text-base">نقطه عطف #{index + 1}</CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">عنوان</Label>
                    <Input
                      value={milestone.title}
                      onChange={(e) =>
                        updateMilestone(milestone.id, 'title', e.target.value)
                      }
                      placeholder="عنوان نقطه عطف..."
                    />
                  </div>

                  <div>
                    <Label className="text-xs">توضیحات</Label>
                    <TextInputWithVoice
                      value={milestone.description}
                      onChange={(v) => updateMilestone(milestone.id, 'description', v)}
                      placeholder="توضیحات..."
                      type="textarea"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">تاریخ هدف</Label>
                      <Input
                        type="date"
                        value={milestone.targetDate}
                        onChange={(e) =>
                          updateMilestone(milestone.id, 'targetDate', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">وضعیت</Label>
                      <Select
                        value={milestone.status}
                        onValueChange={(v: any) =>
                          updateMilestone(milestone.id, 'status', v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">مسئول</Label>
                      <Input
                        value={milestone.owner}
                        onChange={(e) =>
                          updateMilestone(milestone.id, 'owner', e.target.value)
                        }
                        placeholder="نام مسئول"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            لغو
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'در حال ذخیره...' : existingData ? 'به‌روزرسانی نقشه راه' : 'ذخیره نقشه راه'}
        </Button>
      </div>
    </form>
  );
}
