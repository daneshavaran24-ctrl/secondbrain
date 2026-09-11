import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ideaAnalysisService, Risk } from "@/services/ideaAnalysisService";

const riskSchema = z.object({
  description: z.string().min(1, "توضیحات الزامی است"),
  risk_type: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  mitigation_strategy: z.string().optional(),
});

type RiskFormData = z.infer<typeof riskSchema>;

interface RisksEditorProps {
  ideaId: string;
  risks: Risk[];
  onSave: () => void;
  onClose: () => void;
}

export function RisksEditor({
  ideaId,
  risks,
  onSave,
  onClose,
}: RisksEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
  });

  const handleEdit = (risk: Risk) => {
    setEditingId(risk.id || null);
    setIsAdding(false);
    reset({
      description: risk.description,
      risk_type: risk.risk_type || "",
      severity: (risk.severity as any) || undefined,
      mitigation_strategy: risk.mitigation_strategy || "",
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      description: "",
      risk_type: "",
      severity: "medium",
      mitigation_strategy: "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await ideaAnalysisService.deleteRisk(id);
      toast.success("ریسک حذف شد");
      onSave();
    } catch (error) {
      toast.error("خطا در حذف ریسک");
    }
  };

  const onSubmit = async (data: RiskFormData) => {
    try {
      if (editingId) {
        await ideaAnalysisService.updateRisk(editingId, data);
        toast.success("ریسک بروزرسانی شد");
      } else {
        await ideaAnalysisService.createRisk(ideaId, data as any);
        toast.success("ریسک جدید اضافه شد");
      }
      setEditingId(null);
      setIsAdding(false);
      reset();
      onSave();
    } catch (error) {
      toast.error("خطا در ذخیره ریسک");
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case "critical": return "بحرانی";
      case "high": return "بالا";
      case "medium": return "متوسط";
      case "low": return "پایین";
      default: return "نامشخص";
    }
  };

  // Group by severity for matrix view
  const risksBySeverity = {
    critical: risks.filter(r => r.severity === "critical"),
    high: risks.filter(r => r.severity === "high"),
    medium: risks.filter(r => r.severity === "medium"),
    low: risks.filter(r => r.severity === "low"),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ویرایش ریسک‌ها</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          افزودن ریسک جدید
        </Button>
      </div>

      {/* Risk Matrix Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-center">
          <div className="text-2xl font-bold">{risksBySeverity.critical.length}</div>
          <div className="text-xs text-muted-foreground">بحرانی</div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg text-center">
          <div className="text-2xl font-bold">{risksBySeverity.high.length}</div>
          <div className="text-xs text-muted-foreground">بالا</div>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
          <div className="text-2xl font-bold">{risksBySeverity.medium.length}</div>
          <div className="text-xs text-muted-foreground">متوسط</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <div className="text-2xl font-bold">{risksBySeverity.low.length}</div>
          <div className="text-xs text-muted-foreground">پایین</div>
        </div>
      </div>

      {/* Existing Risks */}
      <div className="space-y-3">
        {risks.map((risk) => (
          <div key={risk.id} className="p-4 border rounded-lg bg-card">
            {editingId === risk.id ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>توضیحات ریسک *</Label>
                  <Textarea {...register("description")} rows={2} />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نوع ریسک</Label>
                    <Input {...register("risk_type")} placeholder="مثال: مالی، عملیاتی، بازار" />
                  </div>
                  <div>
                    <Label>شدت</Label>
                    <Select
                      onValueChange={(value) => setValue("severity", value as any)}
                      defaultValue={risk.severity || "medium"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">بحرانی</SelectItem>
                        <SelectItem value="high">بالا</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="low">پایین</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>استراتژی کاهش ریسک</Label>
                  <Textarea {...register("mitigation_strategy")} rows={3} />
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
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{risk.description}</p>
                      {risk.risk_type && (
                        <p className="text-sm text-muted-foreground mt-1">نوع: {risk.risk_type}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getSeverityColor(risk.severity)}>
                      {getSeverityLabel(risk.severity)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(risk)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(risk.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {risk.mitigation_strategy && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>راهکار کاهش:</strong> {risk.mitigation_strategy}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Form */}
      {isAdding && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded-lg bg-card space-y-4">
          <h4 className="font-semibold">ریسک جدید</h4>
          
          <div>
            <Label>توضیحات ریسک *</Label>
            <Textarea {...register("description")} rows={2} />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نوع ریسک</Label>
              <Input {...register("risk_type")} placeholder="مثال: مالی، عملیاتی، بازار" />
            </div>
            <div>
              <Label>شدت</Label>
              <Select onValueChange={(value) => setValue("severity", value as any)} defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">بحرانی</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">پایین</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>استراتژی کاهش ریسک</Label>
            <Textarea {...register("mitigation_strategy")} rows={3} />
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
