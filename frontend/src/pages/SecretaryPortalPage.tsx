import React from 'react';
import { Shield, Users, Clock, Calendar, MessageSquare, Activity, Bell, AlertCircle, Settings, Phone, Mail, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { useCurrentUser } from '@/hooks/useUserManagement';

const SecretaryPortalPage = () => {
  const { currentUser } = useCurrentUser();
  
  // Type guard to check if currentUser is valid
  const isValidUser = (user: any): user is { user_id: string; first_name?: string; last_name?: string; display_name?: string; position?: string; avatar_url?: string } => {
    return user && typeof user === 'object' && 'user_id' in user && !('error' in user);
  };
  
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header - Fantasy Style */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-primary rounded-xl shadow-elegant hover-glow transform-gpu hover:scale-110 transition-elegant">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="p-2 bg-gradient-primary rounded-xl shadow-elegant animate-pulse">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              پورتال منشی فانتزی
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              سیستم مدیریت هوشمند درخواست‌های اداری با تجربه فانتزی و مدرن
            </p>
          </div>
          
          {/* Status Bar - Enhanced */}
          <div className="relative p-6 glass-card hover-glow shadow-floating transform-gpu hover:scale-105 transition-elegant rounded-xl border-0 bg-gradient-card">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-3 bg-medical-green/10 px-4 py-2 rounded-full">
                <div className="w-4 h-4 bg-medical-green rounded-full animate-pulse shadow-glow"></div>
                <span className="text-sm font-medium">سیستم فعال</span>
                <Zap className="h-4 w-4 text-medical-green" />
              </div>
              <Separator orientation="vertical" className="h-8 bg-gradient-primary opacity-30" />
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-primary/5 px-4 py-2 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
                آخرین بروزرسانی: {new Date().toLocaleString('fa-IR')}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-primary opacity-0 hover:opacity-5 transition-opacity rounded-xl"></div>
          </div>
        </div>

        {/* Main Content Grid - Fantasy Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions - Modern Card */}
          <ModernCard 
            title="اقدامات سریع فانتزی" 
            subtitle="دسترسی سریع به عملکردهای کلیدی"
            icon={<Activity className="h-6 w-6" />}
            hover={true}
            glow={true}
            gradient={true}
          >
            <div className="space-y-4">
              <ModernButton 
                className="w-full justify-start gap-4 h-14" 
                variant="hero"
                magnetic={true}
                glow={true}
                icon={<Calendar className="h-5 w-5" />}
              >
                ایجاد جلسه جادویی
              </ModernButton>
              <ModernButton 
                className="w-full justify-start gap-4 h-14" 
                variant="hero"
                magnetic={true}
                glow={true}
                icon={<MessageSquare className="h-5 w-5" />}
              >
                پیام فوری فانتزی
              </ModernButton>
              <ModernButton 
                className="w-full justify-start gap-4 h-14" 
                variant="hero"
                magnetic={true}
                glow={true}
                icon={<Bell className="h-5 w-5" />}
              >
                یادآوری هوشمند
              </ModernButton>
              <ModernButton 
                className="w-full justify-start gap-4 h-14" 
                variant="hero"
                magnetic={true}
                glow={true}
                icon={<Users className="h-5 w-5" />}
              >
                مدیریت مخاطبین
              </ModernButton>
            </div>
          </ModernCard>

          {/* System Status - Interactive */}
          <ModernCard 
            title="کنترل سیستم"
            subtitle="نظارت بر عملکرد و محدودیت‌ها"
            icon={<Settings className="h-6 w-6" />}
            hover={true}
            glow={true}
            gradient={true}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 glass-card rounded-xl hover-lift transition-elegant">
                <span className="text-sm font-medium">دسترسی‌ها</span>
                <Badge className="bg-medical-green/20 text-medical-green border-medical-green/30 shadow-glow animate-pulse">
                  🟢 فعال
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 glass-card rounded-xl hover-lift transition-elegant">
                <span className="text-sm font-medium">محدودیت درخواست</span>
                <Badge className="bg-medical-blue/20 text-medical-blue border-medical-blue/30 shadow-elegant">
                  ⚡ ۲۰/ساعت
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 glass-card rounded-xl hover-lift transition-elegant">
                <span className="text-sm font-medium">اطلاع‌رسانی</span>
                <Badge className="bg-medical-purple/20 text-medical-purple border-medical-purple/30 shadow-elegant">
                  📱 ایمیل + SMS
                </Badge>
              </div>
              <Separator className="bg-gradient-primary opacity-30" />
              <div className="text-xs text-muted-foreground bg-medical-amber/10 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-medical-amber animate-pulse" />
                تمام درخواست‌ها نیاز به تایید مدیر دارند
              </div>
            </div>
          </ModernCard>

          {/* Contact Information - Enhanced */}
          <ModernCard 
            title="ارتباطات VIP"
            subtitle="دسترسی سریع به مدیریت"
            icon={<Users className="h-6 w-6" />}
            hover={true}
            glow={true}
            gradient={true}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 glass-card rounded-xl hover-lift transition-elegant transform-gpu hover:scale-105">
                <Avatar className="h-14 w-14 shadow-floating border-2 border-primary/20 hover-glow">
                  <AvatarImage src={isValidUser(currentUser) ? currentUser.avatar_url : undefined} />
                  <AvatarFallback className="bg-gradient-primary text-white text-lg font-bold">
                    {isValidUser(currentUser) ? 
                      (currentUser.display_name?.[0] || currentUser.first_name?.[0] || 'ک') : 'ک'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-base bg-gradient-primary bg-clip-text text-transparent">
                    {isValidUser(currentUser) ? 
                      (currentUser.display_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'کاربر') : 'کاربر'}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {isValidUser(currentUser) ? (currentUser.position || 'کاربر') : 'کاربر'}
                  </p>
                </div>
              </div>
              <Separator className="bg-gradient-primary opacity-30" />
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 glass-card rounded-xl hover-lift transition-elegant">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">تلفن داخلی: 1000</span>
                </div>
                <div className="flex items-center gap-3 p-3 glass-card rounded-xl hover-lift transition-elegant">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">secretary@clinic.ir</span>
                </div>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Features Overview - Fantasy Enhanced */}
        <div className="mt-12">
          <ModernCard 
            title="راهنمای جادویی پورتال منشی"
            subtitle="تمام قابلیت‌ها و محدودیت‌های سیستم فانتزی"
            icon={<Shield className="h-6 w-6" />}
            hover={true}
            glow={true}
            gradient={true}
            className="shadow-floating"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  ویژگی‌های جادویی:
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Calendar, text: "ایجاد و مدیریت جلسات فانتزی" },
                    { icon: MessageSquare, text: "ارسال پیام‌های فوری با جلوه‌های ویژه" },
                    { icon: Bell, text: "یادآوری‌های هوشمند و تعاملی" },
                    { icon: Users, text: "مدیریت مخاطبین با امکانات پیشرفته" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 glass-card rounded-xl hover-lift transition-elegant transform-gpu hover:scale-105">
                      <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-medical-amber" />
                  محدودیت‌های سیستم:
                </h3>
                <div className="space-y-3">
                  {[
                    "حداکثر ۲۰ درخواست در ساعت",
                    "نیاز به تایید مدیر برای تمام درخواست‌ها",
                    "دسترسی محدود به اطلاعات حساس",
                    "ثبت کامل تمام فعالیت‌ها"
                  ].map((text, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-medical-amber/10 rounded-xl hover-lift transition-elegant border border-medical-amber/20">
                      <div className="p-1 bg-medical-amber/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-medical-amber" />
                      </div>
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModernCard>
        </div>

        {/* Footer - Enhanced */}
        <div className="mt-12 text-center">
          <div className="p-6 glass-card rounded-xl shadow-floating hover-glow transition-elegant transform-gpu hover:scale-105">
            <p className="text-base bg-gradient-primary bg-clip-text text-transparent font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              پورتال منشی فانتزی - نسخه ۲.۰ | طراحی شده برای تجربه مدرن و جادویی
              <Zap className="h-5 w-5 text-primary animate-pulse" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretaryPortalPage;