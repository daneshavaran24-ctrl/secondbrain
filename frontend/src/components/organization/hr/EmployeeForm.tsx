import { useState, useEffect } from 'react';
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
import { createEmployee, updateEmployee, type Employee, getDepartments, type Department } from '@/services/hrService';

interface EmployeeFormProps {
  organizationId: string;
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeForm({ organizationId, employee, onClose }: EmployeeFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    employee_code: employee?.employee_code || '',
    full_name: employee?.full_name || '',
    position: employee?.position || '',
    department_id: employee?.department_id || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    employment_type: employee?.employment_type || 'full-time',
    hire_date: employee?.hire_date || '',
    base_salary: employee?.base_salary?.toString() || '',
    allowances: employee?.allowances?.toString() || '0',
    bonus: employee?.bonus?.toString() || '0',
    currency: employee?.currency || 'IRR',
    bank_account: employee?.bank_account || '',
    status: employee?.status || 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDepartments();
  }, [organizationId]);

  const loadDepartments = async () => {
    try {
      const data = await getDepartments(organizationId);
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast({
        title: 'خطا',
        description: 'نام کارمند الزامی است',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const employeeData = {
        organization_id: organizationId,
        employee_code: formData.employee_code || undefined,
        full_name: formData.full_name,
        position: formData.position || undefined,
        department_id: formData.department_id || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        employment_type: formData.employment_type,
        hire_date: formData.hire_date || undefined,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : undefined,
        allowances: formData.allowances ? parseFloat(formData.allowances) : 0,
        bonus: formData.bonus ? parseFloat(formData.bonus) : 0,
        currency: formData.currency,
        bank_account: formData.bank_account || undefined,
        status: formData.status,
      };

      if (employee) {
        await updateEmployee(employee.id, employeeData);
        toast({
          title: 'موفق',
          description: 'کارمند با موفقیت بروزرسانی شد',
        });
      } else {
        await createEmployee(employeeData);
        toast({
          title: 'موفق',
          description: 'کارمند با موفقیت اضافه شد',
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
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
          <CardTitle>{employee ? 'ویرایش کارمند' : 'افزودن کارمند'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">نام کامل *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_code">کد پرسنلی</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">سمت</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_id">دپارتمان</Label>
              <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دپارتمان" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">تلفن</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">نوع استخدام</Label>
              <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">تمام وقت</SelectItem>
                  <SelectItem value="part-time">پاره وقت</SelectItem>
                  <SelectItem value="contract">قراردادی</SelectItem>
                  <SelectItem value="intern">کارآموز</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">تاریخ استخدام</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">حقوق پایه</Label>
              <Input
                id="base_salary"
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowances">مزایا</Label>
              <Input
                id="allowances"
                type="number"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonus">پاداش</Label>
              <Input
                id="bonus"
                type="number"
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">واحد پول</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IRR">ریال</SelectItem>
                  <SelectItem value="IRT">تومان</SelectItem>
                  <SelectItem value="USD">دلار</SelectItem>
                  <SelectItem value="EUR">یورو</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account">حساب بانکی</Label>
              <Input
                id="bank_account"
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">وضعیت</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                  <SelectItem value="on-leave">مرخصی</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
