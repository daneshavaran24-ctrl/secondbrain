import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  PieChart,
  Calculator,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import { ResponsiveGrid } from "@/components/ui/responsive-grid";
import { ResponsiveCard } from "@/components/ui/responsive-card";

interface RevenueModel {
  type: string;
  description: string;
  potential: 'low' | 'medium' | 'high';
  implementation_complexity: 'easy' | 'medium' | 'hard';
}

interface MonetizationStrategy {
  strategy: string;
  timeline: string;
  investment_required: number;
  expected_return: number;
}

interface FinancialProjections {
  year1_revenue?: number;
  year2_revenue?: number;
  year3_revenue?: number;
  profit_margin?: number;
  cash_flow_months?: number[];
}

interface RevenueOpportunityAnalysisProps {
  idea: any;
}

export const RevenueOpportunityAnalysis = ({ idea }: RevenueOpportunityAnalysisProps) => {
  const revenueModels: RevenueModel[] = idea.revenue_models || [];
  const monetizationStrategies: MonetizationStrategy[] = idea.monetization_strategies || [];
  const financialProjections: FinancialProjections = idea.financial_projections || {};

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-500/10 text-green-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      case 'hard': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '---';
    return new Intl.NumberFormat('fa-IR', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateROI = () => {
    if (idea.customer_lifetime_value && idea.customer_acquisition_cost) {
      const roi = ((idea.customer_lifetime_value - idea.customer_acquisition_cost) / idea.customer_acquisition_cost) * 100;
      return roi.toFixed(0);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="models">مدل‌های درآمد</TabsTrigger>
          <TabsTrigger value="financial">تحلیل مالی</TabsTrigger>
          <TabsTrigger value="strategy">استراتژی</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
            <ResponsiveCard className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">پیش‌بینی درآمد ماهیانه</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(idea.monthly_revenue_projection)}</p>
                  <p className="text-xs text-muted-foreground mt-1">تومان</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </ResponsiveCard>

            <ResponsiveCard className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">حجم بازار هدف</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(idea.market_size)}</p>
                  <p className="text-xs text-muted-foreground mt-1">تومان</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </ResponsiveCard>

            <ResponsiveCard className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نقطه سربه‌سر</p>
                  <p className="text-2xl font-bold mt-1">{idea.break_even_months || '---'}</p>
                  <p className="text-xs text-muted-foreground mt-1">ماه</p>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </ResponsiveCard>
          </ResponsiveGrid>

          {idea.target_customers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  مشتریان هدف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{idea.target_customers}</p>
              </CardContent>
            </Card>
          )}

          {idea.pricing_strategy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  استراتژی قیمت‌گذاری
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{idea.pricing_strategy}</p>
              </CardContent>
            </Card>
          )}

          {calculateROI() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  محاسبات کلیدی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">هزینه جذب مشتری (CAC)</p>
                    <p className="text-lg font-bold">{formatCurrency(idea.customer_acquisition_cost)} تومان</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ارزش مادام‌العمر مشتری (LTV)</p>
                    <p className="text-lg font-bold">{formatCurrency(idea.customer_lifetime_value)} تومان</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">بازگشت سرمایه (ROI)</p>
                  <p className="text-2xl font-bold text-green-600">{calculateROI()}%</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4 mt-4">
          {revenueModels.length > 0 ? (
            <ResponsiveGrid cols={{ default: 1, md: 2 }}>
              {revenueModels.map((model, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{model.type}</CardTitle>
                      <Badge className={getPotentialColor(model.potential)}>
                        پتانسیل {model.potential === 'high' ? 'بالا' : model.potential === 'medium' ? 'متوسط' : 'پایین'}
                      </Badge>
                    </div>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">پیچیدگی اجرا:</span>
                      <Badge className={getComplexityColor(model.implementation_complexity)}>
                        {model.implementation_complexity === 'easy' ? 'آسان' : 
                         model.implementation_complexity === 'medium' ? 'متوسط' : 'سخت'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ResponsiveGrid>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>هنوز مدل درآمدی تعریف نشده است</p>
                <p className="text-sm mt-2">از تحلیل AI برای دریافت پیشنهادات استفاده کنید</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4 mt-4">
          {Object.keys(financialProjections).length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    پیش‌بینی درآمد سالیانه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {financialProjections.year1_revenue && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">سال اول</span>
                        <span className="font-bold">{formatCurrency(financialProjections.year1_revenue)} تومان</span>
                      </div>
                      <Progress value={33} className="h-2" />
                    </div>
                  )}
                  {financialProjections.year2_revenue && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">سال دوم</span>
                        <span className="font-bold">{formatCurrency(financialProjections.year2_revenue)} تومان</span>
                      </div>
                      <Progress value={66} className="h-2" />
                    </div>
                  )}
                  {financialProjections.year3_revenue && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">سال سوم</span>
                        <span className="font-bold">{formatCurrency(financialProjections.year3_revenue)} تومان</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  )}
                  {financialProjections.profit_margin && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">حاشیه سود</span>
                        <span className="font-bold text-green-600">{financialProjections.profit_margin}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>هنوز پیش‌بینی مالی ثبت نشده است</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4 mt-4">
          {monetizationStrategies.length > 0 ? (
            <div className="space-y-4">
              {monetizationStrategies.map((strategy, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5" />
                      {strategy.strategy}
                    </CardTitle>
                    <CardDescription>زمان‌بندی: {strategy.timeline}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">سرمایه مورد نیاز</p>
                        <p className="font-bold">{formatCurrency(strategy.investment_required)} تومان</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">بازگشت سرمایه پیش‌بینی</p>
                        <p className="font-bold text-green-600">{formatCurrency(strategy.expected_return)} تومان</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>هنوز استراتژی درآمدزایی تعریف نشده است</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};