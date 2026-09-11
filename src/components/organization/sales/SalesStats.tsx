import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Target, DollarSign, BarChart3, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { salesService } from '@/services/salesService';

interface SalesStatsProps {
  organizationId: string;
}

export function SalesStats({ organizationId }: SalesStatsProps) {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalValue: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    totalSpent: 0,
    roi: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [organizationId]);

  const loadStats = async () => {
    try {
      const data = await salesService.getSalesStats(organizationId);
      setStats(data);
    } catch (error) {
      console.error('Error loading sales stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'تعداد سرنخ‌ها',
      value: stats.totalLeads,
      icon: Users,
      color: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'ارزش کل پایپلاین',
      value: `${(stats.totalValue / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'کمپین‌های فعال',
      value: stats.activeCampaigns,
      icon: Target,
      color: 'from-purple-500/20 to-pink-500/20',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'بودجه کل',
      value: `${(stats.totalBudget / 1000000).toFixed(1)}M`,
      icon: BarChart3,
      color: 'from-orange-500/20 to-red-500/20',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
    {
      title: 'هزینه شده',
      value: `${(stats.totalSpent / 1000000).toFixed(1)}M`,
      icon: TrendingDown,
      color: 'from-red-500/20 to-rose-500/20',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
    },
    {
      title: 'ROI',
      value: `${stats.roi.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-teal-500/20 to-cyan-500/20',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.color} border-border/50 hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
