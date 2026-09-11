import { motion } from 'framer-motion';
import { Users, FolderKanban, CheckCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { OrganizationStats } from '@/services/organizationStatsService';

interface OrganizationStatsCardsProps {
  stats: OrganizationStats;
}

export function OrganizationStatsCards({ stats }: OrganizationStatsCardsProps) {
  const statsData = [
    {
      title: 'کل اعضا',
      value: stats.totalMembers,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      change: '+12%',
      trend: 'up' as const,
    },
    {
      title: 'پروژه‌های فعال',
      value: stats.activeProjects,
      icon: FolderKanban,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      change: '+8%',
      trend: 'up' as const,
    },
    {
      title: 'نرخ تکمیل',
      value: `${stats.completionRate}%`,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      change: '+5%',
      trend: 'up' as const,
    },
    {
      title: 'میانگین زمان پاسخ',
      value: `${stats.averageResponseTime}h`,
      icon: Clock,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
      change: '-3%',
      trend: 'down' as const,
    },
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral', isNegative = false) => {
    if (trend === 'neutral') return 'text-muted-foreground';
    if (isNegative) {
      return trend === 'up' ? 'text-red-500' : 'text-emerald-500';
    }
    return trend === 'up' ? 'text-emerald-500' : 'text-red-500';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = getTrendIcon(stat.trend);
        const isNegativeStat = stat.title.includes('زمان');

        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative group">
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
              
              {/* Animated background blob */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`} />
              
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(stat.trend, isNegativeStat)}`}>
                    <TrendIcon className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </h3>
                  <p className="text-3xl font-bold bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">
                    {stat.value}
                  </p>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 h-1 w-full bg-border/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
