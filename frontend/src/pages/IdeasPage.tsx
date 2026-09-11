import { useState } from "react";
import { Plus, Lightbulb, Briefcase, Building2, BarChart3, Network } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { SectionHeader } from "@/components/ui/section-header";
import { LuxuryTabs } from "@/components/ui/luxury-tabs";
import { ModernCard } from "@/components/ui/modern-card";
import { TabsContent } from "@/components/ui/tabs";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { IdeaList } from "@/components/ideas/IdeaList";
import { IdeaDashboard } from "@/components/ideas/IdeaDashboard";
import { AnalysisHistory } from "@/components/ideas/AnalysisHistory";
import { IdeasGraph } from "@/components/ideas/IdeasGraph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";

const IdeasPage = () => {
  const [searchParams] = useSearchParams();
  const domainParam = searchParams.get('domain') || 'personal';
  const [activeTab, setActiveTab] = useState(domainParam);
  const [showForm, setShowForm] = useState(false);
  const isMobile = useIsMobile();

  const tabs = [
    {
      value: "personal",
      label: "ایده‌های شخصی",
      icon: Lightbulb,
      description: "ایده‌های شخصی و خلاقانه"
    },
    {
      value: "professional", 
      label: "ایده‌های حرفه‌ای",
      icon: Briefcase,
      description: "ایده‌های مرتبط با حوزه کاری"
    },
    {
      value: "organizational",
      label: "ایده‌های سازمانی", 
      icon: Building2,
      description: "ایده‌های سازمانی و تیمی"
    },
    {
      value: "graph",
      label: "گراف ارتباطات",
      icon: Network,
      description: "نمایش ارتباط بین ایده‌ها"
    },
    {
      value: "history",
      label: "تاریخچه تحلیل‌ها",
      icon: BarChart3,
      description: "مشاهده تاریخچه تحلیل‌های انجام شده"
    }
  ];

  // Fetch all ideas for graph view
  const { data: allIdeas } = useQuery({
    queryKey: ["all-ideas"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "graph",
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className={cn(
        "max-w-7xl mx-auto animate-fade-in",
        isMobile ? "p-4 space-y-6" : "p-8 spacing-relaxed"
      )}>
        <SectionHeader
          title="مدیریت ایده‌ها"
          subtitle="ایده‌هایتان را ثبت کنید، منابع الهام اضافه کنید و با هوش مصنوعی تحلیل کنید"
          icon={<AppIcon size="lg"><Lightbulb /></AppIcon>}
          gradient
          action={
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <ModernButton 
                  className="bg-gradient-luxury-gold hover:bg-gradient-luxury-ember"
                  magnetic
                  glow
                  size={isMobile ? "sm" : "default"}
                >
                  <AppIcon size="sm">
                    <Plus />
                  </AppIcon>
                  ایده جدید
                </ModernButton>
              </DialogTrigger>
              <DialogContent className={cn(
                isMobile 
                  ? "w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col m-2"
                  : "max-w-4xl max-h-[90vh]",
                "overflow-y-auto"
              )}>
                <DialogHeader>
                  <DialogTitle>ایجاد ایده جدید</DialogTitle>
                  <DialogDescription>
                    ایده جدید خود را در حوزه {activeTab === 'personal' ? 'شخصی' : activeTab === 'professional' ? 'حرفه‌ای' : 'سازمانی'} ثبت کنید
                  </DialogDescription>
                </DialogHeader>
                <IdeaForm 
                  domain={activeTab} 
                  onSuccess={() => setShowForm(false)} 
                />
              </DialogContent>
            </Dialog>
          }
        />

        {/* Dashboard Overview */}
        <IdeaDashboard />

        <LuxuryTabs
          items={tabs.map(tab => ({
            value: tab.value,
            label: isMobile ? tab.label.replace('‌های ', '') : tab.label,
            icon: <AppIcon size="sm"><tab.icon /></AppIcon>
          }))}
          value={activeTab}
          onValueChange={setActiveTab}
        >
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className={cn(
              isMobile ? "space-y-4" : "spacing-relaxed"
            )}>
              {tab.value === 'history' ? (
                <AnalysisHistory />
              ) : tab.value === 'graph' ? (
                <IdeasGraph ideas={allIdeas || []} />
              ) : (
                <ModernCard
                  title={tab.label}
                  subtitle={tab.description}
                  icon={<AppIcon size="sm"><tab.icon /></AppIcon>}
                  hover
                  glow
                >
                  <IdeaList domain={tab.value} />
                </ModernCard>
              )}
            </TabsContent>
          ))}
        </LuxuryTabs>
      </div>
    </div>
  );
};

export default IdeasPage;