import React, { useEffect, useState } from 'react';
import { Heart, Activity, TrendingUp, Calendar, Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveContainer, ResponsiveSection } from '@/components/ui/responsive-container';
import { ResponsiveLayout } from '@/components/ui/responsive-layout';
import { ResponsiveHeading, ResponsiveText } from '@/components/ui/responsive-typography';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ModernButton } from '@/components/ui/modern-button';
import { healthService, HealthMetrics, WeeklyTrend, HealthRecommendation } from '@/services/healthService';
import { supabase } from '@/integrations/supabase/client';

const HealthPage = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend | null>(null);
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [todaysMetrics, todaysActivities, trends] = await Promise.all([
        healthService.getTodaysMetrics(),
        healthService.getTodaysActivities(),
        healthService.getWeeklyTrends()
      ]);

      setMetrics(todaysMetrics);
      setActivities(todaysActivities);
      setWeeklyTrends(trends);

      const smartRecommendations = await healthService.getSmartRecommendations(todaysMetrics);
      setRecommendations(smartRecommendations);

    } catch (err) {
      console.error('Error loading health data:', err);
      setError('خطا در بارگیری اطلاعات سلامت');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  // Realtime subscription for health_metrics updates from assistant
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('health-metrics-realtime')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'health_metrics', 
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            console.log('[HealthPage] Realtime update received:', payload);
            loadHealthData();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleStartTracking = () => {
    // This would open a modal to add health metrics
    console.log('Start tracking health metrics');
  };

  const handleAddActivity = () => {
    // This would open a modal to add an activity
    console.log('Add activity');
  };

  if (isLoading) {
    return (
      <ResponsiveContainer variant="page" className="bg-gradient-subtle">
        <ResponsiveSection spacing="lg">
          <SectionHeader
            title="سلامت و بهره‌وری"
            subtitle="پایش وضعیت انرژی و تمرکز هوشمند"
            icon={<Heart className="h-6 w-6" />}
            gradient
          />
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </ResponsiveSection>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer variant="page" className="bg-gradient-subtle">
        <ResponsiveSection spacing="lg">
          <SectionHeader
            title="سلامت و بهره‌وری"
            subtitle="پایش وضعیت انرژی و تمرکز هوشمند"
            icon={<Heart className="h-6 w-6" />}
            gradient
          />
          <EmptyState
            icon={<Heart className="h-12 w-12" />}
            title="خطا در بارگیری"
            description={error}
            action={{
              label: "تلاش مجدد",
              onClick: loadHealthData,
              icon: <Activity className="h-4 w-4" />
            }}
          />
        </ResponsiveSection>
      </ResponsiveContainer>
    );
  }

  // Show empty state for new users
  if (!metrics && activities.length === 0) {
    return (
      <ResponsiveContainer variant="page" className="bg-gradient-subtle">
        <ResponsiveSection spacing="lg">
          <SectionHeader
            title="سلامت و بهره‌وری"
            subtitle="پایش وضعیت انرژی و تمرکز هوشمند"
            icon={<Heart className="h-6 w-6" />}
            gradient
          />
          <EmptyState
            icon={<Heart className="h-12 w-12" />}
            title="شروع ردیابی سلامت"
            description="برای مشاهده آمارهای سلامت و بهره‌وری، ابتدا اطلاعات خود را ثبت کنید"
            action={{
              label: "شروع ثبت اطلاعات",
              onClick: handleStartTracking,
              icon: <Plus className="h-4 w-4" />
            }}
          />
        </ResponsiveSection>
      </ResponsiveContainer>
    );
  }

  // Prepare metrics for display
  const displayMetrics = metrics ? [
    { label: 'وزن', value: metrics.weight ? `${metrics.weight} کیلوگرم` : '-', color: 'text-green-500' },
    { label: 'ساعت خواب', value: metrics.sleep_hours ? `${metrics.sleep_hours} ساعت` : '-', color: 'text-blue-500' },
    { label: 'ورزش', value: metrics.exercise_minutes ? `${metrics.exercise_minutes} دقیقه` : '-', color: 'text-orange-500' },
    { label: 'آب', value: metrics.water_intake ? `${metrics.water_intake} لیوان` : '-', color: 'text-purple-500' }
  ] : [];

  return (
    <ResponsiveContainer variant="page" className="bg-gradient-subtle">
      <ResponsiveSection spacing="lg">
        <SectionHeader
          title="سلامت و بهره‌وری"
          subtitle="پایش وضعیت انرژی و تمرکز هوشمند"
          icon={<Heart className="h-6 w-6" />}
          gradient
        />

        {/* Health Metrics */}
        <ResponsiveLayout 
          cols={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap="md"
        >
          {displayMetrics.map((metric, index) => (
            <ResponsiveCard key={index} hover glow>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <ResponsiveHeading level={3} weight="medium" className="text-sm md:text-base">
                  {metric.label}
                </ResponsiveHeading>
                <span className={`text-2xl md:text-3xl font-bold ${metric.color}`}>
                  {metric.value}%
                </span>
              </div>
              <Progress value={typeof metric.value === 'string' ? 0 : metric.value} className="h-2 md:h-3" />
            </ResponsiveCard>
          ))}
        </ResponsiveLayout>

        <ResponsiveLayout 
          cols={{ mobile: 1, tablet: 1, desktop: 2 }}
          gap="md"
        >
          <ResponsiveCard
            title="فعالیت‌های امروز"
            icon={<Activity className="h-5 w-5" />}
            hover
            glow
          >
            {activities.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id || index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-background/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <ResponsiveText size="sm" variant="muted" className="font-medium whitespace-nowrap">
                        {activity.time}
                      </ResponsiveText>
                      <div className="min-w-0 flex-1">
                        <ResponsiveText size="sm" className="font-medium truncate">
                          {activity.activity}
                        </ResponsiveText>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            انرژی: {activity.energy_level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            تمرکز: {activity.focus_percentage}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <ResponsiveText variant="muted" className="mb-4">
                  هنوز فعالیتی ثبت نشده است
                </ResponsiveText>
                <ModernButton 
                  onClick={handleAddActivity}
                  icon={<Plus className="h-4 w-4" />}
                  variant="outline"
                  size="sm"
                >
                  افزودن فعالیت
                </ModernButton>
              </div>
            )}
          </ResponsiveCard>

          <ResponsiveCard
            title="ترند هفتگی"
            icon={<TrendingUp className="h-5 w-5" />}
            hover
            glow
          >
            {weeklyTrends ? (
              <div className="space-y-4">
                <div className="text-center p-4 md:p-6">
                  <div className="text-3xl md:text-4xl mb-4">
                    {weeklyTrends.energyGrowth > 0 ? '📈' : weeklyTrends.energyGrowth < 0 ? '📉' : '➡️'}
                  </div>
                  <ResponsiveText className="font-medium">
                    {weeklyTrends.energyGrowth > 0 ? 'روند بهبود انرژی' : 
                     weeklyTrends.energyGrowth < 0 ? 'کاهش انرژی' : 'انرژی ثابت'}
                  </ResponsiveText>
                  <ResponsiveText size="sm" variant="muted" className="mt-2">
                    انرژی شما در ۷ روز گذشته {Math.abs(weeklyTrends.energyGrowth)}٪ 
                    {weeklyTrends.energyGrowth > 0 ? ' افزایش' : weeklyTrends.energyGrowth < 0 ? ' کاهش' : ' تغییر نکرده'}
                  </ResponsiveText>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <ResponsiveText size="sm">میانگین انرژی هفته</ResponsiveText>
                    <span className="font-bold text-green-500">{weeklyTrends.averageEnergy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <ResponsiveText size="sm">بهترین روز</ResponsiveText>
                    <span className="font-bold">{weeklyTrends.bestDay.day} ({weeklyTrends.bestDay.energy}%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <ResponsiveText size="sm">ساعت بهینه</ResponsiveText>
                    <span className="font-bold">{weeklyTrends.optimalHours}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <ResponsiveText variant="muted" className="mb-2">
                  ترندهای هفتگی
                </ResponsiveText>
                <ResponsiveText size="sm" variant="muted">
                  برای مشاهده ترندها، حداقل ۳ روز اطلاعات ثبت کنید
                </ResponsiveText>
              </div>
            )}
          </ResponsiveCard>
        </ResponsiveLayout>

        <ResponsiveCard
          title="توصیه‌های هوشمند"
          icon={<Calendar className="h-5 w-5" />}
          hover
          glow
        >
          <ResponsiveLayout 
            cols={{ mobile: 1, tablet: 2, desktop: 3 }}
            gap="sm"
          >
            {recommendations.map((recommendation, index) => {
              const colorClasses = {
                green: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
                blue: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400', 
                purple: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400',
                orange: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400'
              };

              return (
                <div key={index} className={`p-3 md:p-4 rounded-lg border ${colorClasses[recommendation.color as keyof typeof colorClasses] || colorClasses.blue}`}>
                  <ResponsiveHeading level={4} weight="medium" className="mb-2">
                    {recommendation.icon} {recommendation.title}
                  </ResponsiveHeading>
                  <ResponsiveText size="sm" variant="muted">
                    {recommendation.message}
                  </ResponsiveText>
                </div>
              );
            })}
          </ResponsiveLayout>
        </ResponsiveCard>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default HealthPage;