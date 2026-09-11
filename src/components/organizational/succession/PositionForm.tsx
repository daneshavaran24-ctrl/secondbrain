import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/hooks/use-toast";
import { type SuccessionPosition, type SuccessionServiceAPI } from "@/services/successionServiceTypes";

interface PositionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: SuccessionPosition;
  organizationId: string;
  service: SuccessionServiceAPI;
  onSuccess: () => void;
}

export function PositionForm({ open, onOpenChange, position, organizationId, service, onSuccess }: PositionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    position_title: position?.position_title || "",
    department: position?.department || "",
    criticality: position?.criticality || "medium" as const,
    current_holder_name: position?.current_holder_name || "",
    readiness_level: position?.readiness_level || "not_ready" as const,
    qualifications_required: position?.qualifications_required || "",
    notes: position?.notes || "",
    skills_required: position?.skills_required?.join(", ") || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        organization_id: organizationId,
        skills_required: formData.skills_required.split(",").map(s => s.trim()).filter(Boolean)
      };

      if (position?.id) {
        await service.updatePosition(position.id, data);
        toast({
          title: "موفقیت",
          description: "سمت کلیدی با موفقیت به‌روزرسانی شد"
        });
      } else {
        await service.createPosition(data);
        toast({
          title: "موفقیت", 
          description: "سمت کلیدی جدید با موفقیت ایجاد شد"
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
      <Button type="submit" form="position-form" disabled={loading}>
        {position ? "به‌روزرسانی" : "ایجاد"}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={position ? "ویرایش سمت کلیدی" : "سمت کلیدی جدید"}
      footer={footer}
    >
      <form id="position-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="position_title">عنوان سمت *</Label>
          <Input
            id="position_title"
            value={formData.position_title}
            onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
            placeholder="مدیرعامل، مدیر فروش، ..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">دپارتمان</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="فروش، مالی، منابع انسانی، ..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="criticality">میزان اهمیت *</Label>
          <Select
            value={formData.criticality}
            onValueChange={(value: any) => setFormData({ ...formData, criticality: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="low">پایین</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">بالا</SelectItem>
              <SelectItem value="critical">بحرانی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_holder_name">فرد فعلی</Label>
          <Input
            id="current_holder_name"
            value={formData.current_holder_name}
            onChange={(e) => setFormData({ ...formData, current_holder_name: e.target.value })}
            placeholder="نام فرد فعلی در این سمت"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="readiness_level">سطح آمادگی</Label>
          <Select
            value={formData.readiness_level}
            onValueChange={(value: any) => setFormData({ ...formData, readiness_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="ready_now">آماده</SelectItem>
              <SelectItem value="ready_1_year">۱ سال</SelectItem>
              <SelectItem value="ready_2_years">۲ سال</SelectItem>
              <SelectItem value="not_ready">غیرآماده</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills_required">مهارت‌های مورد نیاز</Label>
          <Input
            id="skills_required"
            value={formData.skills_required}
            onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
            placeholder="مهارت‌ها را با کاما جدا کنید"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifications_required">شرایط احراز</Label>
          <Textarea
            id="qualifications_required"
            value={formData.qualifications_required}
            onChange={(e) => setFormData({ ...formData, qualifications_required: e.target.value })}
            placeholder="مدرک تحصیلی، سابقه کار، ..."
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