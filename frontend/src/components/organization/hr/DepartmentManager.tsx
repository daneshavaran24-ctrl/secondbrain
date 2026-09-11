import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDepartments, getEmployees, type Department, type Employee } from '@/services/hrService';
import { DepartmentCard } from './DepartmentCard';
import { DepartmentForm } from './DepartmentForm';

interface DepartmentManagerProps {
  organizationId: string;
}

export function DepartmentManager({ organizationId }: DepartmentManagerProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [deptData, empData] = await Promise.all([
        getDepartments(organizationId),
        getEmployees(organizationId),
      ]);
      setDepartments(deptData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطا',
        description: 'بارگذاری اطلاعات با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDepartment(null);
    loadData();
  };

  const getDepartmentEmployees = (departmentId: string) => {
    return employees.filter(emp => emp.department_id === departmentId);
  };

  if (showForm) {
    return (
      <DepartmentForm
        organizationId={organizationId}
        department={editingDepartment}
        employees={employees}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🏢 دپارتمان‌ها</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            افزودن دپارتمان
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هنوز دپارتمانی اضافه نشده است
          </div>
        ) : (
          departments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              employees={getDepartmentEmployees(department.id)}
              allEmployees={employees}
              onEdit={handleEdit}
              onDelete={loadData}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
