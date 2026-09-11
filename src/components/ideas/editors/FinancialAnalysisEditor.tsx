import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ideaAnalysisService } from "@/services/ideaAnalysisService";

const financialSchema = z.object({
  initial_capital_min: z.number().optional(),
  initial_capital_max: z.number().optional(),
  initial_capital_currency: z.string().optional(),
  monthly_operational_costs: z.any().optional(),
  revenue_forecast: z.any().optional(),
  break_even_month: z.number().optional(),
  break_even_analysis: z.string().optional(),
  roi_percentage: z.number().optional(),
  roi_timeline: z.string().optional(),
  profit_margin_percentage: z.number().optional(),
  cash_flow_analysis: z.string().optional(),
  assumptions: z.string().optional(),
  financial_notes: z.string().optional(),
});

type FinancialFormData = z.infer<typeof financialSchema>;

interface FinancialAnalysisEditorProps {
  ideaId: string;
  financialData: any;
  onSave: () => void;
  onClose: () => void;
}

export function FinancialAnalysisEditor({
  ideaId,
  financialData,
  onSave,
  onClose,
}: FinancialAnalysisEditorProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      initial_capital_min: financialData?.initial_capital_min || 0,
      initial_capital_max: financialData?.initial_capital_max || 0,
      initial_capital_currency: financialData?.initial_capital_currency || "IRR",
      break_even_month: financialData?.break_even_month || 0,
      break_even_analysis: financialData?.break_even_analysis || "",
      roi_percentage: financialData?.roi_percentage || 0,
      roi_timeline: financialData?.roi_timeline || "",
      profit_margin_percentage: financialData?.profit_margin_percentage || 0,
      cash_flow_analysis: financialData?.cash_flow_analysis || "",
      assumptions: financialData?.assumptions || "",
      financial_notes: financialData?.financial_notes || "",
    },
  });

  const onSubmit = async (data: FinancialFormData) => {
    try {
      await ideaAnalysisService.updateFinancialAnalysis(ideaId, data);
      toast.success("تحلیل مالی بروزرسانی شد");
      onSave();
      onClose();
    } catch (error) {
      toast.error("خطا در ذخیره تحلیل مالی");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">ویرایش تحلیل مالی</h3>
      </div>

      {/* Initial Capital */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">سرمایه اولیه</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>حداقل</Label>
            <Input
              type="number"
              {...register("initial_capital_min", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label>حداکثر</Label>
            <Input
              type="number"
              {...register("initial_capital_max", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label>واحد پول</Label>
            <Input {...register("initial_capital_currency")} placeholder="مثال: IRR, USD" />
          </div>
        </div>
      </div>

      {/* Break Even */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">نقطه سربه‌سر</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>ماه سربه‌سر</Label>
            <Input
              type="number"
              {...register("break_even_month", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label>تحلیل سربه‌سر</Label>
            <Textarea {...register("break_even_analysis")} rows={2} />
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">بازگشت سرمایه (ROI)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>درصد ROI</Label>
            <Input
              type="number"
              step="0.1"
              {...register("roi_percentage", { valueAsNumber: true })}
              placeholder="مثال: 150"
            />
          </div>
          <div>
            <Label>بازه زمانی ROI</Label>
            <Input {...register("roi_timeline")} placeholder="مثال: 18 ماه" />
          </div>
        </div>
      </div>

      {/* Profit Margin */}
      <div>
        <Label>حاشیه سود (%)</Label>
        <Input
          type="number"
          step="0.1"
          {...register("profit_margin_percentage", { valueAsNumber: true })}
          placeholder="مثال: 35"
        />
      </div>

      {/* Cash Flow Analysis */}
      <div>
        <Label>تحلیل جریان نقدی</Label>
        <Textarea {...register("cash_flow_analysis")} rows={4} />
      </div>

      {/* Assumptions */}
      <div>
        <Label>فرضیات مالی</Label>
        <Textarea {...register("assumptions")} rows={4} />
      </div>

      {/* Notes */}
      <div>
        <Label>یادداشت‌های مالی</Label>
        <Textarea {...register("financial_notes")} rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          انصراف
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 ml-2" />
          ذخیره تغییرات
        </Button>
      </div>
    </form>
  );
}
