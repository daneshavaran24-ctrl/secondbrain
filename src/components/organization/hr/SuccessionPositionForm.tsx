import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface SuccessionPositionFormProps {
  organizationId: string;
  onSuccess: () => void;
}

export function SuccessionPositionForm({ organizationId, onSuccess }: SuccessionPositionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    position_title: '',
    department: '',
    current_holder: '',
    criticality: 'medium',
    vacancy_risk: 50,
    status: 'active',
    required_qualifications: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('organization_succession_plans')
        .insert({
          organization_id: organizationId,
          ...formData
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'پست با موفقیت اضافه شد',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating position:', error);
      toast({
        title: 'خطا',
        description: 'افزودن پست با خطا مواجه شد',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="position_title">عنوان پست *</Label>
        <Input
          id="position_title"
          value={formData.position_title}
          onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
          required
          placeholder="مثال: مدیر عامل"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">بخش/دپارتمان</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="مثال: مدیریت"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_holder">دارنده فعلی</Label>
          <Input
            id="current_holder"
            value={formData.current_holder}
            onChange={(e) => setFormData({ ...formData, current_holder: e.target.value })}
            placeholder="نام فرد"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="criticality">اهمیت</Label>
          <Select
            value={formData.criticality}
            onValueChange={(value) => setFormData({ ...formData, criticality: value })}
          >
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

        <div className="space-y-2">
          <Label htmlFor="vacancy_risk">ریسک خالی شدن (%)</Label>
          <Input
            id="vacancy_risk"
            type="number"
            min="0"
            max="100"
            value={formData.vacancy_risk}
            onChange={(e) => setFormData({ ...formData, vacancy_risk: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">وضعیت</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="filled">پر شده</SelectItem>
            <SelectItem value="vacant">خالی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="required_qualifications">صلاحیت‌های مورد نیاز</Label>
        <Textarea
          id="required_qualifications"
          value={formData.required_qualifications}
          onChange={(e) => setFormData({ ...formData, required_qualifications: e.target.value })}
          placeholder="مدرک، تجربه، مهارت‌های فنی..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">یادداشت‌ها</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          ذخیره
        </Button>
      </div>
    </form>
  );
}
