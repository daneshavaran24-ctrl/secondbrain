import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SuccessionPositionForm } from './SuccessionPositionForm';
import { NineBoxGrid } from './NineBoxGrid';

interface SuccessionPlan {
  id: string;
  position_title: string;
  department: string;
  current_holder: string;
  criticality: string;
  vacancy_risk: number;
  status: string;
}

interface SuccessionPlannerProps {
  organizationId: string;
}

export function SuccessionPlanner({ organizationId }: SuccessionPlannerProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SuccessionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SuccessionPlan | null>(null);
  const [showNineBox, setShowNineBox] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [organizationId]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('organization_succession_plans')
        .select('*')
        .eq('organization_id', organizationId)
        .order('vacancy_risk', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'خطا در بارگذاری',
        description: 'برنامه‌های جانشین‌پروری بارگذاری نشدند',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCriticalityColor = (criticality: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500/10 text-blue-500',
      medium: 'bg-yellow-500/10 text-yellow-500',
      high: 'bg-orange-500/10 text-orange-500',
      critical: 'bg-red-500/10 text-red-500'
    };
    return colors[criticality] || colors.medium;
  };

  const getCriticalityLabel = (criticality: string) => {
    const labels: Record<string, string> = {
      low: 'پایین',
      medium: 'متوسط',
      high: 'بالا',
      critical: 'حیاتی'
    };
    return labels[criticality] || criticality;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">برنامه جانشین‌پروری</h2>
          <p className="text-muted-foreground">مدیریت جانشین‌ها و ارزیابی آمادگی</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNineBox(!showNineBox)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            {showNineBox ? 'لیست پست‌ها' : '9-Box Grid'}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                افزودن پست
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>افزودن پست جدید</DialogTitle>
              </DialogHeader>
              <SuccessionPositionForm
                organizationId={organizationId}
                onSuccess={() => {
                  loadPlans();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showNineBox ? (
        <NineBoxGrid organizationId={organizationId} plans={plans} />
      ) : (
        <>
          {plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">هنوز پستی اضافه نشده</h3>
                <p className="text-muted-foreground mb-4">
                  برای شروع، پست‌های حیاتی سازمان را اضافه کنید
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.position_title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.department}</p>
                      </div>
                      <Badge className={getCriticalityColor(plan.criticality)}>
                        {getCriticalityLabel(plan.criticality)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">دارنده فعلی:</span>
                        <span className="font-medium">{plan.current_holder || 'خالی'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ریسک خالی شدن:</span>
                        <span className="font-medium">{plan.vacancy_risk}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">وضعیت:</span>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status === 'active' ? 'فعال' : plan.status === 'filled' ? 'پر شده' : 'خالی'}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        مشاهده جانشین‌ها
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
