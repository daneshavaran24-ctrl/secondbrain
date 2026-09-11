import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteDepartment, type Department, type Employee } from '@/services/hrService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DepartmentCardProps {
  department: Department;
  employees: Employee[];
  allEmployees: Employee[];
  onEdit: (department: Department) => void;
  onDelete: () => void;
}

export function DepartmentCard({ department, employees, allEmployees, onEdit, onDelete }: DepartmentCardProps) {
  const { toast } = useToast();
  
  const headEmployee = allEmployees.find(emp => emp.id === department.head_id);
  
  const totalSalaries = employees.reduce((sum, emp) => 
    sum + (emp.base_salary || 0) + (emp.allowances || 0), 0
  );
  const totalBonuses = employees.reduce((sum, emp) => sum + (emp.bonus || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  const handleDelete = async () => {
    try {
      await deleteDepartment(department.id);
      toast({
        title: 'موفق',
        description: 'دپارتمان با موفقیت حذف شد',
      });
      onDelete();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'خطا',
        description: 'حذف دپارتمان با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">💼 {department.name}</CardTitle>
            {department.code && (
              <p className="text-sm text-muted-foreground mt-1">کد: {department.code}</p>
            )}
            {headEmployee && (
              <p className="text-sm text-muted-foreground">مدیر: {headEmployee.full_name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(department)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف دپارتمان</AlertDialogTitle>
                  <AlertDialogDescription>
                    آیا مطمئن هستید که می‌خواهید دپارتمان {department.name} را حذف کنید؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {department.description && (
          <p className="text-sm text-muted-foreground">{department.description}</p>
        )}

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>کارمندان: <strong>{employees.length}</strong> نفر</span>
          </div>
          {department.budget && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>بودجه: <strong>{formatCurrency(department.budget)}</strong></span>
            </div>
          )}
        </div>

        {employees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-2 font-semibold">نام</th>
                  <th className="text-right p-2 font-semibold">سمت</th>
                  <th className="text-right p-2 font-semibold">حقوق</th>
                  <th className="text-right p-2 font-semibold">پاداش</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b">
                    <td className="p-2">{employee.full_name}</td>
                    <td className="p-2">{employee.position || '-'}</td>
                    <td className="p-2">
                      {employee.base_salary ? `${formatCurrency(employee.base_salary)}` : '-'}
                    </td>
                    <td className="p-2">
                      {employee.bonus ? `${formatCurrency(employee.bonus)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t text-sm">
          <div>
            جمع حقوق و مزایا: <strong>{formatCurrency(totalSalaries)} تومان</strong>
          </div>
          <div>
            جمع پاداش: <strong>{formatCurrency(totalBonuses)} تومان</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
