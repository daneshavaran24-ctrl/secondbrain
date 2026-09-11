import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Edit, TrendingUp, AlertTriangle, Target, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IdeaDetails } from "./IdeaDetails";
import { ConvertToTaskDialog } from "./ConvertToTaskDialog";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface IdeaListProps {
  domain: string;
}

export function IdeaList({ domain }: IdeaListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [ideaToConvert, setIdeaToConvert] = useState<any>(null);

  const { data: ideas, isLoading, refetch } = useQuery({
    queryKey: ["ideas", domain, searchTerm, stageFilter, priorityFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from("ideas")
        .select(`
          *,
          idea_inspirations(*),
          idea_risks(*),
          idea_milestones(*),
          idea_swot_analysis(*)
        `)
        .eq("user_id", user.id);

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (stageFilter !== "all") {
        query = query.eq("stage", stageFilter as any);
      }
      
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter as any);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Process ideas to include SWOT analysis
      const processedIdeas = data?.map(idea => ({
        ...idea,
        swotAnalysis: idea.idea_swot_analysis?.[0] ? {
          strengths: (idea.idea_swot_analysis[0] as any).strengths || [],
          weaknesses: (idea.idea_swot_analysis[0] as any).weaknesses || [],
          opportunities: (idea.idea_swot_analysis[0] as any).opportunities || [],
          threats: (idea.idea_swot_analysis[0] as any).threats || [],
          soStrategies: (idea.idea_swot_analysis[0] as any).so_strategies || [],
          stStrategies: (idea.idea_swot_analysis[0] as any).st_strategies || [],
          woStrategies: (idea.idea_swot_analysis[0] as any).wo_strategies || [],
          wtStrategies: (idea.idea_swot_analysis[0] as any).wt_strategies || [],
          overallAssessment: (idea.idea_swot_analysis[0] as any).overall_assessment,
          priorityActions: (idea.idea_swot_analysis[0] as any).priority_actions || []
        } : null
      })) || [];
      
      return processedIdeas;
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400";
      case "medium": return "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400";
      case "low": return "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "concept": return "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400";
      case "research": return "bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400";
      case "development": return "bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400";
      case "testing": return "bg-pink-500/10 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-400";
      case "implementation": return "bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400";
      case "launched": return "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const stageLabels = {
    concept: "مفهوم",
    research: "تحقیق", 
    development: "توسعه",
    testing: "آزمایش",
    implementation: "اجرا",
    launched: "راه‌اندازی"
  };

  const priorityLabels = {
    high: "بالا",
    medium: "متوسط",
    low: "کم"
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-primary">ایده‌های من</h1>
            <p className="text-body mt-1">مدیریت و مشاهده ایده‌های ثبت شده</p>
          </div>
          {ideas && ideas.length > 0 && (
            <div className="text-caption">
              <span className="font-medium text-foreground">{ideas.length}</span> ایده ثبت شده
            </div>
          )}
        </div>

        {/* Enhanced Filters */}
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="جستجو در عنوان و توضیحات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
              />
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="فیلتر مرحله" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-sm">
                <SelectItem value="all">همه مراحل</SelectItem>
                {Object.entries(stageLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="فیلتر اولویت" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-sm">
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Enhanced Ideas Grid */}
      {ideas && ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea: any, index: number) => (
            <Card 
              key={idea.id} 
              className="interactive-card glass-card border-border/30 hover:border-primary/30 group slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <CardTitle className="heading-tertiary line-clamp-2 group-hover:text-primary transition-colors">
                    {idea.title}
                  </CardTitle>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge className={`${getPriorityColor(idea.priority)} font-medium`}>
                      {priorityLabels[idea.priority as keyof typeof priorityLabels]}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className={`${getStageColor(idea.stage)} font-medium w-fit`}>
                  {stageLabels[idea.stage as keyof typeof stageLabels]}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {idea.description && (
                  <p className="text-body line-clamp-3">
                    {idea.description}
                  </p>
                )}
                
                {/* Enhanced Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-caption">
                    <div className="flex items-center gap-3 flex-wrap">
                      {idea.feasibility_score && (
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md">
                          <TrendingUp className="w-3 h-3 text-blue-600" />
                          <span className="font-medium">{idea.feasibility_score}/10</span>
                        </div>
                      )}
                      {idea.potential_impact && (
                        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-md">
                          <Target className="w-3 h-3 text-purple-600" />
                          <span className="font-medium">{idea.potential_impact}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-caption">
                    <div className="flex items-center gap-3">
                      {idea.idea_risks && idea.idea_risks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          <span>{idea.idea_risks.length} ریسک</span>
                        </div>
                      )}
                      {idea.swotAnalysis && (
                        <div className="flex items-center gap-1">
                          <div className="status-dot status-success"></div>
                          <span className="text-green-600 font-medium">SWOT</span>
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(idea.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 interactive-button bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground"
                        onClick={() => setSelectedIdea(idea)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        جزئیات
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle>جزئیات ایده</DialogTitle>
                        <DialogDescription>
                          مشاهده و ویرایش جزئیات کامل ایده
                        </DialogDescription>
                      </DialogHeader>
                      {selectedIdea && (
                        <IdeaDetails idea={selectedIdea} onUpdate={refetch} />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="interactive-button border-border/50"
                    onClick={() => {
                      setIdeaToConvert(idea);
                      setConvertDialogOpen(true);
                    }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                  
                  <Button variant="outline" size="sm" className="interactive-button border-border/50">
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Filter className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="heading-tertiary mb-3">
              {searchTerm || stageFilter !== "all" || priorityFilter !== "all" 
                ? "ایده‌ای یافت نشد" 
                : "هنوز ایده‌ای ثبت نکرده‌اید"
              }
            </h3>
            <p className="text-body-large mb-6 max-w-md mx-auto">
              {searchTerm || stageFilter !== "all" || priorityFilter !== "all" 
                ? "فیلترهای جستجو را تغییر دهید یا ایده جدیدی اضافه کنید"
                : "شروع کنید با ثبت اولین ایده خود و از قابلیت‌های پیشرفته تحلیل بهره‌مند شوید"
              }
            </p>
            {(searchTerm || stageFilter !== "all" || priorityFilter !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStageFilter("all");
                  setPriorityFilter("all");
                }}
                className="interactive-button"
              >
                پاک کردن فیلترها
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Convert to Task Dialog */}
      {ideaToConvert && (
        <ConvertToTaskDialog
          idea={ideaToConvert}
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
        />
      )}
    </div>
  );
}