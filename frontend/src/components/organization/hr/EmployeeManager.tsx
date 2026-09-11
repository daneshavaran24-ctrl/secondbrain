import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEmployees, deleteEmployee, type Employee } from '@/services/hrService';
import { EmployeeForm } from './EmployeeForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmployeeManagerProps {
  organizationId: string;
}

export function EmployeeManager({ organizationId }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, [organizationId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchQuery, employees]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await getEmployees(organizationId);
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'خطا',
        description: 'بارگذاری کارمندان با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployee(employeeToDelete.id);
      toast({
        title: 'موفق',
        description: 'کارمند با موفقیت حذف شد',
      });
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'خطا',
        description: 'حذف کارمند با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEmployee(null);
    loadEmployees();
  };

  const totalSalaries = filteredEmployees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
  const totalBonuses = filteredEmployees.reduce((sum, emp) => sum + (emp.bonus || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  if (showForm) {
    return (
      <EmployeeForm
        organizationId={organizationId}
        employee={editingEmployee}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>👥 مدیریت کارمندان</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              افزودن کارمند
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی کارمند..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'کارمندی یافت نشد' : 'هنوز کارمندی اضافه نشده است'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2 font-semibold">کد</th>
                      <th className="text-right p-2 font-semibold">نام</th>
                      <th className="text-right p-2 font-semibold">سمت</th>
                      <th className="text-right p-2 font-semibold">حقوق</th>
                      <th className="text-right p-2 font-semibold">پاداش</th>
                      <th className="text-right p-2 font-semibold">وضعیت</th>
                      <th className="text-right p-2 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{employee.employee_code || '-'}</td>
                        <td className="p-2 font-medium">{employee.full_name}</td>
                        <td className="p-2">{employee.position || '-'}</td>
                        <td className="p-2">
                          {employee.base_salary ? `${formatCurrency(employee.base_salary)} ${employee.currency}` : '-'}
                        </td>
                        <td className="p-2">
                          {employee.bonus ? `${formatCurrency(employee.bonus)} ${employee.currency}` : '-'}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            employee.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20 text-gray-700'
                          }`}>
                            {employee.status === 'active' ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                <Pencil className="h-4 w-4 ml-2" />
                                ویرایش
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(employee)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  جمع حقوق: <span className="font-semibold text-foreground">{formatCurrency(totalSalaries)} تومان</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  جمع پاداش: <span className="font-semibold text-foreground">{formatCurrency(totalBonuses)} تومان</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کارمند</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید {employeeToDelete?.full_name} را حذف کنید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
