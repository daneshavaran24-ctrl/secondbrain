import React, { useState, useEffect } from 'react';
import { Users, FileText, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { organizationalStatsService, type OrganizationalStats } from '@/services/organizationalStatsService';

const AssociationPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OrganizationalStats>({
    activePolicies: 0,
    goalAchievementRate: 0,
    criticalPositions: 0,
    highRisks: 0
  });
  const [loading, setLoading] = useState(true);
  const modules = [
    {
      title: 'سیاست‌گذاری و مأموریت‌ها',
      description: 'تعریف مأموریت‌ها، اهداف کلان و سیاست‌های اجرایی',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/organizations/association/policy-mission'
    },
    {
      title: 'داشبورد پایش مأموریت‌ها',
      description: 'پیشرفت اهداف، مقایسه تحقق واقعی با برنامه‌ها',
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/organizations/association/mission-dashboard'
    },
    {
      title: 'جانشین‌پروری',
      description: 'شناسایی پست‌های کلیدی و توسعه جانشینان',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      path: '/organizations/association/succession'
    },
    {
      title: 'پیگیری مطالبات',
      description: 'ثبت و پیگیری مطالبات داخلی و مردمی',
      icon: Calendar,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      path: '/organizations/association/claims-tracking'
    },
    {
      title: 'مدیریت صورت‌جلسات',
      description: 'ثبت جلسات، مصوبات و پیگیری اجرا',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/organizations/association/meeting-minutes'
    },
    {
      title: 'ارزیابی ریسک‌ها',
      description: 'شناسایی، تحلیل و مدیریت ریسک‌های سازمان',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      path: '/organizations/association/risk-assessment'
    }
  ];

  // Load organizational stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const organizationalStats = await organizationalStatsService.getOrganizationalStats();
        setStats(organizationalStats);
      } catch (error) {
        console.error('Error loading organizational stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Users className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">انجمن تولیدکنندگان</h1>
          <p className="text-muted-foreground">سیستم مدیریت سازمانی جامع</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className={`${module.bgColor} rounded-t-lg`}>
              <div className="flex items-center space-x-3 space-x-reverse">
                <module.icon className={`w-6 h-6 ${module.color}`} />
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardDescription className="text-sm text-muted-foreground mb-4">
                {module.description}
              </CardDescription>
              <Button 
                className="w-full" 
                onClick={() => navigate(module.path)}
              >
                ورود به ماژول
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.activePolicies}
            </div>
            <div className="text-sm text-muted-foreground">سیاست‌های فعال</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? '...' : `${stats.goalAchievementRate}%`}
            </div>
            <div className="text-sm text-muted-foreground">تحقق اهداف</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : stats.criticalPositions}
            </div>
            <div className="text-sm text-muted-foreground">پست‌های بحرانی</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : stats.highRisks}
            </div>
            <div className="text-sm text-muted-foreground">ریسک‌های بالا</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssociationPage;