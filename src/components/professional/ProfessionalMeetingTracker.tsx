import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { professionalMeetingService } from '@/services/professionalMeetingService';
import { Target, Clock, User, CheckCircle, AlertCircle, Calendar, List, Columns, Filter, FileText, MessageSquare, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MeetingResolution, ResolutionFilters, ResolutionSortOption } from '@/types';
import { ResolutionFilterPanel } from './ResolutionFilterPanel';
import { ResolutionKanbanBoard } from './ResolutionKanbanBoard';
import { ResolutionTimeline } from './ResolutionTimeline';
import { ResolutionComments } from './ResolutionComments';
import { ResolutionNotificationBell } from './ResolutionNotificationBell';
import { ResolutionAnalyticsDashboard } from './ResolutionAnalyticsDashboard';
import { ResolutionReportGenerator } from './ResolutionReportGenerator';
import { ResponsiblePartiesSelector } from './ResponsiblePartiesSelector';

interface ResolutionWithMeeting extends MeetingResolution {
  meetingTitle: string;
  meetingDate: string;
}

export const ProfessionalMeetingTracker: React.FC = () => {
  const [resolutions, setResolutions] = useState<ResolutionWithMeeting[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionWithMeeting | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    progress: 0,
    implementation_notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ResolutionFilters>({
    search: '',
    status: [],
    priority: [],
    progressMin: 0,
    progressMax: 100
  });
  const [sortOption, setSortOption] = useState<ResolutionSortOption>({
    field: 'created_at',
    order: 'desc'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadResolutions();
  }, []);

  const loadResolutions = async () => {
    try {
      setIsLoading(true);
      const meetings = await professionalMeetingService.getMeetings();
      const allResolutions: ResolutionWithMeeting[] = [];

      meetings.forEach(meeting => {
        if (meeting.resolutions) {
          meeting.resolutions.forEach(resolution => {
            allResolutions.push({
              ...resolution,
              meetingTitle: meeting.title,
              meetingDate: meeting.date
            });
          });
        }
      });

      setResolutions(allResolutions);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری مصوبات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: MeetingResolution['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: MeetingResolution['status']) => {
    const labels = {
      pending: 'در انتظار',
      in_progress: 'در حال اجرا',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: MeetingResolution['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const openUpdateModal = (resolution: ResolutionWithMeeting) => {
    setSelectedResolution(resolution);
    setUpdateForm({
      status: resolution.status,
      progress: resolution.progress || 0,
      implementation_notes: resolution.implementation_notes || ''
    });
    setIsUpdateModalOpen(true);
  };

  const handleStatusChange = async (resolutionId: string, newStatus: MeetingResolution['status']) => {
    const resolution = resolutions.find(r => r.id === resolutionId);
    if (!resolution) return;

    try {
      await professionalMeetingService.updateResolution(
        resolution.meeting_id,
        resolution.id,
        { status: newStatus }
      );

      await loadResolutions();
      toast({
        title: 'موفقیت',
        description: 'وضعیت مصوبه به‌روز شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی وضعیت',
        variant: 'destructive'
      });
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedResolution) return;

    const newComment = {
      id: crypto.randomUUID(),
      resolution_id: selectedResolution.id,
      user_id: 'current-user',
      user_name: 'کاربر فعلی',
      comment,
      created_at: new Date().toISOString()
    };

    const updatedComments = [...(selectedResolution.comments || []), newComment];

    try {
      await professionalMeetingService.updateResolution(
        selectedResolution.meeting_id,
        selectedResolution.id,
        { comments: updatedComments }
      );

      setSelectedResolution({...selectedResolution, comments: updatedComments});
      toast({
        title: 'موفقیت',
        description: 'نظر اضافه شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در افزودن نظر',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedResolution) return;

    try {
      await professionalMeetingService.updateResolution(
        selectedResolution.meeting_id,
        selectedResolution.id,
        {
          status: updateForm.status as MeetingResolution['status'],
          progress: updateForm.progress,
          implementation_notes: updateForm.implementation_notes
        }
      );

      toast({
        title: 'موفقیت',
        description: 'وضعیت مصوبه به‌روزرسانی شد'
      });

      setIsUpdateModalOpen(false);
      loadResolutions();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی مصوبه',
        variant: 'destructive'
      });
    }
  };

  // فیلتر و مرتب‌سازی
  const getFilteredAndSortedResolutions = () => {
    let filtered = [...resolutions];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.responsible_party.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(r => filters.status!.includes(r.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(r => filters.priority!.includes(r.priority));
    }

    if (filters.dueDateFrom) {
      filtered = filtered.filter(r => r.due_date && r.due_date >= filters.dueDateFrom!);
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter(r => r.due_date && r.due_date <= filters.dueDateTo!);
    }

    filtered = filtered.filter(r => {
      const progress = r.progress || 0;
      return progress >= (filters.progressMin || 0) && progress <= (filters.progressMax || 100);
    });

    return filtered;
  };

  const filteredResolutions = getFilteredAndSortedResolutions();

  // آمار
  const totalResolutions = resolutions.length;
  const completedResolutions = resolutions.filter(r => r.status === 'completed').length;
  const inProgressResolutions = resolutions.filter(r => r.status === 'in_progress').length;
  const overdueResolutions = resolutions.filter(r => 
    r.due_date && new Date(r.due_date) < new Date() && r.status !== 'completed'
  ).length;
  const completionRate = totalResolutions > 0 ? Math.round((completedResolutions / totalResolutions) * 100) : 0;

  if (isLoading) {
    return <div className="flex justify-center p-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">پیگیری مصوبات</h2>
        <div className="flex items-center gap-2">
          <ResolutionNotificationBell 
            resolutions={resolutions}
            onNotificationClick={(id) => {
              const resolution = resolutions.find(r => r.id === id);
              if (resolution) openUpdateModal(resolution);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 ml-2" />
            فیلترها
          </Button>
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)}>
            <ToggleGroupItem value="list">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban">
              <Columns className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalResolutions}</div>
            <div className="text-sm text-muted-foreground">کل مصوبات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedResolutions}</div>
            <div className="text-sm text-muted-foreground">تکمیل شده</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressResolutions}</div>
            <div className="text-sm text-muted-foreground">در حال اجرا</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{overdueResolutions}</div>
            <div className="text-sm text-muted-foreground">عقب‌افتاده</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-sm text-muted-foreground">نرخ تکمیل</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resolutions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resolutions">مصوبات</TabsTrigger>
          <TabsTrigger value="analytics">تحلیل</TabsTrigger>
          <TabsTrigger value="export">خروجی</TabsTrigger>
        </TabsList>

        <TabsContent value="resolutions" className="space-y-4 mt-4">
          {showFilters && (
            <ResolutionFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                search: '',
                status: [],
                priority: [],
                progressMin: 0,
                progressMax: 100
              })}
            />
          )}

          {viewMode === 'kanban' ? (
            <ResolutionKanbanBoard
              resolutions={filteredResolutions}
              onStatusChange={handleStatusChange}
              onResolutionClick={openUpdateModal}
            />
          ) : (
            <div className="space-y-4">
              {filteredResolutions.length === 0 ? (
                <Card>
                  <CardContent className="text-center p-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {resolutions.length === 0 ? 'هنوز مصوبه‌ای ثبت نشده است' : 'مصوبه‌ای با این فیلترها یافت نشد'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredResolutions.map((resolution) => (
                  <Card key={resolution.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{resolution.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resolution.meetingTitle} • {new Date(resolution.meetingDate).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getStatusColor(resolution.status)}>
                            {getStatusText(resolution.status)}
                          </Badge>
                          <Badge variant={getPriorityColor(resolution.priority)}>
                            {resolution.priority === 'high' ? 'بالا' : resolution.priority === 'medium' ? 'متوسط' : 'پایین'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{resolution.description}</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">مسئول: {resolution.responsible_party}</span>
                        </div>
                        {resolution.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">مهلت: {new Date(resolution.due_date).toLocaleDateString('fa-IR')}</span>
                            {new Date(resolution.due_date) < new Date() && resolution.status !== 'completed' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                        {resolution.status !== 'completed' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>پیشرفت</span>
                              <span>{resolution.progress || 0}%</span>
                            </div>
                            <Progress value={resolution.progress || 0} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={() => openUpdateModal(resolution)}>
                          به‌روزرسانی
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ResolutionAnalyticsDashboard resolutions={resolutions} />
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <ResolutionReportGenerator resolutions={resolutions} />
        </TabsContent>
      </Tabs>

      {/* مودال به‌روزرسانی */}
      <ResponsiveDialog
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        title="به‌روزرسانی مصوبه"
        description={selectedResolution?.title}
      >
        <Tabs defaultValue="update">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="update">به‌روزرسانی</TabsTrigger>
            <TabsTrigger value="comments">نظرات</TabsTrigger>
            <TabsTrigger value="timeline">تاریخچه</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">وضعیت</label>
              <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="in_progress">در حال اجرا</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="cancelled">لغو شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">پیشرفت: {updateForm.progress}%</label>
              <Slider
                value={[updateForm.progress]}
                onValueChange={([value]) => setUpdateForm(prev => ({ ...prev, progress: value }))}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">یادداشت‌های اجرا</label>
              <Textarea
                value={updateForm.implementation_notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, implementation_notes: e.target.value }))}
                rows={4}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">ذخیره</Button>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            {selectedResolution && (
              <ResolutionComments
                comments={selectedResolution.comments || []}
                onAddComment={handleAddComment}
              />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {selectedResolution && (
              <ResolutionTimeline activities={selectedResolution.activity_log || []} />
            )}
          </TabsContent>
        </Tabs>
      </ResponsiveDialog>
    </div>
  );
};
