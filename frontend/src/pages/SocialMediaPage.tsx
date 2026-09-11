import { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { ResponsiveContainer, ResponsiveSection } from "@/components/ui/responsive-container";
import { ResponsiveLayout, ResponsiveStack } from "@/components/ui/responsive-layout";
import { ResponsiveHeading, ResponsiveText } from "@/components/ui/responsive-typography";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Linkedin, 
  Twitter, 
  Instagram, 
  Facebook,
  Youtube,
  MessageSquare,
  Heart,
  Share2,
  TrendingUp,
  Eye,
  Settings,
  Shield,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { socialMediaService } from "@/services/socialMediaService";

const platformConfig = {
  linkedin: { icon: Linkedin, name: "LinkedIn" },
  twitter: { icon: Twitter, name: "X (Twitter)" },
  instagram: { icon: Instagram, name: "Instagram" },
  facebook: { icon: Facebook, name: "Facebook" },
  youtube: { icon: Youtube, name: "YouTube" },
  bale: { icon: MessageSquare, name: "بله" },
  eitaa: { icon: MessageSquare, name: "ایتا" },
  rubika: { icon: MessageSquare, name: "روبیکا" }
};

const SocialMediaPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<any[]>([]);
  const [topInterests, setTopInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const platforms = socialMediaService.getConnectedPlatforms();
      const interests = socialMediaService.getTopInterests(5);
      
      setConnectedPlatforms(platforms);
      setTopInterests(interests);
    } catch (error) {
      console.error('خطا در بارگذاری داده‌های رسانه‌های اجتماعی:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPlatform = (url: string, platformId: string) => {
    setSelectedPlatform(platformId);
    window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  const handleConnect = (platformId: string) => {
    console.log('اتصال به پلتفرم:', platformId);
    // در آینده منطق اتصال واقعی اضافه می‌شود
  };

  const hasAnyData = connectedPlatforms.length > 0 || topInterests.length > 0;

  if (loading) {
    return (
      <ResponsiveContainer variant="page" className="bg-gradient-subtle">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <ResponsiveText variant="muted">در حال بارگذاری...</ResponsiveText>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  if (!hasAnyData) {
    return (
      <ResponsiveContainer variant="page" className="bg-gradient-subtle">
        <ResponsiveSection spacing="lg">
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-full bg-primary/10">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
            </div>
            <ResponsiveHeading level={2} className="mb-3">
              هاب رسانه‌های اجتماعی
            </ResponsiveHeading>
            <ResponsiveText variant="muted" className="mb-8 max-w-md mx-auto">
              شبکه‌های اجتماعی خود را متصل کنید و فعالیت‌های خود را مدیریت و تحلیل کنید
            </ResponsiveText>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {Object.entries(platformConfig).map(([id, config]) => {
                const Icon = config.icon;
                return (
                  <ModernButton
                    key={id}
                    variant="outline"
                    className="h-auto py-4 justify-start"
                    onClick={() => handleConnect(id)}
                  >
                    <Icon className="h-5 w-5 ml-3" />
                    <div className="text-right">
                      <div className="font-semibold">{config.name}</div>
                      <ResponsiveText size="xs" variant="muted">اتصال حساب کاربری</ResponsiveText>
                    </div>
                  </ModernButton>
                );
              })}
            </div>
          </div>
        </ResponsiveSection>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer variant="page" className="bg-gradient-subtle">
      <ResponsiveSection spacing="lg">
        <SectionHeader
          title="هاب رسانه‌های اجتماعی"
          subtitle="مدیریت و تحلیل حضور در شبکه‌های اجتماعی"
          icon={<Share2 className="h-6 w-6" />}
          action={
            <div className="flex items-center gap-3">
              <ModernButton variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </ModernButton>
              <ModernButton variant="outline" size="icon">
                <Shield className="h-4 w-4" />
              </ModernButton>
            </div>
          }
          gradient
        />

        <ResponsiveLayout 
          cols={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="md"
        >
          {connectedPlatforms.map((platform) => {
            const config = platformConfig[platform.id as keyof typeof platformConfig];
            if (!config) return null;
            
            const Icon = config.icon;
            
            return (
              <ResponsiveCard 
                key={platform.id}
                title={config.name}
                icon={<Icon className="h-5 w-5" />}
                hover
                glow
              >
                <ResponsiveStack spacing="md">
                  <div className="flex items-center justify-between">
                    <Badge variant={platform.connected ? "default" : "secondary"}>
                      {platform.connected ? "متصل" : "غیرمتصل"}
                    </Badge>
                  </div>
                  
                  {platform.lastSync && (
                    <ResponsiveText size="sm" variant="muted">
                      آخرین بروزرسانی: {platform.lastSync}
                    </ResponsiveText>
                  )}
                  
                  {platform.connected ? (
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          لایک‌ها
                        </span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          کامنت‌ها
                        </span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          اشتراک‌ها
                        </span>
                        <span className="font-medium">12</span>
                      </div>
                      <ModernButton 
                        className="w-full mt-3" 
                        onClick={() => openPlatform(platform.url, platform.id)}
                        icon={<ExternalLink className="h-4 w-4" />}
                      >
                        باز کردن
                      </ModernButton>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ResponsiveText size="sm" variant="muted" className="mb-3">
                        هنوز متصل نشده
                      </ResponsiveText>
                      <ModernButton variant="outline" className="w-full" onClick={() => handleConnect(platform.id)}>
                        اتصال
                      </ModernButton>
                    </div>
                  )}
                </ResponsiveStack>
              </ResponsiveCard>
            );
          })}
        </ResponsiveLayout>

        {topInterests.length > 0 && (
          <ResponsiveLayout 
            cols={{ mobile: 1, tablet: 1, desktop: 2 }}
            gap="md"
          >
            <ResponsiveCard
              title="تحلیل علایق"
              icon={<TrendingUp className="h-5 w-5" />}
              hover
              glow
            >
              <ResponsiveText size="sm" variant="muted" className="mb-4">
                بر اساس فعالیت شما در شبکه‌های اجتماعی
              </ResponsiveText>
              <div className="space-y-3 md:space-y-4">
                {topInterests.map((interest, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <ResponsiveText size="sm" className="font-medium">{interest.category}</ResponsiveText>
                      <ResponsiveText size="sm" variant="muted">{Math.round(interest.weight * 100)}%</ResponsiveText>
                    </div>
                    <Progress value={interest.weight * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </ResponsiveCard>

            <ResponsiveCard
              title="خلاصه فعالیت"
              icon={<Eye className="h-5 w-5" />}
              hover
              glow
            >
              <ResponsiveText size="sm" variant="muted" className="mb-4">
                آمار هفته گذشته
              </ResponsiveText>
              <ResponsiveLayout 
                cols={{ mobile: 2, tablet: 2, desktop: 2 }}
                gap="sm"
              >
                <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
                  <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold heading-primary">
                    156
                  </ResponsiveHeading>
                  <ResponsiveText size="sm" variant="muted">بازدید پست‌ها</ResponsiveText>
                </div>
                <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
                  <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold heading-primary">
                    32
                  </ResponsiveHeading>
                  <ResponsiveText size="sm" variant="muted">تعامل جدید</ResponsiveText>
                </div>
                <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
                  <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold heading-primary">
                    8
                  </ResponsiveHeading>
                  <ResponsiveText size="sm" variant="muted">پست جدید</ResponsiveText>
                </div>
                <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
                  <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold heading-primary">
                    24
                  </ResponsiveHeading>
                  <ResponsiveText size="sm" variant="muted">دنبال‌کننده جدید</ResponsiveText>
                </div>
              </ResponsiveLayout>
            </ResponsiveCard>
          </ResponsiveLayout>
        )}

        <ResponsiveCard className="border-lux-amber bg-lux-amber/10" hover={false}>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-lux-amber mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <ResponsiveHeading level={3} weight="medium" className="text-lux-midnight mb-2">
                حفظ حریم خصوصی
              </ResponsiveHeading>
              <ResponsiveText size="sm" variant="muted">
                تمام داده‌های شما با رمزگذاری محافظت می‌شوند و تنها برای بهبود تجربه شما استفاده می‌شوند. 
                شما می‌توانید در هر زمان ردیابی رفتار را غیرفعال کنید.
              </ResponsiveText>
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default SocialMediaPage;
