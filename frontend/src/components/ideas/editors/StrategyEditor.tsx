import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ideaAnalysisService } from "@/services/ideaAnalysisService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const strategySchema = z.object({
  target_audience: z.string().optional(),
  positioning_statement: z.string().optional(),
  growth_strategy: z.string().optional(),
  competitive_strategy: z.string().optional(),
  operational_strategy: z.string().optional(),
  innovation_approach: z.string().optional(),
});

type StrategyFormData = z.infer<typeof strategySchema>;

interface StrategyEditorProps {
  ideaId: string;
  strategyData: any;
  onSave: () => void;
  onClose: () => void;
}

export function StrategyEditor({
  ideaId,
  strategyData,
  onSave,
  onClose,
}: StrategyEditorProps) {
  const { register, handleSubmit } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      target_audience: strategyData?.target_audience || "",
      positioning_statement: strategyData?.positioning_statement || "",
      growth_strategy: strategyData?.growth_strategy || "",
      competitive_strategy: strategyData?.competitive_strategy || "",
      operational_strategy: strategyData?.operational_strategy || "",
      innovation_approach: strategyData?.innovation_approach || "",
    },
  });

  const onSubmit = async (data: StrategyFormData) => {
    try {
      await ideaAnalysisService.updateStrategy(ideaId, data);
      toast.success("استراتژی بروزرسانی شد");
      onSave();
      onClose();
    } catch (error) {
      toast.error("خطا در ذخیره استراتژی");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">ویرایش استراتژی</h3>
        <p className="text-sm text-muted-foreground mt-1">
          استراتژی‌های مختلف خود را تعریف و بروزرسانی کنید
        </p>
      </div>

      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="marketing">بازاریابی</TabsTrigger>
          <TabsTrigger value="growth">رشد</TabsTrigger>
          <TabsTrigger value="operations">عملیاتی</TabsTrigger>
        </TabsList>

        <TabsContent value="marketing" className="space-y-4 mt-4">
          <div>
            <Label>مخاطب هدف</Label>
            <Textarea
              {...register("target_audience")}
              rows={3}
              placeholder="مخاطبان هدف خود را توصیف کنید..."
            />
          </div>

          <div>
            <Label>بیانیه موقعیت‌یابی</Label>
            <Textarea
              {...register("positioning_statement")}
              rows={3}
              placeholder="موقعیت رقابتی خود را تعریف کنید..."
            />
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4 mt-4">
          <div>
            <Label>استراتژی رشد</Label>
            <Textarea
              {...register("growth_strategy")}
              rows={4}
              placeholder="برنامه رشد و توسعه خود را شرح دهید..."
            />
          </div>

          <div>
            <Label>استراتژی رقابتی</Label>
            <Textarea
              {...register("competitive_strategy")}
              rows={4}
              placeholder="چگونه با رقبا رقابت خواهید کرد؟"
            />
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4 mt-4">
          <div>
            <Label>استراتژی عملیاتی</Label>
            <Textarea
              {...register("operational_strategy")}
              rows={4}
              placeholder="چگونه عملیات خود را اجرا خواهید کرد؟"
            />
          </div>

          <div>
            <Label>رویکرد نوآوری</Label>
            <Textarea
              {...register("innovation_approach")}
              rows={4}
              placeholder="رویکرد خود به نوآوری را توصیف کنید..."
            />
          </div>
        </TabsContent>
      </Tabs>

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
