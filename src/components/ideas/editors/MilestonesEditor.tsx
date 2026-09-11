import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ideaAnalysisService, Milestone } from "@/services/ideaAnalysisService";
import { format } from "date-fns-jalali";

const milestoneSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string().optional(),
  target_date: z.string().optional(),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

interface MilestonesEditorProps {
  ideaId: string;
  milestones: Milestone[];
  onSave: () => void;
  onClose: () => void;
}

export function MilestonesEditor({
  ideaId,
  milestones,
  onSave,
  onClose,
}: MilestonesEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
  });

  const handleEdit = (milestone: Milestone) => {
    setEditingId(milestone.id || null);
    setIsAdding(false);
    reset({
      title: milestone.title,
      description: milestone.description || "",
      target_date: milestone.target_date || "",
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      title: "",
      description: "",
      target_date: "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await ideaAnalysisService.deleteMilestone(id);
      toast.success("نقطه عطف حذف شد");
      onSave();
    } catch (error) {
      toast.error("خطا در حذف نقطه عطف");
    }
  };

  const handleToggleCompleted = async (milestone: Milestone) => {
    try {
      await ideaAnalysisService.toggleMilestoneCompleted(milestone.id!, !milestone.completed);
      toast.success(milestone.completed ? "علامت‌گذاری به عنوان ناتمام" : "علامت‌گذاری به عنوان تکمیل شده");
      onSave();
    } catch (error) {
      toast.error("خطا در بروزرسانی وضعیت");
    }
  };

  const onSubmit = async (data: MilestoneFormData) => {
    try {
      if (editingId) {
        await ideaAnalysisService.updateMilestone(editingId, data);
        toast.success("نقطه عطف بروزرسانی شد");
      } else {
        await ideaAnalysisService.createMilestone(ideaId, data as any);
        toast.success("نقطه عطف جدید اضافه شد");
      }
      setEditingId(null);
      setIsAdding(false);
      reset();
      onSave();
    } catch (error) {
      toast.error("خطا در ذخیره نقطه عطف");
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ویرایش نقاط عطف</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          افزودن نقطه عطف جدید
        </Button>
      </div>

      {/* Timeline View */}
      <div className="relative">
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {sortedMilestones.map((milestone, index) => (
            <div key={milestone.id} className="relative pr-12">
              {/* Timeline Dot */}
              <div className="absolute right-0 top-2 w-8 h-8 bg-background rounded-full border-2 border-primary flex items-center justify-center">
                {milestone.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="p-4 border rounded-lg bg-card">
                {editingId === milestone.id ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label>عنوان *</Label>
                      <Input {...register("title")} />
                      {errors.title && (
                        <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>توضیحات</Label>
                      <Textarea {...register("description")} rows={3} />
                    </div>

                    <div>
                      <Label>تاریخ هدف</Label>
                      <Input type="date" {...register("target_date")} />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        <Save className="w-4 h-4 ml-2" />
                        ذخیره
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          reset();
                        }}
                      >
                        انصراف
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className={`font-semibold ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {milestone.title}
                        </h4>
                        {milestone.target_date && (
                        <p className="text-sm text-muted-foreground">
                          📅 {format(new Date(milestone.target_date), 'd MMMM yyyy')}
                        </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCompleted(milestone)}
                        >
                          {milestone.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(milestone)}
                        >
                          ویرایش
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(milestone.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Form */}
      {isAdding && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded-lg bg-card space-y-4">
          <h4 className="font-semibold">نقطه عطف جدید</h4>
          
          <div>
            <Label>عنوان *</Label>
            <Input {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label>توضیحات</Label>
            <Textarea {...register("description")} rows={3} />
          </div>

          <div>
            <Label>تاریخ هدف</Label>
            <Input type="date" {...register("target_date")} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm">
              <Save className="w-4 h-4 ml-2" />
              افزودن
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                reset();
              }}
            >
              انصراف
            </Button>
          </div>
        </form>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={onClose}>بستن</Button>
      </div>
    </div>
  );
}
