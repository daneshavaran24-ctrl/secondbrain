import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getTodaysFocus, type TodaysFocusItem } from '@/services/activityService';
import { PlusCircle, Video, Search, TrendingUp, Heart, Calendar, FileText, Mic, Target, Zap, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
interface QuickActionsProps {
  onActionClick?: (action: string) => void;
}
export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick
}) => {
  const navigate = useNavigate();
  const [todaysFocus, setTodaysFocus] = useState<TodaysFocusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysFocus = async () => {
      try {
        const focus = await getTodaysFocus();
        setTodaysFocus(focus);
      } catch (error) {
        console.error('Error fetching today\'s focus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodaysFocus();
  }, []);
  const handleActionClick = (actionId: string) => {
    const actionRoutes = {
      knowledge: '/knowledge',
      meeting: '/meetings',
      search: '/knowledge',
      trends: '/trends',
      health: '/health',
      schedule: '/tasks',
      ideas: '/ideas'
    };
    const route = actionRoutes[actionId as keyof typeof actionRoutes];
    if (route) {
      navigate(route);
    }
    onActionClick?.(actionId);
  };
  const actions = [{
    id: 'ideas',
    title: 'ایده جدید',
    description: 'ثبت و تحلیل ایده‌های خلاقانه',
    icon: Lightbulb,
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    shortcut: 'Ctrl+I'
  }, {
    id: 'knowledge',
    title: 'ذخیره دانش',
    description: 'اضافه کردن مقاله یا یادداشت',
    icon: PlusCircle,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    shortcut: 'Ctrl+N'
  }, {
    id: 'meeting',
    title: 'ضبط جلسه',
    description: 'شروع جلسه هوشمند با تحلیل AI',
    icon: Video,
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    shortcut: 'Ctrl+M'
  }, {
    id: 'search',
    title: 'جستجو',
    description: 'جستجوی پیشرفته در دانش شخصی',
    icon: Search,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    shortcut: 'Ctrl+K'
  }, {
    id: 'trends',
    title: 'پایش ترندها',
    description: 'بررسی آخرین اخبار و مقالات',
    icon: TrendingUp,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    shortcut: 'Ctrl+T'
  }, {
    id: 'health',
    title: 'سلامت و تمرکز',
    description: 'چک کردن وضعیت سلامت و انرژی',
    icon: Heart,
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    shortcut: 'Ctrl+H'
  }, {
    id: 'schedule',
    title: 'برنامه امروز',
    description: 'برنامه‌ریزی و مدیریت زمان',
    icon: Calendar,
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    shortcut: 'Ctrl+D'
  }];
  const quickStats = [{
    label: 'دانش ذخیره‌شده',
    value: '247',
    icon: FileText
  }, {
    label: 'جلسات این ماه',
    value: '12',
    icon: Video
  }, {
    label: 'وظایف فعال',
    value: '8',
    icon: Target
  }, {
    label: 'انرژی امروز',
    value: '85%',
    icon: Zap
  }];
  return <div className="space-y-6">
      {/* Quick Stats */}
      <Card className="bg-glass border-elegant">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">نگاه کلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => <motion.div key={stat.label} className="text-center p-3 rounded-lg bg-background/30 border border-muted" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            delay: index * 0.1
          }}>
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>)}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-glass border-elegant">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5" />
            اقدامات سریع
          </CardTitle>
        </CardHeader>
        
      </Card>

      {/* Today's Focus */}
      <Card className="bg-glass border-elegant">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Target className="h-5 w-5" />
            تمرکز امروز
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todaysFocus.length > 0 ? todaysFocus.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-muted">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'completed' ? 'bg-green-500' :
                  item.status === 'in_progress' ? 'bg-blue-500' : 'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                  {item.time && (
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">هیچ برنامه‌ای برای امروز تعریف نشده</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
};