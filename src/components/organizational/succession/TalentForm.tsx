import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/hooks/use-toast";
import { type TalentPoolMember, type SuccessionPosition, type SuccessionServiceAPI } from "@/services/successionServiceTypes";

interface TalentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TalentPoolMember;
  organizationId: string;
  service: SuccessionServiceAPI;
  onSuccess: () => void;
}

export function TalentForm({ open, onOpenChange, member, organizationId, service, onSuccess }: TalentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<SuccessionPosition[]>([]);
  const [formData, setFormData] = useState({
    employee_name: member?.employee_name || "",
    employee_id: member?.employee_id || "",
    current_position: member?.current_position || "",
    target_position_id: member?.target_position_id || "",
    target_position_title: "",
    readiness_level: member?.readiness_level || "not_ready" as const,
    performance_rating: member?.performance_rating || 3,
    potential_rating: member?.potential_rating || 3,
    development_needs: member?.development_needs || "",
    career_aspirations: member?.career_aspirations || "",
    notes: member?.notes || "",
    skills: member?.skills?.join(", ") || ""
  });

  // Load positions when dialog opens or organization changes
  useEffect(() => {
    if (open) {
      loadPositions();
    }
  }, [open, organizationId]);

  // Set initial target position title when editing and positions are loaded
  useEffect(() => {
    if (!open || !member?.target_position_id) return;
    
    const position = positions.find(p => p.id === member.target_position_id);
    if (position) {
      setFormData(prev => ({ ...prev, target_position_title: position.position_title }));
    }
  }, [open, member?.target_position_id, positions]);

  const loadPositions = async () => {
    try {
      const data = await service.getPositions(organizationId);
      setPositions(data);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let targetPositionId = formData.target_position_id;

      // If user typed a new position title, create it first
      if (formData.target_position_title && !formData.target_position_id) {
        const existingPosition = positions.find(
          p => p.position_title.toLowerCase() === formData.target_position_title.toLowerCase()
        );
        
        if (existingPosition) {
          targetPositionId = existingPosition.id!;
        } else {
          // Create new position
          const newPosition = await service.createPosition({
            organization_id: organizationId,
            position_title: formData.target_position_title,
            criticality: 'medium',
            readiness_level: 'not_ready'
          });
          targetPositionId = newPosition.id!;
          
          toast({
            title: "موفقیت",
            description: `سمت جدید "${formData.target_position_title}" ایجاد شد`
          });
        }
      }

      const data = {
        ...formData,
        organization_id: organizationId,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        target_position_id: targetPositionId || undefined
      };

      // Remove the extra field we added for UI
      delete (data as any).target_position_title;

      if (member?.id) {
        await service.updateTalentMember(member.id, data);
        toast({
          title: "موفقیت",
          description: "عضو بانک استعداد با موفقیت به‌روزرسانی شد"
        });
      } else {
        await service.createTalentMember(data);
        toast({
          title: "موفقیت",
          description: "عضو جدید به بانک استعداد اضافه شد"
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
      <Button type="submit" form="talent-form" disabled={loading}>
        {member ? "به‌روزرسانی" : "افزودن"}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={member ? "ویرایش عضو بانک استعداد" : "عضو جدید بانک استعداد"}
      footer={footer}
    >
      <form id="talent-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employee_name">نام پرسنل *</Label>
          <Input
            id="employee_name"
            value={formData.employee_name}
            onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
            placeholder="نام و نام خانوادگی"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee_id">کد پرسنلی</Label>
          <Input
            id="employee_id"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            placeholder="کد پرسنلی"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_position">سمت فعلی</Label>
          <Input
            id="current_position"
            value={formData.current_position}
            onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
            placeholder="سمت فعلی پرسنل"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_position_title">سمت هدف</Label>
          <Input
            id="target_position_title"
            list="positions-list"
            value={formData.target_position_title}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ 
                ...formData, 
                target_position_title: value,
                target_position_id: positions.find(p => p.position_title === value)?.id || ""
              });
            }}
            placeholder="نام سمت مورد نظر را تایپ کنید یا از لیست انتخاب کنید"
          />
          <datalist id="positions-list">
            {positions.map((position) => (
              <option key={position.id} value={position.position_title} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">
            می‌توانید نام سمت جدید تایپ کنید یا از سمت‌های موجود انتخاب کنید
          </p>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="performance_rating">امتیاز عملکرد (۱-۵)</Label>
            <Select
              value={formData.performance_rating.toString()}
              onValueChange={(value) => setFormData({ ...formData, performance_rating: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="1">۱</SelectItem>
                <SelectItem value="2">۲</SelectItem>
                <SelectItem value="3">۳</SelectItem>
                <SelectItem value="4">۴</SelectItem>
                <SelectItem value="5">۵</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="potential_rating">امتیاز پتانسیل (۱-۵)</Label>
            <Select
              value={formData.potential_rating.toString()}
              onValueChange={(value) => setFormData({ ...formData, potential_rating: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="1">۱</SelectItem>
                <SelectItem value="2">۲</SelectItem>
                <SelectItem value="3">۳</SelectItem>
                <SelectItem value="4">۴</SelectItem>
                <SelectItem value="5">۵</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">مهارت‌ها</Label>
          <Input
            id="skills"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="مهارت‌ها را با کاما جدا کنید"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="development_needs">نیازهای توسعه</Label>
          <Textarea
            id="development_needs"
            value={formData.development_needs}
            onChange={(e) => setFormData({ ...formData, development_needs: e.target.value })}
            placeholder="آموزش‌ها و مهارت‌هایی که نیاز دارد"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="career_aspirations">اهداف شغلی</Label>
          <Textarea
            id="career_aspirations"
            value={formData.career_aspirations}
            onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
            placeholder="اهداف و آرزوهای شغلی"
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