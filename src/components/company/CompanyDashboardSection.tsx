import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { companyService } from '@/services/companyService';
import { ListChecks, FileText, Users, AlertCircle, CheckCircle2, Clock, Phone } from 'lucide-react';

interface DashboardSectionProps {
  companyId: string;
}

export function CompanyDashboardSection({ companyId }: DashboardSectionProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [companyId]);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await companyService.getDashboardStats(companyId);
    setStats(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'وظایف فعال',
      value: stats.activeTasks,
      icon: Clock,
      description: `از ${stats.totalTasks} وظیفه`,
      color: 'text-blue-500',
    },
    {
      title: 'وظایف تکمیل شده',
      value: stats.completedTasks,
      icon: CheckCircle2,
      description: `${((stats.completedTasks / stats.totalTasks) * 100 || 0).toFixed(0)}% کامل شده`,
      color: 'text-green-500',
    },
    {
      title: 'وظایف فوری',
      value: stats.urgentTasks,
      icon: AlertCircle,
      description: 'نیاز به توجه فوری',
      color: 'text-red-500',
    },
    {
      title: 'یادداشت‌ها',
      value: stats.totalNotes,
      icon: FileText,
      description: `${stats.importantNotes} مهم`,
      color: 'text-yellow-500',
    },
    {
      title: 'مشتریان',
      value: stats.contactsByType.client,
      icon: Users,
      description: 'از مخاطبین',
      color: 'text-purple-500',
    },
    {
      title: 'تامین‌کنندگان',
      value: stats.contactsByType.supplier,
      icon: Users,
      description: 'از مخاطبین',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {stats.callsThisWeek !== undefined && (
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              تماس‌های این هفته
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.callsThisWeek}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.callsNeedFollowUp > 0 && `${stats.callsNeedFollowUp} نیاز به پیگیری`}
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>خلاصه فعالیت‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <ListChecks className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">مجموع وظایف</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.activeTasks} فعال، {stats.completedTasks} تکمیل شده
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">مجموع مخاطبین</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.contactsByType.client} مشتری، {stats.contactsByType.supplier} تامین‌کننده،{' '}
                    {stats.contactsByType.partner} شریک
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">{stats.totalContacts}</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">یادداشت‌ها</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.importantNotes} یادداشت مهم
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
