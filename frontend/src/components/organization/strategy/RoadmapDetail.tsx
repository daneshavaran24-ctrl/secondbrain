import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Map, 
  Calendar,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns-jalali';
import { cn } from '@/lib/utils';

interface RoadmapDetailProps {
  strategyId: string;
  organizationId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_CONFIG = {
  pending: { 
    label: 'در انتظار', 
    icon: Circle, 
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-muted-foreground'
  },
  'in-progress': { 
    label: 'در حال انجام', 
    icon: Circle, 
    color: 'text-blue-500',
    bg: 'bg-blue-500',
    border: 'border-blue-500'
  },
  completed: { 
    label: 'تکمیل شده', 
    icon: CheckCircle2, 
    color: 'text-green-500',
    bg: 'bg-green-500',
    border: 'border-green-500'
  },
  blocked: { 
    label: 'مسدود شده', 
    icon: AlertCircle, 
    color: 'text-destructive',
    bg: 'bg-destructive',
    border: 'border-destructive'
  },
};

export function RoadmapDetail({ strategyId, organizationId, onBack, onEdit, onDelete }: RoadmapDetailProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [strategyId]);

  const loadData = async () => {
    try {
      const { data: strategy, error } = await supabase
        .from('organization_strategies')
        .select(`
          *,
          organization_roadmap_milestones (*)
        `)
        .eq('id', strategyId)
        .single();

      if (error) throw error;
      setData(strategy);
    } catch (error: any) {
      toast.error('خطا در بارگذاری اطلاعات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const content = data.content as any;
  const milestones = data.organization_roadmap_milestones || [];
  
  const completedCount = milestones.filter((m: any) => m.status === 'completed').length;
  const inProgressCount = milestones.filter((m: any) => m.status === 'in-progress').length;
  const blockedCount = milestones.filter((m: any) => m.status === 'blocked').length;
  const pendingCount = milestones.filter((m: any) => m.status === 'pending').length;
  const totalProgress = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-background p-6 md:p-8"
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              <ArrowLeft className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 ml-2" />
                ویرایش
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Map className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{content.title}</h1>
              {content.startDate && content.endDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(content.startDate), 'yyyy/MM/dd')} تا{' '}
                    {format(new Date(content.endDate), 'yyyy/MM/dd')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary">{Math.round(totalProgress)}%</div>
              <div className="text-xs text-muted-foreground mt-1">پیشرفت کلی</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-green-500">{completedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">تکمیل شده</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-blue-500">{inProgressCount}</div>
              <div className="text-xs text-muted-foreground mt-1">در حال انجام</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-destructive">{blockedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">مسدود شده</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-muted-foreground">{pendingCount}</div>
              <div className="text-xs text-muted-foreground mt-1">در انتظار</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {content.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توضیحات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{content.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">پیشرفت کلی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{completedCount} از {milestones.length} نقطه عطف</span>
                  <span className="font-bold">{Math.round(totalProgress)}%</span>
                </div>
                <Progress value={totalProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نقاط عطف (Timeline)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20" />

                {/* Milestones */}
                <div className="space-y-6">
                  {milestones.map((milestone: any, idx: number) => {
                    const StatusIcon = STATUS_CONFIG[milestone.status as keyof typeof STATUS_CONFIG].icon;
                    const config = STATUS_CONFIG[milestone.status as keyof typeof STATUS_CONFIG];

                    return (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative flex gap-4"
                      >
                        {/* Timeline Dot */}
                        <div className={cn(
                          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 flex-shrink-0",
                          config.bg,
                          config.border,
                          milestone.status === 'in-progress' && "animate-pulse"
                        )}>
                          <StatusIcon className="h-5 w-5 text-white" />
                        </div>

                        {/* Milestone Card */}
                        <Card className="flex-1 hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{milestone.title}</h4>
                                <Badge variant="outline" className="mt-1">
                                  {config.label}
                                </Badge>
                              </div>
                            </div>

                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                {milestone.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              {milestone.target_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(milestone.target_date), 'yyyy/MM/dd')}</span>
                                </div>
                              )}
                              {milestone.owner && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{milestone.owner}</span>
                                </div>
                              )}
                            </div>

                            {milestone.deliverables && milestone.deliverables.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium mb-2">خروجی‌ها:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {milestone.deliverables.map((d: string, i: number) => (
                                    <li key={i}>• {d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">بازه زمانی</div>
                  <div className="font-medium text-sm">
                    {content.startDate && format(new Date(content.startDate), 'yyyy/MM/dd')}
                    {' - '}
                    {content.endDate && format(new Date(content.endDate), 'yyyy/MM/dd')}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">تاریخ ایجاد</div>
                  <div className="font-medium">
                    {format(new Date(data.created_at), 'yyyy/MM/dd')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اقدامات سریع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={onEdit}>
                <Edit className="h-4 w-4 ml-2" />
                ویرایش نقشه راه
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive" onClick={onDelete}>
                <Trash className="h-4 w-4 ml-2" />
                حذف نقشه راه
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
