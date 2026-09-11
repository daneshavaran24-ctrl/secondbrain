import { useState, useEffect } from "react";
import { socialResponsibilityService, CSRMilestone } from "@/services/socialResponsibilityService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

interface CSRTimelineProps {
  projectId: string;
}

const statusIcons: Record<string, any> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  completed: 'text-chart-2',
  in_progress: 'text-chart-3',
  pending: 'text-muted-foreground',
  cancelled: 'text-destructive',
};

const statusLabels: Record<string, string> = {
  completed: 'تکمیل شده',
  in_progress: 'در حال انجام',
  pending: 'در انتظار',
  cancelled: 'لغو شده',
};

export function CSRTimeline({ projectId }: CSRTimelineProps) {
  const [milestones, setMilestones] = useState<CSRMilestone[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    status: 'pending' as string,
    progress_percentage: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    const data = await socialResponsibilityService.getMilestones(projectId);
    setMilestones(data);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "عنوان الزامی است", variant: "destructive" });
      return;
    }

    const result = await socialResponsibilityService.createMilestone({
      project_id: projectId,
      ...formData,
      target_date: formData.target_date || null,
      completed_date: null,
    });

    if (result) {
      toast({ title: "نقطه عطف اضافه شد" });
      setFormData({ title: '', description: '', target_date: '', status: 'pending', progress_percentage: 0 });
      setOpen(false);
      loadMilestones();
    } else {
      toast({ title: "خطا در افزودن", variant: "destructive" });
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
    await socialResponsibilityService.updateMilestoneProgress(id, progress, status);
    loadMilestones();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">تایم‌لاین و نقاط عطف</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              افزودن نقطه عطف
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>نقطه عطف جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان نقطه عطف..."
                />
              </div>
              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات..."
                />
              </div>
              <div>
                <Label htmlFor="target_date">تاریخ هدف</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                افزودن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const StatusIcon = statusIcons[milestone.status || 'pending'];
            return (
              <div key={milestone.id} className="relative pr-14">
                {/* Timeline Dot */}
                <div className={`absolute right-0 top-2 p-2 rounded-full bg-card border-2 border-border ${statusColors[milestone.status || 'pending']}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-md ${statusColors[milestone.status || 'pending']} bg-muted`}>
                        {statusLabels[milestone.status || 'pending']}
                      </span>
                    </div>

                    {milestone.target_date && (
                      <p className="text-sm text-muted-foreground">
                        تاریخ هدف: {format(new Date(milestone.target_date), 'yyyy-MM-dd')}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>پیشرفت</span>
                        <span className="font-medium">{milestone.progress_percentage}%</span>
                      </div>
                      <Progress value={milestone.progress_percentage} className="h-2" />
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={milestone.progress_percentage}
                        onChange={(e) => updateProgress(milestone.id, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {milestones.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          هیچ نقطه عطفی تعریف نشده است
        </div>
      )}
    </div>
  );
}