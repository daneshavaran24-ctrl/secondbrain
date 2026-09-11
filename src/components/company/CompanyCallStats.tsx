import { useEffect, useState } from 'react';
import { Phone, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { companyCallsService } from '@/services/companyCallsService';

interface CompanyCallStatsProps {
  companyId: string;
}

export const CompanyCallStats = ({ companyId }: CompanyCallStatsProps) => {
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    avgDuration: 0,
    needsFollowUp: 0,
  });

  useEffect(() => {
    loadStats();
  }, [companyId]);

  const loadStats = async () => {
    try {
      const data = await companyCallsService.getCallStats(companyId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">کل تماس‌ها</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.thisMonth} در این ماه
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">این هفته</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeek}</div>
          <p className="text-xs text-muted-foreground">تماس انجام شده</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">میانگین مدت</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgDuration}</div>
          <p className="text-xs text-muted-foreground">دقیقه</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نیاز به پیگیری</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.needsFollowUp}
          </div>
          <p className="text-xs text-muted-foreground">تماس</p>
        </CardContent>
      </Card>
    </div>
  );
};
