import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  Target, 
  Calendar, 
  Package,
  Lightbulb,
  TrendingUp,
  Edit,
  AlertTriangle,
  Shield
} from "lucide-react";
import { RevenueOpportunityEditor } from "./editors/RevenueOpportunityEditor";
import { SuggestedActionsEditor } from "./editors/SuggestedActionsEditor";
import { BusinessModelCanvasEditor } from "./editors/BusinessModelCanvasEditor";
import { MilestonesEditor } from "./editors/MilestonesEditor";
import { FinancialAnalysisEditor } from "./editors/FinancialAnalysisEditor";
import { StrategyEditor } from "./editors/StrategyEditor";
import { SWOTEditor } from "./editors/SWOTEditor";
import { RisksEditor } from "./editors/RisksEditor";

interface EnhancedDataProps {
  ideaId: string;
}

export function IdeaDetailsEnhanced({ ideaId }: EnhancedDataProps) {
  const [revenueOpportunities, setRevenueOpportunities] = useState<any[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<any[]>([]);
  const [businessModelCanvas, setBusinessModelCanvas] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [financialAnalysis, setFinancialAnalysis] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [swotAnalysis, setSwotAnalysis] = useState<any>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<string | null>(null);

  const refetchData = () => {
    const fetchDetails = async () => {
      const { data: revData } = await supabase.from('idea_revenue_opportunities').select('*').eq('idea_id', ideaId);
      setRevenueOpportunities(revData || []);
      
      const { data: actionsData } = await supabase.from('idea_suggested_actions').select('*').eq('idea_id', ideaId).order('order_index');
      setSuggestedActions(actionsData || []);
      
      const { data: bmcData } = await supabase.from('idea_business_model_canvas').select('*').eq('idea_id', ideaId).maybeSingle();
      setBusinessModelCanvas(bmcData);

      const { data: milestonesData } = await supabase.from('idea_milestones').select('*').eq('idea_id', ideaId).order('created_at', { ascending: true });
      setMilestones(milestonesData || []);

      const { data: financialData } = await supabase.from('idea_financial_analysis').select('*').eq('idea_id', ideaId).maybeSingle();
      setFinancialAnalysis(financialData);

      const { data: strategyData } = await supabase.from('idea_strategy').select('*').eq('idea_id', ideaId).maybeSingle();
      setStrategy(strategyData);

      const { data: swotData } = await supabase.from('idea_swot_analysis').select('*').eq('idea_id', ideaId).maybeSingle();
      setSwotAnalysis(swotData);

      const { data: risksData } = await supabase.from('idea_risks').select('*').eq('idea_id', ideaId);
      setRisks(risksData || []);
    };
    fetchDetails();
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      
      // Fetch revenue opportunities
      const { data: revData } = await supabase
        .from('idea_revenue_opportunities')
        .select('*')
        .eq('idea_id', ideaId);
      setRevenueOpportunities(revData || []);
      
      // Fetch suggested actions
      const { data: actionsData } = await supabase
        .from('idea_suggested_actions')
        .select('*')
        .eq('idea_id', ideaId)
        .order('order_index');
      setSuggestedActions(actionsData || []);
      
      // Fetch business model canvas
      const { data: bmcData } = await supabase
        .from('idea_business_model_canvas')
        .select('*')
        .eq('idea_id', ideaId)
        .maybeSingle();
      setBusinessModelCanvas(bmcData);

      // Fetch milestones
      const { data: milestonesData } = await supabase
        .from('idea_milestones')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });
      setMilestones(milestonesData || []);

      // Fetch financial analysis
      const { data: financialData } = await supabase
        .from('idea_financial_analysis')
        .select('*')
        .eq('idea_id', ideaId)
        .maybeSingle();
      setFinancialAnalysis(financialData);

      // Fetch strategy
      const { data: strategyData } = await supabase
        .from('idea_strategy')
        .select('*')
        .eq('idea_id', ideaId)
        .maybeSingle();
      setStrategy(strategyData);

      // Fetch SWOT analysis
      const { data: swotData } = await supabase
        .from('idea_swot_analysis')
        .select('*')
        .eq('idea_id', ideaId)
        .maybeSingle();
      setSwotAnalysis(swotData);

      // Fetch risks
      const { data: risksData } = await supabase
        .from('idea_risks')
        .select('*')
        .eq('idea_id', ideaId);
      setRisks(risksData || []);
      
      setLoading(false);
    };
    
    fetchDetails();
  }, [ideaId]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>;
  }

  return (
    <Tabs defaultValue="revenue" className="w-full">
      <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full gap-1">
        <TabsTrigger value="revenue" className="text-xs">
          <DollarSign className="w-3 h-3 ml-1" />
          <span className="hidden md:inline">فرصت‌های درآمد</span>
          <span className="md:hidden">درآمد</span>
        </TabsTrigger>
        <TabsTrigger value="actions" className="text-xs">
          <Target className="w-3 h-3 ml-1" />
          اقدامات
        </TabsTrigger>
        <TabsTrigger value="bmc" className="text-xs">
          <Package className="w-3 h-3 ml-1" />
          <span className="hidden md:inline">مدل کسب‌وکار</span>
          <span className="md:hidden">BMC</span>
        </TabsTrigger>
        <TabsTrigger value="milestones" className="text-xs">
          <Calendar className="w-3 h-3 ml-1" />
          <span className="hidden md:inline">نقاط عطف</span>
          <span className="md:hidden">عطف</span>
        </TabsTrigger>
        <TabsTrigger value="financial" className="text-xs">
          <TrendingUp className="w-3 h-3 ml-1" />
          مالی
        </TabsTrigger>
        <TabsTrigger value="strategy" className="text-xs">
          <Lightbulb className="w-3 h-3 ml-1" />
          استراتژی
        </TabsTrigger>
        <TabsTrigger value="swot" className="text-xs">
          <Shield className="w-3 h-3 ml-1" />
          SWOT
        </TabsTrigger>
        <TabsTrigger value="risks" className="text-xs">
          <AlertTriangle className="w-3 h-3 ml-1" />
          ریسک‌ها
        </TabsTrigger>
      </TabsList>

      {/* Revenue Opportunities Tab */}
      <TabsContent value="revenue" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('revenue')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش فرصت‌های درآمد
          </Button>
        </div>
        {revenueOpportunities.length > 0 ? (
          <div className="grid gap-4">
            {revenueOpportunities.map((rev) => (
              <Card key={rev.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    {rev.revenue_model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-semibold text-sm">بخش هدف: </span>
                    <span className="text-sm">{rev.target_segment}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">تخمین بازار: </span>
                    <span className="text-sm">{rev.market_size}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">استراتژی قیمت‌گذاری: </span>
                    <span className="text-sm">{rev.pricing_strategy}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">تخمین درآمد: </span>
                    <span className="text-sm font-bold text-green-700">{rev.revenue_estimate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">زمان: </span>
                      <span className="text-sm">{rev.timeline}</span>
                    </div>
                    <Badge variant={
                      rev.confidence_level === 'high' ? 'default' : 
                      rev.confidence_level === 'medium' ? 'secondary' : 
                      'outline'
                    }>
                      {rev.confidence_level === 'high' ? 'اطمینان بالا' : 
                       rev.confidence_level === 'medium' ? 'اطمینان متوسط' : 
                       'اطمینان پایین'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز فرصت درآمدی تعریف نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Suggested Actions Tab */}
      <TabsContent value="actions" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('actions')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش اقدامات پیشنهادی
          </Button>
        </div>
        {suggestedActions.length > 0 ? (
          <div className="space-y-3">
            {suggestedActions.map((action, idx) => (
              <Card key={action.id} className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant={
                      action.priority === 'high' ? 'destructive' : 
                      action.priority === 'medium' ? 'default' : 
                      'outline'
                    }>
                      {action.priority === 'high' ? 'فوری' : 
                       action.priority === 'medium' ? 'مهم' : 
                       'معمولی'}
                    </Badge>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{idx + 1}. {action.action}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {action.timeline}
                        </div>
                        {action.estimated_effort && (
                          <div>⏱️ {action.estimated_effort}</div>
                        )}
                      </div>
                      {action.dependencies && (
                        <p className="text-sm text-muted-foreground">
                          <strong>وابستگی‌ها:</strong> {action.dependencies}
                        </p>
                      )}
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
              <p>هنوز اقدام پیشنهادی وجود ندارد</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Business Model Canvas Tab */}
      <TabsContent value="bmc" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('bmc')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش مدل کسب‌وکار
          </Button>
        </div>
        {businessModelCanvas ? (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Key Partnerships */}
            <Card className="md:row-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">شراکت‌های کلیدی</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.key_partnerships?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Key Activities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">فعالیت‌های کلیدی</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.key_activities?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Value Propositions */}
            <Card className="md:row-span-2 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  پیشنهادات ارزشی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.value_propositions?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Customer Relationships */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">روابط با مشتری</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.customer_relationships?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card className="md:row-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">بخش‌های مشتری</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.customer_segments?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Key Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">منابع کلیدی</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.key_resources?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Channels */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">کانال‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.channels?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Cost Structure */}
            <Card className="md:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ساختار هزینه</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.cost_structure?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Revenue Streams */}
            <Card className="md:col-span-3 bg-green-50/50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  جریان‌های درآمد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {businessModelCanvas.revenue_streams?.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز مدل کسب‌وکار تعریف نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Milestones Tab */}
      <TabsContent value="milestones" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('milestones')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش نقاط عطف
          </Button>
        </div>
        {milestones.length > 0 ? (
          <div className="space-y-3">
            {milestones.map((milestone, idx) => (
              <Card key={milestone.id} className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {milestone.target_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(milestone.target_date).toLocaleDateString('fa-IR')}</span>
                          </div>
                        )}
                        <Badge variant={milestone.completed ? "default" : "outline"}>
                          {milestone.completed ? "تکمیل شده" : "در حال انجام"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز نقطه عطفی تعریف نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Financial Analysis Tab */}
      <TabsContent value="financial" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('financial')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش تحلیل مالی
          </Button>
        </div>
        {financialAnalysis ? (
          <div className="space-y-6">
            {/* Initial Capital */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  سرمایه اولیه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold">حداقل: </span>
                    <span className="text-lg font-bold text-blue-700">
                      {financialAnalysis.initial_capital_min?.toLocaleString('fa-IR')} {financialAnalysis.initial_capital_currency || 'تومان'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold">حداکثر: </span>
                    <span className="text-lg font-bold text-blue-700">
                      {financialAnalysis.initial_capital_max?.toLocaleString('fa-IR')} {financialAnalysis.initial_capital_currency || 'تومان'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Costs */}
            {financialAnalysis.monthly_operational_costs && Array.isArray(financialAnalysis.monthly_operational_costs) && financialAnalysis.monthly_operational_costs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">هزینه‌های عملیاتی ماهانه</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financialAnalysis.monthly_operational_costs.map((cost: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{cost.category}</span>
                        <span className="font-bold text-red-600">
                          {cost.amount?.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revenue Forecast */}
            {financialAnalysis.revenue_forecast && Array.isArray(financialAnalysis.revenue_forecast) && financialAnalysis.revenue_forecast.length > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    پیش‌بینی درآمد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {financialAnalysis.revenue_forecast.map((forecast: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded">
                        <span className="font-medium">ماه {forecast.month}</span>
                        <span className="font-bold text-green-700">
                          {forecast.revenue?.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Break Even & ROI */}
            <div className="grid md:grid-cols-2 gap-4">
              {financialAnalysis.break_even_month && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">نقطه سربه‌سر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {financialAnalysis.break_even_month} ماه
                      </div>
                      {financialAnalysis.break_even_analysis && (
                        <p className="text-sm text-muted-foreground">
                          {financialAnalysis.break_even_analysis}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {financialAnalysis.roi_percentage && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">بازگشت سرمایه (ROI)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {financialAnalysis.roi_percentage}%
                      </div>
                      {financialAnalysis.roi_timeline && (
                        <p className="text-sm text-muted-foreground">
                          {financialAnalysis.roi_timeline}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Additional Financial Info */}
            {(financialAnalysis.profit_margin_percentage || financialAnalysis.cash_flow_analysis) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">تحلیل‌های اضافی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {financialAnalysis.profit_margin_percentage && (
                    <div>
                      <span className="font-semibold text-sm">حاشیه سود: </span>
                      <span className="text-lg font-bold text-green-600">
                        {financialAnalysis.profit_margin_percentage}%
                      </span>
                    </div>
                  )}
                  {financialAnalysis.cash_flow_analysis && (
                    <div>
                      <span className="font-semibold text-sm">تحلیل جریان نقدی: </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {financialAnalysis.cash_flow_analysis}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assumptions */}
            {financialAnalysis.assumptions && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">فرضیات مالی</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {financialAnalysis.assumptions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز تحلیل مالی انجام نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Strategy Tab */}
      <TabsContent value="strategy" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('strategy')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش استراتژی
          </Button>
        </div>
        {strategy ? (
          <div className="space-y-6">
            {/* Marketing Strategy */}
            {(strategy.target_audience || strategy.positioning_statement || (strategy.marketing_strategy && Array.isArray(strategy.marketing_strategy) && strategy.marketing_strategy.length > 0)) && (
              <Card className="border-pink-200 bg-pink-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">استراتژی بازاریابی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategy.target_audience && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">مخاطب هدف:</h4>
                      <p className="text-sm">{strategy.target_audience}</p>
                    </div>
                  )}
                  {strategy.positioning_statement && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">موقعیت‌یابی:</h4>
                      <p className="text-sm">{strategy.positioning_statement}</p>
                    </div>
                  )}
                  {strategy.marketing_strategy && Array.isArray(strategy.marketing_strategy) && strategy.marketing_strategy.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">کانال‌های بازاریابی:</h4>
                      <div className="space-y-2">
                        {strategy.marketing_strategy.map((channel: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                            <span>{channel.channel}</span>
                            {channel.budget && (
                              <span className="text-sm">بودجه: {channel.budget.toLocaleString('fa-IR')} تومان</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Growth Strategy */}
            {(strategy.growth_strategy || (strategy.scaling_plan && Array.isArray(strategy.scaling_plan) && strategy.scaling_plan.length > 0) || (strategy.expansion_markets && strategy.expansion_markets.length > 0)) && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">استراتژی رشد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategy.growth_strategy && (
                    <p className="text-sm">{strategy.growth_strategy}</p>
                  )}
                  {strategy.scaling_plan && Array.isArray(strategy.scaling_plan) && strategy.scaling_plan.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">برنامه توسعه:</h4>
                      <div className="space-y-3">
                        {strategy.scaling_plan.map((phase: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>{phase.phase}</Badge>
                              {phase.timeline && (
                                <span className="text-sm text-muted-foreground">{phase.timeline}</span>
                              )}
                            </div>
                            {phase.goals && Array.isArray(phase.goals) && (
                              <ul className="text-sm space-y-1 list-disc list-inside">
                                {phase.goals.map((goal: string, gIdx: number) => (
                                  <li key={gIdx}>{goal}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {strategy.expansion_markets && strategy.expansion_markets.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">بازارهای توسعه:</h4>
                      <div className="flex flex-wrap gap-2">
                        {strategy.expansion_markets.map((market: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{market}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Competitive Strategy */}
            {(strategy.competitive_strategy || (strategy.competitive_advantage && strategy.competitive_advantage.length > 0) || (strategy.differentiation_points && strategy.differentiation_points.length > 0)) && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">استراتژی رقابتی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategy.competitive_strategy && (
                    <p className="text-sm">{strategy.competitive_strategy}</p>
                  )}
                  {strategy.competitive_advantage && strategy.competitive_advantage.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">مزیت‌های رقابتی:</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {strategy.competitive_advantage.map((adv: string, idx: number) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {strategy.differentiation_points && strategy.differentiation_points.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">نقاط تمایز:</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {strategy.differentiation_points.map((point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Product Strategy */}
            {((strategy.product_roadmap && Array.isArray(strategy.product_roadmap) && strategy.product_roadmap.length > 0) || strategy.innovation_approach || (strategy.technology_stack && strategy.technology_stack.length > 0)) && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">استراتژی محصول</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategy.product_roadmap && Array.isArray(strategy.product_roadmap) && strategy.product_roadmap.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">نقشه راه محصول:</h4>
                      <div className="space-y-3">
                        {strategy.product_roadmap.map((version: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{version.version}</Badge>
                              {version.timeline && (
                                <span className="text-sm text-muted-foreground">{version.timeline}</span>
                              )}
                            </div>
                            {version.features && Array.isArray(version.features) && (
                              <ul className="text-sm space-y-1 list-disc list-inside">
                                {version.features.map((feature: string, fIdx: number) => (
                                  <li key={fIdx}>{feature}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {strategy.innovation_approach && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">رویکرد نوآوری:</h4>
                      <p className="text-sm">{strategy.innovation_approach}</p>
                    </div>
                  )}
                  {strategy.technology_stack && strategy.technology_stack.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">پشته فناوری:</h4>
                      <div className="flex flex-wrap gap-2">
                        {strategy.technology_stack.map((tech: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Operational Strategy */}
            {(strategy.operational_strategy || (strategy.key_processes && strategy.key_processes.length > 0)) && (
              <Card className="border-gray-200 bg-gray-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">استراتژی عملیاتی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategy.operational_strategy && (
                    <p className="text-sm">{strategy.operational_strategy}</p>
                  )}
                  {strategy.key_processes && strategy.key_processes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">فرآیندهای کلیدی:</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {strategy.key_processes.map((process: string, idx: number) => (
                          <li key={idx}>{process}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز استراتژی تعریف نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* SWOT Analysis Tab */}
      <TabsContent value="swot" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('swot')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش تحلیل SWOT
          </Button>
        </div>
        {swotAnalysis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">نقاط قوت (S)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {(swotAnalysis.strengths || []).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">نقاط ضعف (W)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {(swotAnalysis.weaknesses || []).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">فرصت‌ها (O)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {(swotAnalysis.opportunities || []).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Threats */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">تهدیدها (T)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {(swotAnalysis.threats || []).map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز تحلیل SWOT انجام نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Risks Tab */}
      <TabsContent value="risks" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialog('risks')}
          >
            <Edit className="w-4 h-4 mr-2" />
            ویرایش ریسک‌ها
          </Button>
        </div>
        {risks.length > 0 ? (
          <div className="grid gap-4">
            {risks.map((risk) => (
              <Card key={risk.id} className={
                risk.severity === 'high' ? 'border-red-300 bg-red-50/50' :
                risk.severity === 'medium' ? 'border-yellow-300 bg-yellow-50/50' :
                'border-blue-300 bg-blue-50/50'
              }>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{risk.description}</CardTitle>
                    <Badge variant={
                      risk.severity === 'high' ? 'destructive' :
                      risk.severity === 'medium' ? 'default' :
                      'secondary'
                    }>
                      {risk.severity === 'high' ? 'بالا' :
                       risk.severity === 'medium' ? 'متوسط' :
                       'پایین'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {risk.risk_type && (
                    <div>
                      <span className="font-semibold text-sm">نوع ریسک: </span>
                      <span className="text-sm">{risk.risk_type}</span>
                    </div>
                  )}
                  {risk.mitigation_strategy && (
                    <div>
                      <span className="font-semibold text-sm">استراتژی کاهش: </span>
                      <p className="text-sm mt-1">{risk.mitigation_strategy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هنوز ریسکی شناسایی نشده است</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Edit Dialogs */}
      <Dialog open={editDialog === 'revenue'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <RevenueOpportunityEditor
            ideaId={ideaId}
            opportunities={revenueOpportunities}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'actions'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <SuggestedActionsEditor
            ideaId={ideaId}
            actions={suggestedActions}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'bmc'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <BusinessModelCanvasEditor
            ideaId={ideaId}
            bmcData={businessModelCanvas}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'milestones'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <MilestonesEditor
            ideaId={ideaId}
            milestones={milestones}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'financial'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <FinancialAnalysisEditor
            ideaId={ideaId}
            financialData={financialAnalysis}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'strategy'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <StrategyEditor
            ideaId={ideaId}
            strategyData={strategy}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'swot'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <SWOTEditor
            ideaId={ideaId}
            swotId={swotAnalysis?.id}
            swotData={swotAnalysis}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog === 'risks'} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <RisksEditor
            ideaId={ideaId}
            risks={risks}
            onSave={() => {
              refetchData();
              setEditDialog(null);
            }}
            onClose={() => setEditDialog(null)}
          />
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}