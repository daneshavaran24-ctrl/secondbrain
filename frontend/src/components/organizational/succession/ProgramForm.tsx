import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/hooks/use-toast";
import { type DevelopmentProgram, type SuccessionServiceAPI } from "@/services/successionServiceTypes";

interface ProgramFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: DevelopmentProgram;
  organizationId: string;
  service: SuccessionServiceAPI;
  onSuccess: () => void;
}

export function ProgramForm({ open, onOpenChange, program, organizationId, service, onSuccess }: ProgramFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    program_name: program?.program_name || "",
    description: program?.description || "",
    duration_months: program?.duration_months || 0,
    start_date: program?.start_date || "",
    end_date: program?.end_date || "",
    status: program?.status || "planning" as const,
    completion_rate: program?.completion_rate || 0,
    budget: program?.budget || 0,
    currency: program?.currency || "IRR",
    facilitator: program?.facilitator || "",
    notes: program?.notes || "",
    participants: program?.participants?.join(", ") || "",
    learning_objectives: program?.learning_objectives?.join(", ") || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        organization_id: organizationId,
        participants: formData.participants.split(",").map(s => s.trim()).filter(Boolean),
        learning_objectives: formData.learning_objectives.split(",").map(s => s.trim()).filter(Boolean),
        budget: formData.budget || undefined,
        duration_months: formData.duration_months || undefined
      };

      if (program?.id) {
        await service.updateDevelopmentProgram(program.id, data);
        toast({
          title: "موفقیت",
          description: "برنامه توسعه با موفقیت به‌روزرسانی شد"
        });
      } else {
        await service.createDevelopmentProgram(data);
        toast({
          title: "موفقیت",
          description: "برنامه توسعه جدید با موفقیت ایجاد شد"
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        انصراف
      </Button>
      <Button type="submit" form="program-form" disabled={loading}>
        {program ? "به‌روزرسانی" : "ایجاد"}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={program ? "ویرایش برنامه توسعه" : "برنامه توسعه جدید"}
      footer={footer}
    >
      <form id="program-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program_name">نام برنامه *</Label>
          <Input
            id="program_name"
            value={formData.program_name}
            onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
            placeholder="دوره مدیریت ارشد، کارگاه رهبری، ..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">توضیحات</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="توضیحات کامل برنامه"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration_months">مدت زمان (ماه)</Label>
            <Input
              id="duration_months"
              type="number"
              value={formData.duration_months}
              onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 0 })}
              placeholder="تعداد ماه"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="planning">در حال برنامه‌ریزی</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
                <SelectItem value="suspended">متوقف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">تاریخ شروع</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">تاریخ پایان</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="completion_rate">درصد تکمیل</Label>
            <Input
              id="completion_rate"
              type="number"
              min="0"
              max="100"
              value={formData.completion_rate}
              onChange={(e) => setFormData({ ...formData, completion_rate: parseInt(e.target.value) || 0 })}
              placeholder="۰ تا ۱۰۰"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">بودجه</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
              placeholder="مبلغ بودجه"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facilitator">مدرس/مسئول</Label>
          <Input
            id="facilitator"
            value={formData.facilitator}
            onChange={(e) => setFormData({ ...formData, facilitator: e.target.value })}
            placeholder="نام مدرس یا مسئول برنامه"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="participants">شرکت‌کنندگان</Label>
          <Input
            id="participants"
            value={formData.participants}
            onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
            placeholder="نام‌ها را با کاما جدا کنید"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="learning_objectives">اهداف یادگیری</Label>
          <Textarea
            id="learning_objectives"
            value={formData.learning_objectives}
            onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
            placeholder="اهداف را با کاما جدا کنید"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">یادداشت</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="یادداشت‌های اضافی"
            rows={3}
          />
        </div>
      </form>
    </ResponsiveDialog>
  );
}