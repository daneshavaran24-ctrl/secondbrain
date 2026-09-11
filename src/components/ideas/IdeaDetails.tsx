import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SWOTMatrix } from "./SWOTMatrix";
import { ConvertToTaskDialog } from "./ConvertToTaskDialog";
import { RevenueOpportunityAnalysis } from "./RevenueOpportunityAnalysis";
import { BusinessModelCanvas } from "./BusinessModelCanvas";
import { IdeaDetailsEnhanced } from "./IdeaDetailsEnhanced";
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  BookOpen,
  Video,
  Headphones,
  MessageCircle,
  User,
  FileText,
  ArrowRight,
  Package,
  Lightbulb,
  Info
} from "lucide-react";
import { IdeaPdfExportButton } from "./IdeaPdfExportButton";

interface IdeaDetailsProps {
  idea: any;
  onUpdate: () => void;
}

export function IdeaDetails({ idea, onUpdate }: IdeaDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "book": return BookOpen;
      case "article": return FileText;
      case "video": return Video;
      case "podcast": return Headphones;
      case "conversation": return MessageCircle;
      case "experience": return User;
      default: return FileText;
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

  const priorityLabels = {
    high: "بالا",
    medium: "متوسط",
    low: "کم"
  };

  const stageLabels = {
    concept: "مفهوم",
    research: "تحقیق",
    development: "توسعه",
    testing: "آزمایش",
    implementation: "اجرا",
    launched: "راه‌اندازی"
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "concept": return "bg-blue-100 text-blue-800 border-blue-200";
      case "research": return "bg-purple-100 text-purple-800 border-purple-200";
      case "development": return "bg-orange-100 text-orange-800 border-orange-200";
      case "testing": return "bg-pink-100 text-pink-800 border-pink-200";
      case "implementation": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "launched": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskColor = (probability: number, impact: number) => {
    const score = probability * impact;
    if (score >= 70) return "border-red-200 bg-red-50";
    if (score >= 40) return "border-orange-200 bg-orange-50";
    return "border-yellow-200 bg-yellow-50";
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <h1 className="heading-primary">{idea.title}</h1>
              <div className="flex flex-wrap gap-3">
                <Badge className={`${getPriorityColor(idea.priority)} font-medium px-3 py-1`}>
                  {priorityLabels[idea.priority as keyof typeof priorityLabels]}
                </Badge>
                <Badge className={`${getStageColor(idea.stage)} font-medium px-3 py-1`}>
                  {stageLabels[idea.stage as keyof typeof stageLabels]}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <IdeaPdfExportButton idea={idea} size="sm" />
                <Button
                  onClick={() => setConvertDialogOpen(true)}
                  className="gap-2"
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  تبدیل به وظیفه
                </Button>
              </div>
              <div className="text-caption text-right">
                <div>ایجاد: {new Date(idea.created_at).toLocaleDateString('fa-IR')}</div>
                <div>بروزرسانی: {new Date(idea.updated_at).toLocaleDateString('fa-IR')}</div>
              </div>
            </div>
          </div>
          
          {idea.description && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-6">
                <p className="text-body-large leading-relaxed">{idea.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 bg-muted/50 p-1 h-auto">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <Info className="w-4 h-4 mr-2" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger 
            value="revenue" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            فرصت‌های درآمد
          </TabsTrigger>
          <TabsTrigger 
            value="bmc" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <Package className="w-4 h-4 mr-2" />
            مدل کسب‌وکار
          </TabsTrigger>
          <TabsTrigger 
            value="swot" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <Target className="w-4 h-4 mr-2" />
            SWOT
          </TabsTrigger>
          <TabsTrigger 
            value="inspirations" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            منابع الهام
          </TabsTrigger>
          <TabsTrigger 
            value="risks" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            ریسک‌ها
          </TabsTrigger>
          <TabsTrigger 
            value="milestones" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <Calendar className="w-4 h-4 mr-2" />
            نقاط عطف
          </TabsTrigger>
          <TabsTrigger 
            value="enhanced" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            تحلیل تکمیلی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {idea.feasibility_score !== null && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">امکان‌پذیری</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{idea.feasibility_score}/10</div>
                    <Progress value={idea.feasibility_score * 10} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            )}

            {idea.potential_impact !== null && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">تأثیر بالقوه</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{idea.potential_impact}/10</div>
                    <Progress value={idea.potential_impact * 10} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            )}

            {idea.estimated_budget && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">بودجه تخمینی</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-bold">
                      {idea.estimated_budget.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {idea.expected_roi && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">بازده مورد انتظار</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{idea.expected_roi}%</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {idea.target_market && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">بازار هدف</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{idea.target_market}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات زمانی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>تاریخ ایجاد: {new Date(idea.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>آخرین بروزرسانی: {new Date(idea.updated_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <RevenueOpportunityAnalysis idea={idea} />
          </TabsContent>

          <TabsContent value="bmc" className="space-y-4">
            <BusinessModelCanvas idea={idea} />
          </TabsContent>

          <TabsContent value="swot" className="space-y-4">
            {idea.swotAnalysis ? (
              <SWOTMatrix 
                data={idea.swotAnalysis} 
                showStrategies={true}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">تحلیل SWOT در دسترس نیست</h3>
                  <p className="text-muted-foreground">
                    برای این ایده هنوز تحلیل SWOT انجام نشده است. می‌توانید با ویرایش ایده، تحلیل جدید درخواست کنید.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inspirations" className="space-y-4">
          {idea.idea_inspirations && idea.idea_inspirations.length > 0 ? (
            <div className="grid gap-4">
              {idea.idea_inspirations.map((inspiration: any, index: number) => {
                const SourceIcon = getSourceIcon(inspiration.source_type);
                return (
                  <Card key={inspiration.id} className="hover-lift transition-elegant">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <SourceIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {sourceTypeLabels[inspiration.source_type as keyof typeof sourceTypeLabels]}
                            </Badge>
                          </div>
                          <p className="text-sm">{inspiration.description}</p>
                          {inspiration.source_url && (
                            <a 
                              href={inspiration.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              مشاهده منبع
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">منبع الهامی ثبت نشده</h3>
                <p className="text-muted-foreground">برای این ایده هنوز منبع الهامی اضافه نشده است</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          {idea.idea_risks && idea.idea_risks.length > 0 ? (
            <div className="grid gap-4">
              {idea.idea_risks.map((risk: any) => (
                <Card key={risk.id} className={`border ${getRiskColor(risk.probability, risk.impact)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-medium">{risk.risk_type}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">احتمال وقوع:</span>
                            <Progress value={risk.probability} className="mt-1" />
                            <span className="text-muted-foreground">{risk.probability}%</span>
                          </div>
                          <div>
                            <span className="font-medium">شدت تأثیر:</span>
                            <Progress value={risk.impact} className="mt-1" />
                            <span className="text-muted-foreground">{risk.impact}%</span>
                          </div>
                        </div>

                        {risk.mitigation_strategy && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <h5 className="text-xs font-medium mb-1">راهکار کاهش ریسک:</h5>
                            <p className="text-xs text-muted-foreground">{risk.mitigation_strategy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">ریسکی شناسایی نشده</h3>
                <p className="text-muted-foreground">برای این ایده هنوز ریسکی شناسایی نشده است</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          {idea.idea_milestones && idea.idea_milestones.length > 0 ? (
            <div className="space-y-4">
              {idea.idea_milestones.map((milestone: any, index: number) => (
                <Card key={milestone.id} className="hover-lift transition-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        milestone.completed ? 'bg-green-500' : 'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {milestone.title}
                          </h4>
                          {milestone.completed && (
                            <Badge className="bg-green-100 text-green-800">تکمیل شده</Badge>
                          )}
                        </div>
                        
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {milestone.target_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>هدف: {new Date(milestone.target_date).toLocaleDateString('fa-IR')}</span>
                            </div>
                          )}
                          {milestone.completed_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>تکمیل: {new Date(milestone.completed_at).toLocaleDateString('fa-IR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">نقطه عطفی تعریف نشده</h3>
                <p className="text-muted-foreground">برای این ایده هنوز نقطه عطفی تعریف نشده است</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-4">
          <IdeaDetailsEnhanced ideaId={idea.id} />
        </TabsContent>
      </Tabs>
      
      {/* Convert to Task Dialog */}
      <ConvertToTaskDialog
        idea={idea}
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
      />
    </div>
  );
}