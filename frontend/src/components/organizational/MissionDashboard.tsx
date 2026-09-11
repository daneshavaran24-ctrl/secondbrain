
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Target, Activity, Calendar, Plus, Edit, Trash2, Eye, Download, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useToast } from '@/hooks/use-toast';
import organizationalMissionService, { MissionWithProgress, MissionStats } from '@/services/organizationalMissionService';
import MissionForm from './missions/MissionForm';
import { MissionProgressHistory } from './missions/MissionProgressHistory';
import MissionExportDialog from './missions/MissionExportDialog';

interface MissionDashboardProps {
  organizationName: string;
}

const MissionDashboard: React.FC<MissionDashboardProps> = ({ organizationName }) => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [missionStats, setMissionStats] = useState<MissionStats>({
    total: 0,
    completed: 0,
    active: 0,
    delayed: 0,
    completionRate: 0,
    averageProgress: 0
  });
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | undefined>();
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [selectedMissionForHistory, setSelectedMissionForHistory] = useState<{ id: string; title: string } | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscription
    const channel = organizationalMissionService.subscribeToMissionChanges((payload) => {
      console.log('Mission change detected:', payload);
      loadDashboardData(); // Refresh data when changes occur
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load missions
      const missionsData = await organizationalMissionService.getMissions();
      setMissions(missionsData);

      // Load stats
      const stats = await organizationalMissionService.getMissionStats();
      setMissionStats(stats);

      // Load alerts
      const alerts = await organizationalMissionService.getCriticalAlerts();
      setCriticalAlerts(alerts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات داشبورد',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissionSave = () => {
    setShowMissionForm(false);
    setEditingMissionId(undefined);
    loadDashboardData();
  };

  const handleMissionCancel = () => {
    setShowMissionForm(false);
    setEditingMissionId(undefined);
  };

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm('آیا از حذف این مأموریت اطمینان دارید؟')) {
      return;
    }

    try {
      await organizationalMissionService.deleteMission(missionId);
      toast({
        title: 'موفقیت',
        description: 'مأموریت با موفقیت حذف شد'
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف مأموریت',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string, progressStatus?: string) => {
    if (progressStatus === 'ahead') {
      return { label: 'پیشرو', variant: 'secondary' as const };
    }
    if (progressStatus === 'behind') {
      return { label: 'عقب افتاده', variant: 'destructive' as const };
    }
    
    const variants = {
      'فعال': { label: 'فعال', variant: 'outline' as const },
      'درحال اجرا': { label: 'در حال اجرا', variant: 'default' as const },
      'تکمیل شده': { label: 'تکمیل شده', variant: 'secondary' as const },
      'متوقف شده': { label: 'متوقف شده', variant: 'destructive' as const }
    };
    return variants[status as keyof typeof variants] || variants['فعال'];
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      'high': { label: 'بحرانی', variant: 'destructive' as const },
      'medium': { label: 'متوسط', variant: 'secondary' as const },
      'low': { label: 'کم', variant: 'outline' as const }
    };
    return variants[severity as keyof typeof variants] || variants['medium'];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>در حال بارگذاری...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">داشبورد پایش مأموریت‌ها</h1>
            <p className="text-muted-foreground">{organizationName} - نظارت بر تحقق اهداف</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            صادرات گزارش
          </Button>
          <Button
            onClick={() => setShowMissionForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            مأموریت جدید
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل مأموریت‌ها</p>
                <p className="text-2xl font-bold text-blue-600">{missionStats.total}</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">مجموع</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">تحقق یافته</p>
                <p className="text-2xl font-bold text-emerald-600">{missionStats.completed}</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">کامل</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">در حال اجرا</p>
                <p className="text-2xl font-bold text-orange-600">{missionStats.active}</p>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">فعال</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">عقب افتاده</p>
                <p className="text-2xl font-bold text-red-600">{missionStats.delayed}</p>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">تاخیر</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نرخ تکمیل</p>
                <p className="text-2xl font-bold text-blue-600">{missionStats.completionRate}%</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">موفقیت</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">میانگین پیشرفت</p>
                <p className="text-2xl font-bold text-green-600">{missionStats.averageProgress}%</p>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">کلی</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            پیشرفت مأموریت‌ها
          </CardTitle>
          <CardDescription>مقایسه پیشرفت واقعی با اهداف برنامه‌ریزی‌شده</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {missions.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">هنوز مأموریتی تعریف نشده</h3>
              <p className="text-muted-foreground mb-4">برای شروع، اولین مأموریت خود را ایجاد کنید</p>
              <Button onClick={() => setShowMissionForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                ایجاد مأموریت
              </Button>
            </div>
          ) : (
            missions.map((mission) => {
              const statusBadge = getStatusBadge(mission.status, mission.progress_status);
              return (
                <div key={mission.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{mission.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        تاریخ شروع: {mission.start_date ? new Date(mission.start_date).toLocaleDateString('fa-IR') : 'تعریف نشده'} • 
                        تاریخ پایان: {mission.end_date ? new Date(mission.end_date).toLocaleDateString('fa-IR') : 'تعریف نشده'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMissionForHistory({ id: mission.id, title: mission.title });
                            setShowProgressHistory(true);
                          }}
                          title="مشاهده تاریخچه"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMissionId(mission.id);
                            setShowMissionForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>هدف: {mission.expected_progress || 0}%</span>
                      <span>واقعی: {mission.progress || 0}%</span>
                    </div>
                    <div className="space-y-1">
                      <Progress value={mission.expected_progress || 0} className="h-2 opacity-50" />
                      <Progress value={mission.progress || 0} className="h-2" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>خط هدف</span>
                      <span>پیشرفت واقعی</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              هشدارهای بحرانی
            </CardTitle>
            <CardDescription>نقاط بحرانی و انحرافات قابل توجه</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalAlerts.map((alert) => {
              const severityBadge = getSeverityBadge(alert.severity);
              return (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{alert.mission}</h4>
                    <p className="text-sm text-muted-foreground">{alert.alert}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {alert.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityBadge.variant}>{severityBadge.label}</Badge>
                    <Button variant="outline" size="sm">اقدام</Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            نمودار عملکرد واحدها
          </CardTitle>
          <CardDescription>تحلیل عملکرد به تفکیک واحدهای سازمانی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>نمودار تحلیلی عملکرد</p>
              <p className="text-sm">این بخش در نسخه کامل پیاده‌سازی خواهد شد</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Form Dialog */}
      <ResponsiveDialog 
        open={showMissionForm} 
        onOpenChange={(open) => !open && handleMissionCancel()}
        title={editingMissionId ? 'ویرایش مأموریت' : 'مأموریت جدید'}
      >
        <MissionForm
          missionId={editingMissionId}
          onSave={handleMissionSave}
          onCancel={handleMissionCancel}
        />
      </ResponsiveDialog>

      {/* Progress History Dialog */}
      <ResponsiveDialog
        open={showProgressHistory}
        onOpenChange={setShowProgressHistory}
        title="تاریخچه پیشرفت"
        className="max-w-4xl"
      >
        {selectedMissionForHistory && (
          <MissionProgressHistory
            missionId={selectedMissionForHistory.id}
            missionTitle={selectedMissionForHistory.title}
          />
        )}
      </ResponsiveDialog>

      {/* Export Dialog */}
      <MissionExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        organizationName={organizationName}
      />
    </div>
  );
};

export default MissionDashboard;
