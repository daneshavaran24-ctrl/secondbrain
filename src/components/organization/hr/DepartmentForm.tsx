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
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createDepartment, updateDepartment, type Department, type Employee } from '@/services/hrService';

interface DepartmentFormProps {
  organizationId: string;
  department: Department | null;
  employees: Employee[];
  onClose: () => void;
}

export function DepartmentForm({ organizationId, department, employees, onClose }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || '',
    head_id: department?.head_id || '',
    budget: department?.budget?.toString() || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام دپارتمان الزامی است',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const departmentData = {
        organization_id: organizationId,
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        head_id: formData.head_id || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      };

      if (department) {
        await updateDepartment(department.id, departmentData);
        toast({
          title: 'موفق',
          description: 'دپارتمان با موفقیت بروزرسانی شد',
        });
      } else {
        await createDepartment(departmentData);
        toast({
          title: 'موفق',
          description: 'دپارتمان با موفقیت اضافه شد',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: 'خطا',
        description: 'ذخیره اطلاعات با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <CardTitle>{department ? 'ویرایش دپارتمان' : 'افزودن دپارتمان'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام دپارتمان *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">کد دپارتمان</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="head_id">مدیر دپارتمان</Label>
            <Select value={formData.head_id} onValueChange={(value) => setFormData({ ...formData, head_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب مدیر" />
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
            <Label htmlFor="budget">بودجه</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
