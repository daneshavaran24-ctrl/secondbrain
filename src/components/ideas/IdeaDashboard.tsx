import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Briefcase, Building2, TrendingUp, Target, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function IdeaDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["idea-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get ideas by stage
      const { data: ideas, error } = await supabase
        .from("ideas")
        .select(`
          *,
          idea_risks(id),
          idea_milestones(id, completed)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Calculate statistics
      const totalIdeas = ideas.length;
      const personalIdeas = ideas.filter(idea => !idea.organization_id).length;
      const averageFeasibility = ideas.reduce((acc, idea) => acc + (idea.feasibility_score || 0), 0) / totalIdeas;
      const averageImpact = ideas.reduce((acc, idea) => acc + (idea.impact_score || 0), 0) / totalIdeas;
      const totalRisks = ideas.reduce((acc, idea) => acc + (idea.idea_risks?.length || 0), 0);
      const completedMilestones = ideas.reduce((acc, idea) => 
        acc + (idea.idea_milestones?.filter((m: any) => m.completed).length || 0), 0
      );
      const totalMilestones = ideas.reduce((acc, idea) => acc + (idea.idea_milestones?.length || 0), 0);

      const stageStats = ideas.reduce((acc: any, idea) => {
        acc[idea.stage] = (acc[idea.stage] || 0) + 1;
        return acc;
      }, {});

      const priorityStats = ideas.reduce((acc: any, idea) => {
        acc[idea.priority] = (acc[idea.priority] || 0) + 1;
        return acc;
      }, {});

      return {
        totalIdeas,
        personalIdeas,
        averageFeasibility: Math.round(averageFeasibility * 10) / 10,
        averageImpact: Math.round(averageImpact * 10) / 10,
        totalRisks,
        completedMilestones,
        totalMilestones,
        stageStats,
        priorityStats,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const stageLabels = {
    concept: "مفهوم",
    research: "تحقیق",
    development: "توسعه",
    testing: "آزمایش",
    implementation: "اجرا",
    launched: "راه‌اندازی"
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">کل ایده‌ها</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.totalIdeas}</div>
              <p className="text-xs text-muted-foreground">ایده ثبت شده</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">میانگین امکان‌پذیری</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.averageFeasibility}/10</div>
              <p className="text-xs text-muted-foreground">امتیاز متوسط</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">میانگین تأثیر</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.averageImpact}/10</div>
              <p className="text-xs text-muted-foreground">امتیاز متوسط</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">کل ریسک‌ها</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats.totalRisks}</div>
              <p className="text-xs text-muted-foreground">ریسک شناسایی شده</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">توزیع بر اساس مرحله</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stageLabels).map(([stage, label]) => {
                const count = stats.stageStats[stage] || 0;
                const percentage = stats.totalIdeas > 0 ? Math.round((count / stats.totalIdeas) * 100) : 0;
                
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Milestone Progress */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">پیشرفت نقاط عطف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stats.totalMilestones > 0 ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">نقاط عطف تکمیل شده</p>
              </div>
              
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats.totalMilestones > 0 ? (stats.completedMilestones / stats.totalMilestones) * 100 : 0}%` 
                  }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{stats.completedMilestones} تکمیل شده</span>
                <span>{stats.totalMilestones} کل</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}