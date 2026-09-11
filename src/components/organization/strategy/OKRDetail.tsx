import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Target, 
  TrendingUp, 
  Calendar,
  User,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns-jalali';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OKRDetailProps {
  strategyId: string;
  organizationId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function OKRDetail({ strategyId, organizationId, onBack, onEdit, onDelete }: OKRDetailProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedKR, setSelectedKR] = useState<any>(null);
  const [newValue, setNewValue] = useState(0);

  useEffect(() => {
    loadData();
  }, [strategyId]);

  const loadData = async () => {
    try {
      const { data: strategy, error } = await supabase
        .from('organization_strategies')
        .select(`
          *,
          organization_okr_key_results (*)
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

  const handleQuickUpdate = (kr: any) => {
    setSelectedKR(kr);
    setNewValue(kr.current_value);
    setUpdateDialogOpen(true);
  };

  const saveQuickUpdate = async () => {
    try {
      const { error } = await supabase
        .from('organization_okr_key_results')
        .update({ current_value: newValue })
        .eq('id', selectedKR.id);

      if (error) throw error;

      toast.success('مقدار به‌روزرسانی شد');
      setUpdateDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('خطا در به‌روزرسانی');
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
  const keyResults = data.organization_okr_key_results || [];
  const progress = content.progress || 0;
  const status = content.status || 'draft';

  const statusConfig = {
    draft: { label: 'پیش‌نویس', variant: 'secondary' as const },
    active: { label: 'فعال', variant: 'default' as const },
    achieved: { label: 'محقق شده', variant: 'default' as const },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 md:p-8"
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
            <div className="p-3 bg-primary/20 rounded-xl">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{content.objective}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant={statusConfig[status as keyof typeof statusConfig].variant}>
                  {statusConfig[status as keyof typeof statusConfig].label}
                </Badge>
                <Badge variant="outline">
                  {content.quarter} {content.year}
                </Badge>
                {content.owner && (
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{content.owner[0]}</AvatarFallback>
                    </Avatar>
                    <span>{content.owner}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats در Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary">{progress}%</div>
              <div className="text-xs text-muted-foreground mt-1">پیشرفت کلی</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold">{keyResults.length}</div>
              <div className="text-xs text-muted-foreground mt-1">نتایج کلیدی</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-green-500">
                {keyResults.filter((kr: any) => (kr.current_value / kr.target) >= 1).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">تکمیل شده</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-blue-500">
                {keyResults.filter((kr: any) => kr.current_value > 0 && (kr.current_value / kr.target) < 1).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">در حال انجام</div>
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

          {/* Key Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                نتایج کلیدی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keyResults.map((kr: any, index: number) => {
                  const krProgress = (kr.current_value / kr.target) * 100;
                  const isCompleted = krProgress >= 100;
                  
                  return (
                    <motion.div
                      key={kr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            <h4 className="font-semibold">{kr.title}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>وزن: {kr.weight}%</span>
                            <span>واحد: {kr.unit}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickUpdate(kr)}
                        >
                          <Edit className="h-3 w-3 ml-1" />
                          به‌روزرسانی
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {kr.current_value} / {kr.target}
                          </span>
                          <span className="font-bold text-primary">
                            {Math.round(krProgress)}%
                          </span>
                        </div>
                        <Progress value={krProgress} className="h-2" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Overall Progress */}
          <Card className="bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">پیشرفت کلی OKR</h3>
                  <span className="text-3xl font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-4" />
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
                  <div className="text-sm text-muted-foreground">دوره زمانی</div>
                  <div className="font-medium">{content.quarter} {content.year}</div>
                </div>
              </div>

              {content.owner && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">مسئول</div>
                      <div className="font-medium">{content.owner}</div>
                    </div>
                  </div>
                </>
              )}

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
                ویرایش OKR
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive" onClick={onDelete}>
                <Trash className="h-4 w-4 ml-2" />
                حذف OKR
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>به‌روزرسانی سریع</DialogTitle>
          </DialogHeader>
          {selectedKR && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{selectedKR.title}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  هدف: {selectedKR.target} {selectedKR.unit}
                </p>
              </div>
              <div>
                <Label>مقدار فعلی</Label>
                <Input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(parseFloat(e.target.value))}
                  min={0}
                  max={selectedKR.target * 2}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} className="flex-1">
                  لغو
                </Button>
                <Button onClick={saveQuickUpdate} className="flex-1">
                  ذخیره
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
