import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

interface DelegationStatsProps {
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    declined: number;
    overdue: number;
    completionRate: number;
    avgResponseTime: number;
  };
}

export function DelegationStats({ stats }: DelegationStatsProps) {
  const statCards = [
    {
      title: 'کل وظایف',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10'
    },
    {
      title: 'در انتظار',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-600/10'
    },
    {
      title: 'در حال انجام',
      value: stats.in_progress,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600/10'
    },
    {
      title: 'تکمیل شده',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10'
    },
    {
      title: 'رد شده',
      value: stats.declined,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-600/10'
    },
    {
      title: 'عقب افتاده',
      value: stats.overdue,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-600/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <Card key={index} className="card-glass hover:card-glow transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              نرخ تکمیل وظایف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">درصد موفقیت</span>
              <Badge variant="secondary">{stats.completionRate.toFixed(1)}%</Badge>
            </div>
            <Progress value={stats.completionRate} className="w-full" />
            <p className="text-xs text-muted-foreground">
              از {stats.total} وظیفه، {stats.completed} وظیفه با موفقیت تکمیل شده
            </p>
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              زمان متوسط پاسخ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ساعت</span>
              <Badge variant="outline">{stats.avgResponseTime.toFixed(1)} ساعت</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>سریع (کمتر از 2 ساعت)</span>
                <span className="text-green-600">عالی</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>متوسط (2-24 ساعت)</span>
                <span className="text-yellow-600">خوب</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>کند (بیش از 24 ساعت)</span>
                <span className="text-red-600">نیاز به بهبود</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}