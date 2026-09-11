import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextInputWithVoice } from "@/components/ui/text-input-with-voice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Brain, Loader2, FileText, Lightbulb, Sparkles, TrendingUp, AlertTriangle, Target, DollarSign, Mic } from "lucide-react";
import { AnalysisProgressIndicator } from "./AnalysisProgressIndicator";
import { VoiceRecorder } from "@/components/journal/VoiceRecorder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ModernButton } from "@/components/ui/modern-button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
const ideaSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  stage: z.enum(["concept", "research", "development", "testing", "implementation", "launched"]),
  targetMarket: z.string().optional(),
  estimatedBudget: z.number().optional(),
  expectedRoi: z.number().optional(),
  feasibilityScore: z.number().min(0).max(10).optional(),
  potentialImpact: z.number().min(0).max(10).optional()
});
const inspirationSchema = z.object({
  sourceType: z.enum(["book", "article", "video", "podcast", "conversation", "experience", "other"]),
  description: z.string().min(1, "توضیحات منبع الزامی است"),
  sourceUrl: z.string().optional()
});
type IdeaFormData = z.infer<typeof ideaSchema>;
type InspirationFormData = z.infer<typeof inspirationSchema>;
interface IdeaFormProps {
  domain: string;
  onSuccess: () => void;
}
export function IdeaForm({
  domain,
  onSuccess
}: IdeaFormProps) {
  const { toast } = useToast();
  const [inspirations, setInspirations] = useState<InspirationFormData[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisStartTime, setAnalysisStartTime] = useState<Date | null>(null);
  const form = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      priority: "medium",
      stage: "concept",
      feasibilityScore: 5,
      potentialImpact: 5
    }
  });

  // Realtime subscription for analysis queue updates
  useEffect(() => {
    if (!queueId) return;

    console.log('🔔 Setting up realtime subscription for queue:', queueId);

    const channel = supabase
      .channel(`analysis-${queueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'idea_analysis_queue',
          filter: `id=eq.${queueId}`
        },
        (payload) => {
          console.log('📨 Received realtime update:', payload);
          const status = payload.new.status;
          setAnalysisStatus(status);

          if (status === 'completed') {
            setAiAnalysis(payload.new.analysis_result);
            toast({
              title: "✨ تحلیل کامل شد",
              description: "تحلیل هوش مصنوعی با موفقیت دریافت شد"
            });
          } else if (status === 'failed') {
            toast({
              title: "❌ خطا در تحلیل",
              description: payload.new.error_message || "خطایی رخ داد",
              variant: "destructive"
            });
          } else if (status === 'processing') {
            // Status changed to processing
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queueId, toast]);
  
  const addInspiration = () => {
    setInspirations([...inspirations, {
      sourceType: "book",
      description: "",
      sourceUrl: ""
    }]);
  };
  const removeInspiration = (index: number) => {
    setInspirations(inspirations.filter((_, i) => i !== index));
  };
  const updateInspiration = (index: number, field: keyof InspirationFormData, value: string) => {
    const updated = [...inspirations];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setInspirations(updated);
  };
  
  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Test auth
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      console.log('🔐 Auth test - User:', user);
      console.log('🔐 Auth test - Error:', authError);

      // Test database connection with a simple query (allow without auth for now)
      const {
        data,
        error
      } = await supabase.from("ideas").select("id, title").limit(1);
      console.log('📊 Database test - Data:', data);
      console.log('📊 Database test - Error:', error);
      if (error) {
        toast({
          title: "❌ خطا در تست پایگاه داده",
          description: `خطا: ${error.message}`,
          variant: "destructive"
        });
      } else {
        const authStatus = user ? "✅ احراز هویت موفق" : "⚠️ بدون احراز هویت (حالت آزمایشی)";
        toast({
          title: "✅ تست موفق",
          description: `اتصال پایگاه داده کار می‌کند. ${authStatus}`
        });
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      toast({
        title: "❌ خطا در تست",
        description: error?.message || "خطای ناشناخته",
        variant: "destructive"
      });
    }
  };
  const analyzeWithAI = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    
    if (!title || !description) {
      toast({
        title: "⚠️ اطلاعات ناقص",
        description: "لطفاً ابتدا عنوان و توضیحات ایده را وارد کنید",
        variant: "default"
      });
      return;
    }

    setAnalysisStatus('pending');
    setAnalysisStartTime(new Date());

    try {
      console.log('🤖 Requesting async AI analysis...');
      
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: {
          ideaId: null, // Will be updated later in onSubmit
          title,
          description,
          inspirations,
          domain
        }
      });

      if (error) {
        console.error('❌ AI Analysis error:', error);
        throw error;
      }

      console.log('✅ Analysis queued:', data);
      
      // Store queue_id for realtime subscription
      setQueueId(data.queue_id);

      toast({
        title: "⏳ تحلیل آغاز شد",
        description: "نتیجه به صورت خودکار نمایش داده خواهد شد",
        duration: 3000
      });

    } catch (error) {
      console.error('❌ Failed to queue analysis:', error);
      setAnalysisStatus('failed');
      
      let errorMessage = error?.message || "خطایی در شروع تحلیل رخ داد";
      if (error?.message?.includes('429')) {
        errorMessage = "محدودیت تعداد درخواست. لطفاً چند دقیقه صبر کنید";
      } else if (error?.message?.includes('402')) {
        errorMessage = "اعتبار تمام شده. به تنظیمات مراجعه کنید";
      }
      
      toast({
        title: "❌ خطا در تحلیل",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const onSubmit = async (data: IdeaFormData) => {
    try {
      console.log('🔄 Starting form submission...');
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      console.log('👤 Current user:', user);
      console.log('🔐 Auth error:', authError);

      // Allow submission without auth in demo mode
      const userId = user?.id || 'demo-user-' + Date.now();
      if (!user) {
        console.warn('⚠️ No authenticated user - using demo mode');
        toast({
          title: "⚠️ حالت آزمایشی",
          description: "در حال ذخیره در حالت آزمایشی (بدون احراز هویت)",
          variant: "default"
        });
      }
      console.log('📝 Submitting idea with data:', {
        title: data.title,
        description: data.description,
        priority: data.priority,
        stage: data.stage,
        estimated_cost: data.estimatedBudget,
        feasibility_score: data.feasibilityScore,
        potential_impact: data.potentialImpact,
        status: "active",
        user_id: userId
      });

      // Create idea
      const {
        data: ideaData,
        error: ideaError
      } = await supabase.from("ideas").insert([{
        user_id: userId,
        title: data.title,
        description: data.description,
        priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
        stage: data.stage,
        feasibility_score: data.feasibilityScore,
        potential_impact: String(data.potentialImpact),
        status: "active",
        domain: domain
      }]).select().single();
      if (ideaError) {
        console.error('❌ Idea insert error:', ideaError);
        let errorMessage = ideaError.message;

        // Handle specific errors
        if (ideaError.message?.includes('row-level security')) {
          errorMessage = "مشکل در دسترسی پایگاه داده. احراز هویت مورد نیاز است.";
        } else if (ideaError.message?.includes('user_id')) {
          errorMessage = "مشکل در شناسایی کاربر";
        }
        toast({
          title: "❌ خطا در ذخیره ایده",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      console.log('✅ Idea created successfully:', ideaData);

      // Add inspirations
      if (inspirations.length > 0) {
        console.log('💡 Adding inspirations:', inspirations);
        const validInspirations = inspirations.filter(insp => insp.description?.trim());
        if (validInspirations.length > 0) {
          const inspirationInserts = validInspirations.map(inspiration => ({
            idea_id: ideaData.id,
            source_type: inspiration.sourceType,
            description: inspiration.description,
            source_url: inspiration.sourceUrl || null
          }));
          const {
            error: inspirationError
          } = await supabase.from("idea_inspirations").insert(inspirationInserts);
          if (inspirationError) {
            console.error('⚠️ Inspiration insert error:', inspirationError);
            toast({
              title: "⚠️ هشدار",
              description: "ایده ذخیره شد اما مشکلی در ذخیره منابع الهام وجود داشت",
              variant: "default"
            });
          } else {
            console.log('✅ Inspirations added successfully');
          }
        }
      }

      // Add SWOT analysis if available
      if (aiAnalysis) {
        console.log('Adding SWOT analysis:', aiAnalysis);
        const swotData = {
          idea_id: ideaData.id,
          strengths: aiAnalysis.strengths || [],
          weaknesses: aiAnalysis.weaknesses || [],
          opportunities: aiAnalysis.opportunities || [],
          threats: aiAnalysis.threats || [],
          so_strategies: aiAnalysis.soStrategies || [],
          st_strategies: aiAnalysis.stStrategies || [],
          wo_strategies: aiAnalysis.woStrategies || [],
          wt_strategies: aiAnalysis.wtStrategies || [],
          overall_assessment: aiAnalysis.overallAssessment || null,
          priority_actions: aiAnalysis.priorityActions || []
        };
        const {
          error: swotError
        } = await supabase.from('idea_swot_analysis').insert([swotData]);
        if (swotError) {
          console.error('SWOT analysis insert error:', swotError);
          // Don't throw error for SWOT analysis failure, just log it
          console.error('Error inserting SWOT analysis:', swotError);
        } else {
          console.log('SWOT analysis added successfully');
        }
      }

      // Add AI analysis as risks if available
      if (aiAnalysis?.risks) {
        console.log('Adding risks:', aiAnalysis.risks);
        const riskInserts = aiAnalysis.risks.map((risk: any) => ({
          idea_id: ideaData.id,
          risk_description: risk.description,
          severity: risk.impact || risk.severity || "medium",
          mitigation_strategy: risk.mitigation
        }));
        const {
          error: riskError
        } = await supabase.from("idea_risks").insert(riskInserts);
        if (riskError) {
          console.error('Risk insert error:', riskError);
        } else {
          console.log('Risks added successfully');
        }
      }

      // Save Revenue Opportunities
      if (aiAnalysis?.revenueOpportunities && aiAnalysis.revenueOpportunities.length > 0) {
        console.log('Adding revenue opportunities:', aiAnalysis.revenueOpportunities);
        const revenueInserts = aiAnalysis.revenueOpportunities.map((rev: any) => ({
          idea_id: ideaData.id,
          revenue_model: rev.revenueModel,
          market_size: rev.marketSize,
          pricing_strategy: rev.pricingStrategy,
          target_segment: rev.targetSegment,
          revenue_estimate: rev.revenueEstimate,
          timeline: rev.timeline,
          confidence_level: rev.confidenceLevel || 'medium'
        }));
        
        const { error: revenueError } = await supabase
          .from("idea_revenue_opportunities")
          .insert(revenueInserts);
          
        if (revenueError) {
          console.error('Revenue opportunities insert error:', revenueError);
        } else {
          console.log('Revenue opportunities added successfully');
        }
      }

      // Save Suggested Actions
      if (aiAnalysis?.suggestedActions && aiAnalysis.suggestedActions.length > 0) {
        console.log('Adding suggested actions:', aiAnalysis.suggestedActions);
        const actionInserts = aiAnalysis.suggestedActions.map((action: any, idx: number) => ({
          idea_id: ideaData.id,
          action: action.action,
          priority: action.priority,
          timeline: action.timeline,
          estimated_effort: action.estimatedEffort,
          dependencies: action.dependencies,
          order_index: idx,
          status: 'pending'
        }));
        
        const { error: actionsError } = await supabase
          .from("idea_suggested_actions")
          .insert(actionInserts);
          
        if (actionsError) {
          console.error('Suggested actions insert error:', actionsError);
        } else {
          console.log('Suggested actions added successfully');
        }
      }

      // Save Business Model Canvas
      if (aiAnalysis?.businessModelCanvas) {
        console.log('Adding business model canvas:', aiAnalysis.businessModelCanvas);
        const { error: bmcError } = await supabase
          .from("idea_business_model_canvas")
          .insert({
            idea_id: ideaData.id,
            customer_segments: aiAnalysis.businessModelCanvas.customerSegments || [],
            value_propositions: aiAnalysis.businessModelCanvas.valuePropositions || [],
            channels: aiAnalysis.businessModelCanvas.channels || [],
            customer_relationships: aiAnalysis.businessModelCanvas.customerRelationships || [],
            revenue_streams: aiAnalysis.businessModelCanvas.revenueStreams || [],
            key_resources: aiAnalysis.businessModelCanvas.keyResources || [],
            key_activities: aiAnalysis.businessModelCanvas.keyActivities || [],
            key_partnerships: aiAnalysis.businessModelCanvas.keyPartnerships || [],
            cost_structure: aiAnalysis.businessModelCanvas.costStructure || []
          });
          
        if (bmcError) {
          console.error('Business model canvas insert error:', bmcError);
        } else {
          console.log('Business model canvas added successfully');
        }
      }

      // Save milestones
      if (aiAnalysis?.milestones && aiAnalysis.milestones.length > 0) {
        console.log('Adding milestones:', aiAnalysis.milestones);
        const milestoneInserts = aiAnalysis.milestones.map((milestone: any) => ({
          idea_id: ideaData.id,
          title: milestone.title,
          description: milestone.description,
          target_date: milestone.targetDate,
          completed: false
        }));
        
        const { error: milestonesError } = await supabase
          .from("idea_milestones")
          .insert(milestoneInserts);
          
        if (milestonesError) {
          console.error('Milestones insert error:', milestonesError);
        } else {
          console.log('Milestones added successfully');
        }
      }

      // Save financial analysis
      if (aiAnalysis?.financialAnalysis) {
        console.log('Adding financial analysis:', aiAnalysis.financialAnalysis);
        const { error: financialError } = await supabase
          .from("idea_financial_analysis")
          .insert({
            idea_id: ideaData.id,
            initial_capital_min: aiAnalysis.financialAnalysis.initialCapital?.min,
            initial_capital_max: aiAnalysis.financialAnalysis.initialCapital?.max,
            monthly_operational_costs: aiAnalysis.financialAnalysis.monthlyOperationalCosts || [],
            revenue_forecast: aiAnalysis.financialAnalysis.revenueForecast || [],
            break_even_month: aiAnalysis.financialAnalysis.breakEven?.month,
            break_even_analysis: aiAnalysis.financialAnalysis.breakEven?.analysis,
            roi_percentage: aiAnalysis.financialAnalysis.roi?.percentage,
            roi_timeline: aiAnalysis.financialAnalysis.roi?.timeline,
            profit_margin_percentage: aiAnalysis.financialAnalysis.profitMargin,
            cash_flow_analysis: aiAnalysis.financialAnalysis.cashFlowAnalysis,
            assumptions: aiAnalysis.financialAnalysis.assumptions
          });
          
        if (financialError) {
          console.error('Financial analysis insert error:', financialError);
        } else {
          console.log('Financial analysis added successfully');
        }
      }

      // Save strategy
      if (aiAnalysis?.strategy) {
        console.log('Adding strategy:', aiAnalysis.strategy);
        const { error: strategyError } = await supabase
          .from("idea_strategy")
          .insert({
            idea_id: ideaData.id,
            marketing_strategy: aiAnalysis.strategy.marketing?.channels || [],
            target_audience: aiAnalysis.strategy.marketing?.targetAudience,
            positioning_statement: aiAnalysis.strategy.marketing?.positioningStatement,
            growth_strategy: aiAnalysis.strategy.growth?.strategy,
            scaling_plan: aiAnalysis.strategy.growth?.scalingPlan || [],
            expansion_markets: aiAnalysis.strategy.growth?.expansionMarkets || [],
            competitive_strategy: aiAnalysis.strategy.competitive?.strategy,
            competitive_advantage: aiAnalysis.strategy.competitive?.advantages || [],
            differentiation_points: aiAnalysis.strategy.competitive?.differentiationPoints || [],
            product_roadmap: aiAnalysis.strategy.product?.roadmap || [],
            innovation_approach: aiAnalysis.strategy.product?.innovationApproach,
            technology_stack: aiAnalysis.strategy.product?.technologyStack || [],
            operational_strategy: aiAnalysis.strategy.operational?.strategy,
            key_processes: aiAnalysis.strategy.operational?.keyProcesses || []
          });
          
        if (strategyError) {
          console.error('Strategy insert error:', strategyError);
        } else {
          console.log('Strategy added successfully');
        }
      }

      toast({
        title: "ایده ثبت شد",
        description: "ایده شما با موفقیت ثبت شد"
      });
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      let errorMessage = "متأسفانه ایده ثبت نشد";

      // Check for specific database errors
      if (error?.message) {
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = "شما مجوز لازم برای ثبت ایده را ندارید";
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = "ایده با این عنوان قبلاً ثبت شده است";
        } else if (error.message.includes('null value')) {
          errorMessage = "لطفاً تمام فیلدهای الزامی را کامل کنید";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "خطا در ارتباط با داده‌های مرتبط";
        } else if (error.message.includes('user_id')) {
          errorMessage = "لطفاً ابتدا وارد سیستم شوید";
        }
      }
      toast({
        title: "خطا در ثبت",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  const sourceTypeLabels = {
    book: "کتاب",
    article: "مقاله",
    video: "ویدیو",
    podcast: "پادکست",
    conversation: "گفتگو",
    experience: "تجربه شخصی",
    other: "سایر"
  };
  return <div className="space-y-8 max-w-4xl mx-auto">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg">
          <Plus className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="heading-primary">ایده جدید</h2>
          <p className="text-body-large max-w-2xl mx-auto">
            اطلاعات کامل ایده خود را وارد کنید تا بتوانیم تحلیل هوشمند و جامعی از آن ارائه دهیم
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Enhanced Basic Information */}
          <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="heading-secondary">اطلاعات پایه</CardTitle>
              </div>
              <p className="text-body">عنوان و توضیحات کلی ایده خود را وارد کنید</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({
              field
            }) => <FormItem>
                    <FormLabel>عنوان ایده</FormLabel>
                    <FormControl>
                      <TextInputWithVoice
                        value={field.value}
                        onChange={field.onChange}
                        type="input"
                        placeholder="عنوان ایده خود را وارد کنید..."
                        enableVoice={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="description" render={({
              field
            }) => <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <TextInputWithVoice
                        value={field.value || ''}
                        onChange={field.onChange}
                        type="textarea"
                        placeholder="توضیحات کاملی از ایده خود بنویسید..."
                        rows={5}
                        enableVoice={true}
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="priority" render={({
                field
              }) => <FormItem>
                      <FormLabel>اولویت</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب اولویت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">کم</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="high">بالا</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="stage" render={({
                field
              }) => <FormItem>
                      <FormLabel>مرحله</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب مرحله" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="concept">مفهوم</SelectItem>
                          <SelectItem value="research">تحقیق</SelectItem>
                          <SelectItem value="development">توسعه</SelectItem>
                          <SelectItem value="testing">آزمایش</SelectItem>
                          <SelectItem value="implementation">اجرا</SelectItem>
                          <SelectItem value="launched">راه‌اندازی</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="targetMarket" render={({
                field
              }) => <FormItem>
                      <FormLabel>بازار هدف</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: جوانان 18-30 ساله" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="estimatedBudget" render={({
                field
              }) => <FormItem>
                      <FormLabel>بودجه تخمینی (تومان)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="expectedRoi" render={({
                field
              }) => <FormItem>
                      <FormLabel>بازده مورد انتظار (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="feasibilityScore" render={({
                field
              }) => <FormItem>
                      <FormLabel>امکان‌پذیری (۱-۱۰)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="potentialImpact" render={({
                field
              }) => <FormItem>
                      <FormLabel>تأثیر بالقوه (۱-۱۰)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Inspirations */}
          <Card className="border-blue-200/50 bg-gradient-to-br from-background to-blue-50/30 dark:to-blue-950/20">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                    </div>
                    <CardTitle className="heading-secondary">منابع الهام</CardTitle>
                  </div>
                  <p className="text-body">منابعی که الهام‌بخش ایده شما بوده‌اند را اضافه کنید</p>
                </div>
                <Button type="button" onClick={addInspiration} variant="outline" size="sm" className="interactive-button shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن منبع
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {inspirations.map((inspiration, index) => <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">منبع {index + 1}</span>
                    <Button type="button" onClick={() => removeInspiration(index)} variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={inspiration.sourceType} onValueChange={value => updateInspiration(index, "sourceType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sourceTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Input placeholder="توضیحات منبع..." value={inspiration.description} onChange={e => updateInspiration(index, "description", e.target.value)} />

                    <Input placeholder="لینک منبع (اختیاری)" value={inspiration.sourceUrl} onChange={e => updateInspiration(index, "sourceUrl", e.target.value)} />
                  </div>
                </div>)}
              
              {inspirations.length === 0 && <div className="text-center py-8 text-muted-foreground">
                  <p>هنوز منبع الهامی اضافه نکرده‌اید</p>
                  <p className="text-sm">منابع الهام به شما کمک می‌کند تا ایده‌تان را بهتر توسعه دهید</p>
                </div>}
            </CardContent>
          </Card>

          {/* AI Analysis Section */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                تحلیل با هوش مصنوعی
              </CardTitle>
              <CardDescription className="text-right mt-2">
                برای دریافت تحلیل هوش مصنوعی، ابتدا عنوان و توضیحات را کامل کنید، سپس روی دکمه "تحلیل با هوش مصنوعی" کلیک کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                type="button" 
                onClick={analyzeWithAI} 
                disabled={analysisStatus !== 'idle' || !form.watch('title') || !form.watch('description')} 
                className="w-full" 
                size="lg"
              >
                {analysisStatus === 'pending' || analysisStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    در حال تحلیل... (حدود 10-15 ثانیه)
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    تحلیل با هوش مصنوعی
                  </>
                )}
              </Button>

              {/* Analysis Progress Indicator */}
              {analysisStatus !== 'idle' && (
                <AnalysisProgressIndicator 
                  status={analysisStatus}
                  startTime={analysisStartTime || undefined}
                />
              )}

              {aiAnalysis && <div className="space-y-4 mt-6">
                  {/* SWOT Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تحلیل SWOT</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-700 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            نقاط قوت
                          </h4>
                          <ul className="text-sm space-y-1 list-disc list-inside text-green-600">
                            {aiAnalysis.strengths?.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            نقاط ضعف
                          </h4>
                          <ul className="text-sm space-y-1 list-disc list-inside text-red-600">
                            {aiAnalysis.weaknesses?.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            فرصت‌ها
                          </h4>
                          <ul className="text-sm space-y-1 list-disc list-inside text-blue-600">
                            {aiAnalysis.opportunities?.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            تهدیدها
                          </h4>
                          <ul className="text-sm space-y-1 list-disc list-inside text-orange-600">
                            {aiAnalysis.threats?.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue Opportunities (only for professional/organizational) */}
                  {aiAnalysis.revenueOpportunities && (domain === 'professional' || domain === 'organizational') && <Card className="border-green-200 bg-green-50/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          فرصت‌های درآمدزایی
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {aiAnalysis.revenueOpportunities.models && <div>
                            <h5 className="font-semibold text-sm mb-1">مدل‌های درآمدی:</h5>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              {aiAnalysis.revenueOpportunities.models.map((model: string, idx: number) => <li key={idx}>{model}</li>)}
                            </ul>
                          </div>}
                        {aiAnalysis.revenueOpportunities.marketSize && <div>
                            <h5 className="font-semibold text-sm mb-1">تخمین بازار:</h5>
                            <p className="text-sm">{aiAnalysis.revenueOpportunities.marketSize}</p>
                          </div>}
                        {aiAnalysis.revenueOpportunities.pricing && <div>
                            <h5 className="font-semibold text-sm mb-1">استراتژی قیمت‌گذاری:</h5>
                            <p className="text-sm">{aiAnalysis.revenueOpportunities.pricing}</p>
                          </div>}
                      </CardContent>
                    </Card>}

                  {/* Risks */}
                  {aiAnalysis.risks && aiAnalysis.risks.length > 0 && <Card className="border-orange-200 bg-orange-50/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          ریسک‌ها و راهکارها
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {aiAnalysis.risks.map((risk: any, idx: number) => <div key={idx} className="p-3 bg-white rounded-lg border">
                              <p className="font-medium text-sm mb-2">{risk.description}</p>
                              <div className="flex gap-2 mb-2">
                                <Badge variant={risk.probability === 'high' ? 'destructive' : 'outline'}>
                                  احتمال: {risk.probability === 'high' ? 'بالا' : risk.probability === 'medium' ? 'متوسط' : 'پایین'}
                                </Badge>
                                <Badge variant={risk.impact === 'high' ? 'destructive' : 'outline'}>
                                  تأثیر: {risk.impact === 'high' ? 'بالا' : risk.impact === 'medium' ? 'متوسط' : 'پایین'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>راهکار:</strong> {risk.mitigation}
                              </p>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>}

                  {/* Suggested Actions */}
                  {aiAnalysis.suggestedActions && aiAnalysis.suggestedActions.length > 0 && <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          اقدامات پیشنهادی
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aiAnalysis.suggestedActions.map((action: any, idx: number) => <div key={idx} className="p-3 bg-white rounded-lg border flex items-start gap-3">
                              <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'outline'}>
                                {action.priority === 'high' ? 'فوری' : action.priority === 'medium' ? 'مهم' : 'معمولی'}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{action.action}</p>
                                <p className="text-xs text-muted-foreground mt-1">زمان: {action.timeline}</p>
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>}
                </div>}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-4">
            
            <Button type="button" variant="outline" onClick={onSuccess}>
              انصراف
            </Button>
            <ModernButton type="submit" className="bg-primary hover:bg-primary-hover">
              ثبت ایده
            </ModernButton>
          </div>
        </form>
      </Form>
    </div>;
}