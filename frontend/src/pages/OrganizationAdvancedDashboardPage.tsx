import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Download, Loader2 } from 'lucide-react';
import { organizationStatsService, type OrganizationStats, type ChartData, type ActivityLog } from '@/services/organizationStatsService';
import { OrganizationStatsCards } from '@/components/organization/OrganizationStatsCards';
import { OrganizationCharts } from '@/components/organization/OrganizationCharts';
import { OrganizationActivities } from '@/components/organization/OrganizationActivities';
import { OrganizationDashboardHeader } from '@/components/organization/OrganizationDashboardHeader';
import { OrganizationQuickActions } from '@/components/organization/OrganizationQuickActions';
import { OrganizationMembersPreview } from '@/components/organization/OrganizationMembersPreview';
import { OrganizationProjectsPreview } from '@/components/organization/OrganizationProjectsPreview';
import { organizationService, type Organization } from '@/services/organizationService';

export default function OrganizationAdvancedDashboardPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId]);

  const loadDashboardData = async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);

      // Load organization details
      const orgData = await organizationService.getOrganizationById(organizationId);
      if (!orgData) {
        toast({
          title: 'خطا',
          description: 'سازمان یافت نشد',
          variant: 'destructive'
        });
        navigate('/profile');
        return;
      }
      setOrganization(orgData);

      // Load stats
      const statsData = await organizationStatsService.getOrganizationStats(organizationId);
      setStats(statsData);

      // Load charts data
      const chartsData = await organizationStatsService.getProjectsChartData(organizationId);
      setChartData(chartsData);

      // Load activities
      const activitiesData = await organizationStatsService.getRecentActivities(organizationId);
      setActivities(activitiesData);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'خطا در بارگذاری',
        description: 'مشکلی در بارگذاری داشبورد پیش آمد',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for new components
  const sampleMembers = [
    { id: '1', name: 'علی احمدی', role: 'admin', isOnline: true },
    { id: '2', name: 'سارا محمدی', role: 'manager', isOnline: true },
    { id: '3', name: 'رضا کریمی', role: 'member', isOnline: false },
    { id: '4', name: 'مریم حسینی', role: 'member', isOnline: true },
    { id: '5', name: 'امیر رضایی', role: 'member', isOnline: false },
    { id: '6', name: 'فاطمه نوری', role: 'manager', isOnline: true },
    { id: '7', name: 'محمد صادقی', role: 'member', isOnline: true },
    { id: '8', name: 'زهرا اکبری', role: 'member', isOnline: false },
  ];

  const sampleProjects = [
    { id: '1', name: 'پروژه توسعه اپلیکیشن', status: 'active', progress: 75, memberCount: 5, dueDate: '2024-12-30' },
    { id: '2', name: 'طراحی سیستم مدیریت', status: 'active', progress: 45, memberCount: 3, dueDate: '2024-11-20' },
    { id: '3', name: 'بهینه‌سازی دیتابیس', status: 'completed', progress: 100, memberCount: 2, dueDate: '2024-10-15' },
    { id: '4', name: 'راه‌اندازی سرور جدید', status: 'on_hold', progress: 30, memberCount: 4, dueDate: '2024-12-10' },
  ];

  // Loading state with modern skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-24 h-24 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">در حال بارگذاری داشبورد...</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization || !stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="gap-2 hover:bg-accent/50"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت
          </Button>
        </motion.div>

        {/* Hero Header */}
        {organization && (
          <OrganizationDashboardHeader
            organization={organization}
            stats={stats ? {
              totalMembers: stats.totalMembers,
              activeProjects: stats.activeProjects,
              completionRate: stats.completionRate,
            } : undefined}
          />
        )}

        {/* Quick Actions */}
        <OrganizationQuickActions />

        {/* Stats Cards */}
        {stats && <OrganizationStatsCards stats={stats} />}

        {/* Charts Section */}
        {chartData && <OrganizationCharts projectsData={chartData} />}

        {/* Two Column Layout for Team & Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Team Members Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <OrganizationMembersPreview
              members={sampleMembers}
              totalCount={stats?.totalMembers || sampleMembers.length}
            />
          </motion.div>

          {/* Recent Projects Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <OrganizationProjectsPreview projects={sampleProjects} />
          </motion.div>
        </div>

        {/* Activities Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {activities && <OrganizationActivities activities={activities} />}
        </motion.div>
      </div>
    </div>
  );
}
