import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  GitBranch, 
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns-jalali';
import { cn } from '@/lib/utils';

interface DecisionLogDetailProps {
  strategyId: string;
  organizationId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const IMPACT_CONFIG = {
  low: { label: 'کم', color: 'bg-blue-500', variant: 'default' as const },
  medium: { label: 'متوسط', color: 'bg-yellow-500', variant: 'default' as const },
  high: { label: 'زیاد', color: 'bg-orange-500', variant: 'default' as const },
  critical: { label: 'حیاتی', color: 'bg-red-500', variant: 'destructive' as const },
};

export function DecisionLogDetail({ strategyId, organizationId, onBack, onEdit, onDelete }: DecisionLogDetailProps) {
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
          organization_decision_options (*)
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
  const options = data.organization_decision_options || [];
  const impact = content.impact || 'medium';
  const impactConfig = IMPACT_CONFIG[impact as keyof typeof IMPACT_CONFIG];
  const decisionMakers = content.decisionMakers || [];
  const chosenOption = options.find((opt: any) => opt.title === content.chosenOption);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-background p-6 md:p-8"
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
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <GitBranch className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{content.title}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={impactConfig.variant} className={impactConfig.color}>
                  تأثیر: {impactConfig.label}
                </Badge>
                <Badge variant="outline">
                  {content.date && format(new Date(content.date), 'yyyy/MM/dd')}
                </Badge>
                {decisionMakers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{decisionMakers.length} تصمیم‌گیرنده</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">زمینه و شرایط تصمیم</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{content.context}</p>
            </CardContent>
          </Card>

          {/* Chosen Option Highlight */}
          {chosenOption && (
            <Card className="border-2 border-green-500 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">گزینه انتخاب شده</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold mb-4">{chosenOption.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Pros */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <ThumbsUp className="h-4 w-4" />
                      <span>مزایا</span>
                    </div>
                    <ul className="space-y-1">
                      {chosenOption.pros?.map((pro: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600 font-medium">
                      <ThumbsDown className="h-4 w-4" />
                      <span>معایب</span>
                    </div>
                    <ul className="space-y-1">
                      {chosenOption.cons?.map((con: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red-500">✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  {chosenOption.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">هزینه</div>
                        <div className="text-sm font-medium">{chosenOption.cost}</div>
                      </div>
                    </div>
                  )}
                  {chosenOption.time_estimate && (
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">زمان</div>
                        <div className="text-sm font-medium">{chosenOption.time_estimate}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">امتیاز</div>
                    <div className="text-sm font-bold text-primary">{chosenOption.score}/100</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rationale */}
          {content.rationale && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">دلیل انتخاب</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{content.rationale}</p>
              </CardContent>
            </Card>
          )}

          {/* Options Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">مقایسه گزینه‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {options.map((option: any, idx: number) => {
                  const isChosen = option.title === content.chosenOption;
                  
                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        isChosen ? "border-green-500 bg-green-500/5" : "border-border hover:shadow-md"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isChosen && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          <h4 className="font-semibold">{option.title}</h4>
                        </div>
                        <Badge variant={isChosen ? "default" : "outline"}>
                          {option.score}/100
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">مزایا:</div>
                          {option.pros?.slice(0, 2).map((pro: string, i: number) => (
                            <div key={i} className="text-xs">• {pro}</div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">معایب:</div>
                          {option.cons?.slice(0, 2).map((con: string, i: number) => (
                            <div key={i} className="text-xs">• {con}</div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                        {option.cost && <span>هزینه: {option.cost}</span>}
                        {option.time_estimate && <span>زمان: {option.time_estimate}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Decision Makers */}
          {decisionMakers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تصمیم‌گیرندگان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {decisionMakers.map((maker: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{maker[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{maker}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">تاریخ تصمیم</div>
                  <div className="font-medium">
                    {content.date && format(new Date(content.date), 'yyyy/MM/dd')}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className={cn("h-5 w-5 rounded-full", impactConfig.color)} />
                <div>
                  <div className="text-sm text-muted-foreground">تأثیر تصمیم</div>
                  <div className="font-medium">{impactConfig.label}</div>
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
                ویرایش لاگ تصمیم
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive" onClick={onDelete}>
                <Trash className="h-4 w-4 ml-2" />
                حذف لاگ تصمیم
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
