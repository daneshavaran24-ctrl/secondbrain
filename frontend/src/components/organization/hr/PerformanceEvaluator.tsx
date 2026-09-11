import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Star, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPerformanceEvaluations,
  deletePerformanceEvaluation,
  getEmployees,
  type PerformanceEvaluation,
  type Employee,
} from '@/services/hrService';
import { PerformanceForm } from './PerformanceForm';
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
import { Badge } from '@/components/ui/badge';

interface PerformanceEvaluatorProps {
  organizationId: string;
}

export function PerformanceEvaluator({ organizationId }: PerformanceEvaluatorProps) {
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<PerformanceEvaluation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [evalData, empData] = await Promise.all([
        getPerformanceEvaluations(organizationId),
        getEmployees(organizationId),
      ]);
      setEvaluations(evalData);
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

  const handleEdit = (evaluation: PerformanceEvaluation) => {
    setEditingEvaluation(evaluation);
    setShowForm(true);
  };

  const handleDelete = async (evaluationId: string) => {
    try {
      await deletePerformanceEvaluation(evaluationId);
      toast({
        title: 'موفق',
        description: 'ارزیابی با موفقیت حذف شد',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast({
        title: 'خطا',
        description: 'حذف ارزیابی با خطا مواجه شد',
        variant: 'destructive',
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvaluation(null);
    loadData();
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.full_name || 'نامشخص';
  };

  const getEmployeePosition = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.position || '';
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (showForm) {
    return (
      <PerformanceForm
        organizationId={organizationId}
        employees={employees}
        evaluation={editingEvaluation}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 ارزیابی عملکرد</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 ml-2" />
            ارزیابی جدید
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هنوز ارزیابی ثبت نشده است
          </div>
        ) : (
          evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          👤 {getEmployeeName(evaluation.employee_id)}
                        </h3>
                        {getEmployeePosition(evaluation.employee_id) && (
                          <span className="text-sm text-muted-foreground">
                            - {getEmployeePosition(evaluation.employee_id)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        دوره: {evaluation.evaluation_period}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(evaluation)}>
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
                            <AlertDialogTitle>حذف ارزیابی</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا مطمئن هستید که می‌خواهید این ارزیابی را حذف کنید؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(evaluation.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>امتیاز:</span>
                      {evaluation.performance_score && renderStars(evaluation.performance_score)}
                      <span className="font-semibold">{evaluation.performance_score}/5</span>
                    </div>
                    {evaluation.goals_achieved !== undefined && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>تحقق اهداف:</span>
                        <span className="font-semibold">{evaluation.goals_achieved}%</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">👨‍💼 ارزیابی‌کننده:</span>{' '}
                    <span className="font-medium">{evaluation.evaluator_name}</span>
                  </div>

                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">✅ نقاط قوت:</p>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.strengths.map((strength, idx) => (
                          <Badge key={idx} variant="secondary">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {evaluation.areas_for_improvement && evaluation.areas_for_improvement.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">⚠️ نیاز به بهبود:</p>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.areas_for_improvement.map((area, idx) => (
                          <Badge key={idx} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {evaluation.feedback && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">📝 بازخورد:</p>
                      <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
