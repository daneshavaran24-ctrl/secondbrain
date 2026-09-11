import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Target, Clock, Play, Pause, CheckCircle2, Plus } from 'lucide-react';
import { Sprint, sprintService } from '@/services/sprintService';
import { useToast } from '@/hooks/use-toast';
import { PersianDatePicker } from '@/components/ui/persian-date-picker';
import { convertGregorianToJalali, convertJalaliToGregorian } from '@/lib/date-utils';

interface SprintPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: string;
  projectId?: string;
  onSprintChange?: (sprint: Sprint | null) => void;
}

export function SprintPlannerModal({ isOpen, onClose, scope, projectId, onSprintChange }: SprintPlannerModalProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSprints();
      loadCurrentSprint();
    }
  }, [isOpen, scope, projectId]);

  const loadSprints = () => {
    const sprintList = sprintService.getSprints(scope, projectId);
    setSprints(sprintList);
  };

  const loadCurrentSprint = () => {
    const current = sprintService.getCurrentSprint(scope, projectId);
    setCurrentSprint(current);
  };

  const handleCreateSprint = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای ضروری را پر کنید',
        variant: 'destructive',
      });
      return;
    }

    const newSprint = sprintService.createSprint(scope, {
      name: formData.name,
      goal: formData.goal,
      startDate: formData.startDate,
      endDate: formData.endDate,
      domain: scope as any,
      projectId,
      status: 'planning',
    }, projectId);

    loadSprints();
    setIsCreating(false);
    setFormData({ name: '', goal: '', startDate: '', endDate: '' });
    
    toast({
      title: 'موفقیت',
      description: 'اسپرینت جدید ایجاد شد',
    });
  };

  const handleSetCurrentSprint = (sprintId: string | null) => {
    sprintService.setCurrentSprint(scope, sprintId, projectId);
    const updatedCurrent = sprintId ? sprints.find(s => s.id === sprintId) || null : null;
    setCurrentSprint(updatedCurrent);
    onSprintChange?.(updatedCurrent);
    
    toast({
      title: 'تغییر اسپرینت',
      description: sprintId ? 'اسپرینت جاری تنظیم شد' : 'اسپرینت جاری لغو شد',
    });
  };

  const handleUpdateSprintStatus = (sprintId: string, status: Sprint['status']) => {
    sprintService.updateSprint(scope, sprintId, { status }, projectId);
    loadSprints();
    if (currentSprint?.id === sprintId) {
      setCurrentSprint({ ...currentSprint, status });
    }
  };

  const getStatusBadge = (status: Sprint['status']) => {
    const statusConfig = {
      planning: { label: 'برنامه‌ریزی', variant: 'secondary' as const },
      active: { label: 'فعال', variant: 'default' as const },
      completed: { label: 'تکمیل شده', variant: 'outline' as const },
    };
    
    return statusConfig[status] || { label: status, variant: 'secondary' as const };
  };

  const getStatusIcon = (status: Sprint['status']) => {
    switch (status) {
      case 'planning': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Pause className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-right pr-8">
            <Target className="h-5 w-5 text-primary" />
            مدیریت اسپرینت‌ها
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Sprint */}
          {currentSprint && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(currentSprint.status)}
                    اسپرینت جاری: {currentSprint.name}
                  </span>
                  <Badge {...getStatusBadge(currentSprint.status)}>
                    {getStatusBadge(currentSprint.status).label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">تاریخ شروع</Label>
                    <p className="font-medium">{new Date(currentSprint.startDate).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">تاریخ پایان</Label>
                    <p className="font-medium">{new Date(currentSprint.endDate).toLocaleDateString('fa-IR')}</p>
                  </div>
                </div>
                {currentSprint.goal && (
                  <div>
                    <Label className="text-xs text-muted-foreground">هدف اسپرینت</Label>
                    <p className="text-sm">{currentSprint.goal}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  {currentSprint.status === 'planning' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateSprintStatus(currentSprint.id, 'active')}
                      className="bg-tech-cyan text-white"
                    >
                      شروع اسپرینت
                    </Button>
                  )}
                  {currentSprint.status === 'active' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateSprintStatus(currentSprint.id, 'completed')}
                      className="bg-medical-green text-white"
                    >
                      تکمیل اسپرینت
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSetCurrentSprint(null)}
                  >
                    لغو انتخاب
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sprint List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">تمام اسپرینت‌ها</h3>
              <Button onClick={() => setIsCreating(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                اسپرینت جدید
              </Button>
            </div>

            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {sprints.map((sprint) => (
                <Card key={sprint.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{sprint.name}</h4>
                          <Badge {...getStatusBadge(sprint.status)}>
                            {getStatusBadge(sprint.status).label}
                          </Badge>
                          {currentSprint?.id === sprint.id && (
                            <Badge variant="outline" className="text-primary border-primary">
                              جاری
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(sprint.startDate).toLocaleDateString('fa-IR')} - {new Date(sprint.endDate).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        {sprint.goal && (
                          <p className="text-sm mt-1 text-muted-foreground">{sprint.goal}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {currentSprint?.id !== sprint.id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetCurrentSprint(sprint.id)}
                          >
                            انتخاب
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sprints.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  هیچ اسپرینتی ایجاد نشده است
                </div>
              )}
            </div>
          </div>

          {/* Create Sprint Form */}
          {isCreating && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">ایجاد اسپرینت جدید</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sprintName">نام اسپرینت</Label>
                  <Input
                    id="sprintName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: اسپرینت ۱"
                  />
                </div>
                <div>
                  <Label htmlFor="sprintGoal">هدف اسپرینت (اختیاری)</Label>
                  <Textarea
                    id="sprintGoal"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="هدف کلی این اسپرینت چیست؟"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">تاریخ شروع</Label>
                    <PersianDatePicker
                      value={formData.startDate ? new Date(formData.startDate) : null}
                      onChange={(date) => {
                        const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                        setFormData({ ...formData, startDate: gregorianDate });
                      }}
                      placeholder="تاریخ شروع را انتخاب کنید"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">تاریخ پایان</Label>
                    <PersianDatePicker
                      value={formData.endDate ? new Date(formData.endDate) : null}
                      onChange={(date) => {
                        const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                        setFormData({ ...formData, endDate: gregorianDate });
                      }}
                      placeholder="تاریخ پایان را انتخاب کنید"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    انصراف
                  </Button>
                  <Button onClick={handleCreateSprint}>
                    ایجاد اسپرینت
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}