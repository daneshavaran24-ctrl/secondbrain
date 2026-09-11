import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import organizationalMissionService from '@/services/organizationalMissionService';
import { supabase } from '@/integrations/supabase/client';

interface MissionFormProps {
  missionId?: string;
  onSave: () => void;
  onCancel: () => void;
}

interface MissionFormData {
  title: string;
  description: string;
  status: string;
  progress: number;
  end_date: string;
}

const MissionForm: React.FC<MissionFormProps> = ({ missionId, onSave, onCancel }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState([0]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<MissionFormData>({
    defaultValues: {
      title: '',
      description: '',
      status: 'فعال',
      progress: 0,
      end_date: ''
    }
  });

  useEffect(() => {
    if (missionId) {
      loadMissionData();
    }
  }, [missionId]);

  const loadMissionData = async () => {
    if (!missionId) return;
    try {
      setIsLoading(true);
      const mission = await organizationalMissionService.getMissionById(missionId);
      if (mission) {
        reset({
          title: mission.title,
          description: mission.description || '',
          status: mission.status,
          progress: mission.progress || 0,
          end_date: mission.end_date || ''
        });
        setProgress([mission.progress || 0]);
      }
    } catch (error) {
      console.error('Error loading mission:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MissionFormData) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const missionData: any = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status,
        progress: progress[0],
        end_date: data.end_date || null
      };

      if (missionId) {
        await organizationalMissionService.updateMission(missionId, missionData);
        toast({
          title: 'موفقیت',
          description: 'مأموریت به‌روزرسانی شد'
        });
      } else {
        await organizationalMissionService.createMission(missionData);
        toast({
          title: 'موفقیت',
          description: 'مأموریت ایجاد شد'
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving mission:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{missionId ? 'ویرایش مأموریت' : 'مأموریت جدید'}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان *</Label>
            <Input
              id="title"
              {...register('title', { required: true })}
              placeholder="عنوان مأموریت"
            />
          </div>

          <div className="space-y-2">
            <TextInputWithVoice
              id="description"
              value={watch('description') || ''}
              onChange={(value) => setValue('description', value)}
              type="textarea"
              placeholder="توضیحات"
              rows={3}
              enableVoice={true}
              label="توضیحات"
            />
          </div>

          <div className="space-y-2">
            <Label>وضعیت</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="فعال">فعال</SelectItem>
                <SelectItem value="درحال اجرا">درحال اجرا</SelectItem>
                <SelectItem value="تکمیل شده">تکمیل شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>پیشرفت: {progress[0]}%</Label>
            <Slider
              value={progress}
              onValueChange={setProgress}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">تاریخ پایان</Label>
            <Input
              id="end_date"
              type="date"
              {...register('end_date')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              انصراف
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MissionForm;
