import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Target, 
  Users, 
  TrendingUp, 
  CheckSquare, 
  Clock,
  Brain,
  BarChart3,
  Kanban,
  List,
  Grid,
  MessageSquare,
  Lightbulb,
  Zap,
  Shield,
  Rocket,
  Building,
  Play,
  BookOpen
} from "lucide-react";
import { TutorialManager } from '../tutorial/TutorialManager';

type PlanningVariant = 'personal' | 'professional' | 'organizational';

interface PlanningHelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  variant: PlanningVariant;
}

const variantConfig = {
  personal: {
    title: "راهنمای برنامه‌ریزی فردی",
    color: "bg-blue-500",
    icon: Target,
    categories: ["کار", "خانواده", "سلامت", "آموزش", "تفریح"]
  },
  professional: {
    title: "راهنمای برنامه‌ریزی حرفه‌ای", 
    color: "bg-green-500",
    icon: TrendingUp,
    categories: ["پروژه", "جلسه", "مهلت", "تیم", "توسعه"]
  },
  organizational: {
    title: "راهنمای برنامه‌ریزی سازمانی",
    color: "bg-purple-500", 
    icon: Building,
    categories: ["استراتژی", "عملیات", "منابع", "کنترل", "توسعه"]
  }
};

export function PlanningHelpGuide({ isOpen, onClose, variant }: PlanningHelpGuideProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;
  const [showTutorial, setShowTutorial] = useState(false);

  const handleStartTutorial = () => {
    setShowTutorial(true);
    onClose(); // Close the help guide to show tutorial
  };

  const getQuickStartSteps = () => {
    switch (variant) {
      case 'personal':
        return [
          { title: "ایجاد وظیفه جدید", desc: "روی دکمه + کلیک کنید" },
          { title: "انتخاب دسته‌بندی", desc: "دسته مناسب را انتخاب کنید" },
          { title: "تنظیم اولویت", desc: "سطح اهمیت را مشخص کنید" },
          { title: "تعیین مهلت", desc: "تاریخ انجام را انتخاب کنید" }
        ];
      case 'professional':
        return [
          { title: "ایجاد پروژه", desc: "پروژه جدید تعریف کنید" },
          { title: "تقسیم کار", desc: "وظایف را تقسیم کنید" },
          { title: "تعیین مسئول", desc: "افراد مسئول را مشخص کنید" },
          { title: "پیگیری پیشرفت", desc: "از نمای کانبان استفاده کنید" }
        ];
      case 'organizational':
        return [
          { title: "تعریف اهداف", desc: "اهداف راهبردی تعیین کنید" },
          { title: "تخصیص منابع", desc: "بودجه و نیرو تخصیص دهید" },
          { title: "تعیین KPI", desc: "شاخص‌های عملکرد مشخص کنید" },
          { title: "نظارت مستمر", desc: "از داشبورد نظارتی استفاده کنید" }
        ];
    }
  };

  const getAIFeatures = () => {
    switch (variant) {
      case 'personal':
        return [
          { title: "منتور شخصی", desc: "مشاوره برای بهبود عادات" },
          { title: "کوچ انگیزشی", desc: "راهنمایی برای دستیابی به اهداف" }
        ];
      case 'professional':
        return [
          { title: "مشاور حرفه‌ای", desc: "راهنمایی تخصصی کاری" },
          { title: "تحلیل‌گر عملکرد", desc: "بررسی بهره‌وری تیم" }
        ];
      case 'organizational':
        return [
          { title: "مشاور استراتژی", desc: "راهنمایی برنامه‌ریزی راهبردی" },
          { title: "تحلیل‌گر سازمانی", desc: "ارزیابی عملکرد کلی" }
        ];
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className={`p-2 ${config.color} text-white rounded-lg`}>
                <IconComponent className="w-6 h-6" />
              </div>
              {config.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="guide" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                راهنمای کلی
              </TabsTrigger>
              <TabsTrigger value="tutorial" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                آموزش گام‌به‌گام
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guide" className="space-y-6">
          {/* شروع سریع */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Rocket className="w-5 h-5 text-primary" />
                شروع سریع
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {getQuickStartSteps().map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="secondary" className="min-w-fit">{index + 1}</Badge>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* نماهای مختلف */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Grid className="w-5 h-5 text-primary" />
                نماهای مختلف
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <List className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium">نمای لیست</h4>
                    <p className="text-xs text-muted-foreground">مشاهده جزئیات کامل</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">نمای تقویم</h4>
                    <p className="text-xs text-muted-foreground">برنامه‌ریزی زمانی</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Kanban className="w-5 h-5 text-purple-500" />
                  <div>
                    <h4 className="font-medium">نمای کانبان</h4>
                    <p className="text-xs text-muted-foreground">مدیریت جریان کار</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Target className="w-5 h-5 text-orange-500" />
                  <div>
                    <h4 className="font-medium">ماتریس اولویت</h4>
                    <p className="text-xs text-muted-foreground">اولویت‌بندی هوشمند</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <BarChart3 className="w-5 h-5 text-red-500" />
                  <div>
                    <h4 className="font-medium">نمای آمار</h4>
                    <p className="text-xs text-muted-foreground">تحلیل عملکرد</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Users className="w-5 h-5 text-teal-500" />
                  <div>
                    <h4 className="font-medium">نمای اسکرام</h4>
                    <p className="text-xs text-muted-foreground">مدیریت چابک</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* کمکی‌های هوش مصنوعی */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Brain className="w-5 h-5 text-primary" />
                کمکی‌های هوش مصنوعی
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {getAIFeatures().map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* دسته‌بندی‌ها */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Shield className="w-5 h-5 text-primary" />
                دسته‌بندی‌های پیشنهادی
              </h3>
              <div className="flex flex-wrap gap-2">
                {config.categories.map((category, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* نکات کاربردی */}
          <Card>
            <CardContent className="p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                نکات کاربردی
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-medium">میانبرهای کلیدی</h4>
                    <p className="text-sm text-muted-foreground">
                      Ctrl+N برای وظیفه جدید، Ctrl+/ برای جستجو
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">مدیریت زمان</h4>
                    <p className="text-sm text-muted-foreground">
                      از تکنیک پومودورو استفاده کنید و استراحت‌های منظم داشته باشید
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckSquare className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">تکمیل وظایف</h4>
                    <p className="text-sm text-muted-foreground">
                      وظایف بزرگ را به قسمت‌های کوچکتر تقسیم کنید
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="tutorial" className="space-y-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">آموزش تعاملی گام‌به‌گام</h3>
                      <p className="text-muted-foreground mb-6">
                        با راهنمایی مرحله به مرحله، نحوه استفاده از تمام امکانات سیستم را یاد بگیرید
                      </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 w-full mb-6">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                        <h4 className="font-medium">راهنمایی دقیق</h4>
                        <p className="text-xs text-muted-foreground">هر مرحله به تفصیل</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                        <h4 className="font-medium">تعامل واقعی</h4>
                        <p className="text-xs text-muted-foreground">کار با عناصر اصلی</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <CheckSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                        <h4 className="font-medium">پیگیری پیشرفت</h4>
                        <p className="text-xs text-muted-foreground">ذخیره خودکار مراحل</p>
                      </div>
                    </div>
                    <Button onClick={handleStartTutorial} size="lg" className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      شروع آموزش تعاملی
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <TutorialManager
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        variant={variant}
        onComplete={() => {
          setShowTutorial(false);
          // Could show completion message or badge
        }}
      />
    </>
  );
}