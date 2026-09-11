import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ideaAnalysisService, RevenueOpportunity } from "@/services/ideaAnalysisService";

const opportunitySchema = z.object({
  revenue_model: z.string().min(1, "مدل درآمدی الزامی است"),
  market_size: z.string().optional(),
  pricing_strategy: z.string().optional(),
  target_segment: z.string().optional(),
  revenue_estimate: z.string().optional(),
  timeline: z.string().optional(),
  confidence_level: z.enum(["low", "medium", "high"]).optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface RevenueOpportunityEditorProps {
  ideaId: string;
  opportunities: RevenueOpportunity[];
  onSave: () => void;
  onClose: () => void;
}

export function RevenueOpportunityEditor({
  ideaId,
  opportunities,
  onSave,
  onClose,
}: RevenueOpportunityEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
  });

  const handleEdit = (opp: RevenueOpportunity) => {
    setEditingId(opp.id || null);
    setIsAdding(false);
    reset({
      revenue_model: opp.revenue_model,
      market_size: opp.market_size || "",
      pricing_strategy: opp.pricing_strategy || "",
      target_segment: opp.target_segment || "",
      revenue_estimate: opp.revenue_estimate || "",
      timeline: opp.timeline || "",
      confidence_level: (opp.confidence_level as any) || undefined,
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      revenue_model: "",
      market_size: "",
      pricing_strategy: "",
      target_segment: "",
      revenue_estimate: "",
      timeline: "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await ideaAnalysisService.deleteRevenueOpportunity(id);
      toast.success("فرصت درآمد حذف شد");
      onSave();
    } catch (error) {
      toast.error("خطا در حذف فرصت درآمد");
    }
  };

  const onSubmit = async (data: OpportunityFormData) => {
    try {
      if (editingId) {
        await ideaAnalysisService.updateRevenueOpportunity(editingId, data);
        toast.success("فرصت درآمد بروزرسانی شد");
      } else {
        await ideaAnalysisService.createRevenueOpportunity(ideaId, data as any);
        toast.success("فرصت درآمد جدید اضافه شد");
      }
      setEditingId(null);
      setIsAdding(false);
      reset();
      onSave();
    } catch (error) {
      toast.error("خطا در ذخیره فرصت درآمد");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ویرایش فرصت‌های درآمد</h3>
        <Button onClick={handleAdd} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          افزودن فرصت جدید
        </Button>
      </div>

      {/* Existing Opportunities */}
      <div className="space-y-4">
        {opportunities.map((opp) => (
          <div key={opp.id} className="p-4 border rounded-lg bg-card">
            {editingId === opp.id ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>مدل درآمدی *</Label>
                  <Input {...register("revenue_model")} />
                  {errors.revenue_model && (
                    <p className="text-sm text-destructive mt-1">{errors.revenue_model.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>اندازه بازار</Label>
                    <Input {...register("market_size")} />
                  </div>
                  <div>
                    <Label>استراتژی قیمت‌گذاری</Label>
                    <Input {...register("pricing_strategy")} />
                  </div>
                </div>

                <div>
                  <Label>بخش هدف</Label>
                  <Textarea {...register("target_segment")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>تخمین درآمد</Label>
                    <Input {...register("revenue_estimate")} />
                  </div>
                  <div>
                    <Label>بازه زمانی</Label>
                    <Input {...register("timeline")} />
                  </div>
                </div>

                <div>
                  <Label>سطح اطمینان</Label>
                  <Select
                    onValueChange={(value) => setValue("confidence_level", value as any)}
                    defaultValue={opp.confidence_level || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">پایین</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">بالا</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <h4 className="font-semibold">{opp.revenue_model}</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(opp)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(opp.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {opp.market_size && <p className="text-sm text-muted-foreground">بازار: {opp.market_size}</p>}
                {opp.target_segment && <p className="text-sm text-muted-foreground">هدف: {opp.target_segment}</p>}
                {opp.revenue_estimate && <p className="text-sm text-muted-foreground">تخمین: {opp.revenue_estimate}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Form */}
      {isAdding && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded-lg bg-card space-y-4">
          <h4 className="font-semibold">فرصت درآمد جدید</h4>
          
          <div>
            <Label>مدل درآمدی *</Label>
            <Input {...register("revenue_model")} />
            {errors.revenue_model && (
              <p className="text-sm text-destructive mt-1">{errors.revenue_model.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اندازه بازار</Label>
              <Input {...register("market_size")} />
            </div>
            <div>
              <Label>استراتژی قیمت‌گذاری</Label>
              <Input {...register("pricing_strategy")} />
            </div>
          </div>

          <div>
            <Label>بخش هدف</Label>
            <Textarea {...register("target_segment")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تخمین درآمد</Label>
              <Input {...register("revenue_estimate")} />
            </div>
            <div>
              <Label>بازه زمانی</Label>
              <Input {...register("timeline")} />
            </div>
          </div>

          <div>
            <Label>سطح اطمینان</Label>
            <Select onValueChange={(value) => setValue("confidence_level", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">پایین</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
              </SelectContent>
            </Select>
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
