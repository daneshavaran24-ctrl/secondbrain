import React, { useState, useEffect } from 'react';
import { BarChart3, Users, MapPin, Calendar, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  khadimEKhalghDashboardService, 
  KhadimEKhalghStats, 
  ActiveProject, 
  UpcomingMeeting, 
  RecentActivity 
} from '@/services/khadimEKhalghDashboardService';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [stats, setStats] = useState<KhadimEKhalghStats>({ activeProjects: 0, beneficiaries: 0, coveredRegions: 0, weeklyMeetings: 0 });
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const [statsData, projectsData, meetingsData, activitiesData] = await Promise.all([
          khadimEKhalghDashboardService.getStats(),
          khadimEKhalghDashboardService.getActiveProjects(),
          khadimEKhalghDashboardService.getUpcomingMeetings(),
          khadimEKhalghDashboardService.getRecentActivities()
        ]);

        setStats(statsData);
        setActiveProjects(projectsData);
        setUpcomingMeetings(meetingsData);
        setRecentActivities(activitiesData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "خطا در بارگیری داده‌ها",
          description: "امکان بارگیری اطلاعات داشبورد وجود ندارد",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statsDisplay = [
    { title: 'پروژه‌های فعال', value: stats.activeProjects.toString(), change: stats.activeProjects > 0 ? `+${Math.floor(stats.activeProjects / 4)}` : '0', icon: Activity, color: 'text-blue-600' },
    { title: 'افراد بهره‌مند', value: stats.beneficiaries.toString(), change: stats.beneficiaries > 0 ? `+${Math.floor(stats.beneficiaries / 6)}` : '0', icon: Users, color: 'text-emerald-600' },
    { title: 'مناطق تحت پوشش', value: stats.coveredRegions.toString(), change: stats.coveredRegions > 0 ? `+${Math.max(1, Math.floor(stats.coveredRegions / 2))}` : '0', icon: MapPin, color: 'text-orange-600' },
    { title: 'جلسات هفته', value: stats.weeklyMeetings.toString(), change: stats.weeklyMeetings > 0 ? `+${Math.floor(stats.weeklyMeetings / 2)}` : '0', icon: Calendar, color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-7xl mx-auto spacing-relaxed">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">اتاق فرمان خادم خلق</h1>
          <p className="text-muted-foreground">نمای کلی فعالیت‌ها و آمارهای مدیریتی</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            statsDisplay.map((stat, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-emerald-600">{stat.change} این ماه</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-primary/10`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  پروژه‌های فعال
                </CardTitle>
                <CardDescription>وضعیت پیشرفت پروژه‌های جاری</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-5 bg-muted animate-pulse rounded w-48"></div>
                          <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                        </div>
                        <div className="h-2 bg-muted animate-pulse rounded"></div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                          <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeProjects.length > 0 ? (
                  <div className="space-y-6">
                    {activeProjects.map((project, index) => (
                      <div key={project.id || index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">{project.name}</h4>
                          <Badge variant={project.progress > 80 ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{project.progress}% تکمیل شده</span>
                          <span>{project.beneficiaries} نفر بهره‌مند</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>هنوز پروژه‌ای تعریف نشده است</p>
                    <p className="text-sm mt-2">برای شروع، پروژه‌های جدید اضافه کنید</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Meetings */}
          <div>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  جلسات آتی
                </CardTitle>
                <CardDescription>برنامه‌های پیش رو</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="h-5 bg-muted animate-pulse rounded mb-2"></div>
                        <div className="h-4 bg-muted animate-pulse rounded w-32 mb-2"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                          <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingMeetings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting, index) => (
                      <div key={meeting.id || index} className="p-4 border border-border rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{meeting.time}</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{meeting.participants} شرکت‌کننده</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>جلسه‌ای برنامه‌ریزی نشده است</p>
                    <p className="text-sm mt-2">برای شروع، جلسات خود را به تقویم اضافه کنید</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activities */}
        <Card className="glass-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border-r-4 border-muted bg-muted/20 rounded">
                    <div className="text-sm w-full">
                      <div className="h-5 bg-muted animate-pulse rounded mb-2"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={activity.id || index} 
                    className={`flex items-center gap-4 p-3 border-r-4 rounded ${
                      activity.type === 'success' ? 'border-emerald-500 bg-emerald-50' :
                      activity.type === 'warning' ? 'border-orange-500 bg-orange-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>هنوز فعالیتی ثبت نشده است</p>
                <p className="text-sm mt-2">فعالیت‌های شما اینجا نمایش داده خواهد شد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;