import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, GripVertical, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ideaAnalysisService, SuggestedAction } from "@/services/ideaAnalysisService";

const actionSchema = z.object({
  action: z.string().min(1, "اقدام الزامی است"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  timeline: z.string().optional(),
  estimated_effort: z.string().optional(),
  dependencies: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

type ActionFormData = z.infer<typeof actionSchema>;

interface SuggestedActionsEditorProps {
  ideaId: string;
  actions: SuggestedAction[];
  onSave: () => void;
  onClose: () => void;
}

export function SuggestedActionsEditor({
  ideaId,
  actions,
  onSave,
  onClose,
}: SuggestedActionsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [items, setItems] = useState(actions);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
  });

  const handleEdit = (action: SuggestedAction) => {
    setEditingId(action.id || null);
    setIsAdding(false);
    reset({
      action: action.action,
      priority: (action.priority as any) || undefined,
      timeline: action.timeline || "",
      estimated_effort: action.estimated_effort || "",
      dependencies: action.dependencies || "",
      status: (action.status as any) || undefined,
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      action: "",
      priority: "medium",
      status: "pending",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await ideaAnalysisService.deleteSuggestedAction(id);
      toast.success("اقدام حذف شد");
      onSave();
    } catch (error) {
      toast.error("خطا در حذف اقدام");
    }
  };

  const handleToggleStatus = async (action: SuggestedAction) => {
    try {
      const newStatus = action.status === "completed" ? "pending" : "completed";
      await ideaAnalysisService.updateSuggestedAction(action.id!, { status: newStatus });
      toast.success("وضعیت بروزرسانی شد");
      onSave();
    } catch (error) {
      toast.error("خطا در بروزرسانی وضعیت");
    }
  };

  const onSubmit = async (data: ActionFormData) => {
    try {
      if (editingId) {
        await ideaAnalysisService.updateSuggestedAction(editingId, data);
        toast.success("اقدام بروزرسانی شد");
      } else {
        await ideaAnalysisService.createSuggestedAction(ideaId, data as any);
        toast.success("اقدام جدید اضافه شد");
      }
      setEditingId(null);
      setIsAdding(false);
      reset();
      onSave();
    } catch (error) {
      toast.error("خطا در ذخیره اقدام");
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case "urgent": return "فوری";
      case "high": return "بالا";
      case "medium": return "متوسط";
      case "low": return "پایین";
      default: return "نامشخص";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "completed": return "انجام شده";
      case "in_progress": return "در حال انجام";
      case "pending": return "در انتظار";
      default: return "در انتظار";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ویرایش اقدامات پیشنهادی</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          افزودن اقدام جدید
        </Button>
      </div>

      {/* Existing Actions */}
      <div className="space-y-3">
        {items.map((action, index) => (
          <div key={action.id} className="p-4 border rounded-lg bg-card">
            {editingId === action.id ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>اقدام *</Label>
                  <Textarea {...register("action")} rows={2} />
                  {errors.action && (
                    <p className="text-sm text-destructive mt-1">{errors.action.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>اولویت</Label>
                    <Select
                      onValueChange={(value) => setValue("priority", value as any)}
                      defaultValue={action.priority || "medium"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">فوری</SelectItem>
                        <SelectItem value="high">بالا</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="low">پایین</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>وضعیت</Label>
                    <Select
                      onValueChange={(value) => setValue("status", value as any)}
                      defaultValue={action.status || "pending"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">در انتظار</SelectItem>
                        <SelectItem value="in_progress">در حال انجام</SelectItem>
                        <SelectItem value="completed">انجام شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>بازه زمانی</Label>
                    <Input {...register("timeline")} placeholder="مثال: 2 هفته" />
                  </div>
                  <div>
                    <Label>تلاش تخمینی</Label>
                    <Input {...register("estimated_effort")} placeholder="مثال: 10 ساعت" />
                  </div>
                </div>

                <div>
                  <Label>وابستگی‌ها</Label>
                  <Textarea {...register("dependencies")} rows={2} />
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
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-move" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">#{index + 1}</span>
                      <p className="font-medium">{action.action}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(action)}
                      >
                        <CheckCircle className={`w-4 h-4 ${action.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(action)}
                      >
                        ویرایش
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(action.id!)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant={getPriorityColor(action.priority)}>
                      {getPriorityLabel(action.priority)}
                    </Badge>
                    <Badge variant="outline">{getStatusLabel(action.status)}</Badge>
                    {action.timeline && <span>⏱️ {action.timeline}</span>}
                    {action.estimated_effort && <span>💪 {action.estimated_effort}</span>}
                  </div>
                  {action.dependencies && (
                    <p className="text-sm text-muted-foreground mt-2">
                      وابستگی: {action.dependencies}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Form */}
      {isAdding && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded-lg bg-card space-y-4">
          <h4 className="font-semibold">اقدام پیشنهادی جدید</h4>
          
          <div>
            <Label>اقدام *</Label>
            <Textarea {...register("action")} rows={2} />
            {errors.action && (
              <p className="text-sm text-destructive mt-1">{errors.action.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اولویت</Label>
              <Select onValueChange={(value) => setValue("priority", value as any)} defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">فوری</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">پایین</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>وضعیت</Label>
              <Select onValueChange={(value) => setValue("status", value as any)} defaultValue="pending">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="in_progress">در حال انجام</SelectItem>
                  <SelectItem value="completed">انجام شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>بازه زمانی</Label>
              <Input {...register("timeline")} placeholder="مثال: 2 هفته" />
            </div>
            <div>
              <Label>تلاش تخمینی</Label>
              <Input {...register("estimated_effort")} placeholder="مثال: 10 ساعت" />
            </div>
          </div>

          <div>
            <Label>وابستگی‌ها</Label>
            <Textarea {...register("dependencies")} rows={2} />
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
