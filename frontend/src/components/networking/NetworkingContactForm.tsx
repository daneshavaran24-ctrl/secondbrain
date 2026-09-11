import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { networkingService, NetworkingContact } from "@/services/networkingService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NetworkingContactFormProps {
  companyId?: string;
  organizationId?: string;
  contact?: NetworkingContact | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NetworkingContactForm({ 
  companyId, 
  organizationId, 
  contact, 
  onSuccess, 
  onCancel 
}: NetworkingContactFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: contact?.name || "",
    title: contact?.title || "",
    organization_name: contact?.organization_name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    linkedin_url: contact?.linkedin_url || "",
    category: contact?.category || "contact",
    relationship_strength: contact?.relationship_strength || 3,
    networking_goal: contact?.networking_goal || "",
    how_met: contact?.how_met || "",
    met_at_event: contact?.met_at_event || "",
    met_date: contact?.met_date || "",
    status: contact?.status || "active",
    next_followup_date: contact?.next_followup_date?.split("T")[0] || "",
    tags: contact?.tags?.join(", ") || "",
    notes: contact?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "نام مخاطب الزامی است", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const contactData = {
        user_id: user.id,
        company_id: companyId || null,
        organization_id: organizationId || null,
        name: formData.name,
        title: formData.title || null,
        organization_name: formData.organization_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        category: formData.category,
        relationship_strength: formData.relationship_strength,
        networking_goal: formData.networking_goal || null,
        how_met: formData.how_met || null,
        met_at_event: formData.met_at_event || null,
        met_date: formData.met_date || null,
        status: formData.status,
        next_followup_date: formData.next_followup_date ? new Date(formData.next_followup_date).toISOString() : null,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        notes: formData.notes || null,
      };

      if (contact) {
        await networkingService.updateContact(contact.id, contactData);
        toast({ title: "مخاطب بروزرسانی شد" });
      } else {
        await networkingService.createContact(contactData);
        toast({ title: "مخاطب اضافه شد" });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({ title: "خطا در ذخیره مخاطب", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نام *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="نام کامل"
          />
        </div>

        <div className="space-y-2">
          <Label>عنوان شغلی</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: مدیرعامل"
          />
        </div>

        <div className="space-y-2">
          <Label>سازمان</Label>
          <Input
            value={formData.organization_name}
            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
            placeholder="نام شرکت یا سازمان"
          />
        </div>

        <div className="space-y-2">
          <Label>ایمیل</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>تلفن</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="شماره تماس"
          />
        </div>

        <div className="space-y-2">
          <Label>LinkedIn</Label>
          <Input
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div className="space-y-2">
          <Label>دسته‌بندی</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mentor">منتور</SelectItem>
              <SelectItem value="advisor">مشاور</SelectItem>
              <SelectItem value="investor">سرمایه‌گذار</SelectItem>
              <SelectItem value="partner">شریک</SelectItem>
              <SelectItem value="client">مشتری</SelectItem>
              <SelectItem value="peer">همکار</SelectItem>
              <SelectItem value="influencer">اینفلوئنسر</SelectItem>
              <SelectItem value="contact">مخاطب</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>وضعیت رابطه</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">داغ</SelectItem>
              <SelectItem value="warm">گرم</SelectItem>
              <SelectItem value="cold">سرد</SelectItem>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="dormant">خاموش</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>قدرت رابطه: {formData.relationship_strength}</Label>
        <Slider
          value={[formData.relationship_strength]}
          onValueChange={([v]) => setFormData({ ...formData, relationship_strength: v })}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>ضعیف</span>
          <span>متوسط</span>
          <span>قوی</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>هدف از این ارتباط</Label>
        <Input
          value={formData.networking_goal}
          onChange={(e) => setFormData({ ...formData, networking_goal: e.target.value })}
          placeholder="مثال: جذب سرمایه، مشاوره فنی..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نحوه آشنایی</Label>
          <Input
            value={formData.how_met}
            onChange={(e) => setFormData({ ...formData, how_met: e.target.value })}
            placeholder="مثال: معرفی دوست، کنفرانس..."
          />
        </div>

        <div className="space-y-2">
          <Label>رویداد آشنایی</Label>
          <Input
            value={formData.met_at_event}
            onChange={(e) => setFormData({ ...formData, met_at_event: e.target.value })}
            placeholder="نام رویداد"
          />
        </div>

        <div className="space-y-2">
          <Label>تاریخ آشنایی</Label>
          <Input
            type="date"
            value={formData.met_date}
            onChange={(e) => setFormData({ ...formData, met_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>تاریخ فالوآپ بعدی</Label>
          <Input
            type="date"
            value={formData.next_followup_date}
            onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>تگ‌ها (با کاما جدا کنید)</Label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="مثال: تهران، فناوری، استارتاپ"
        />
      </div>

      <div className="space-y-2">
        <Label>یادداشت</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="یادداشت‌های مهم درباره این مخاطب..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "در حال ذخیره..." : (contact ? "بروزرسانی" : "افزودن")}
        </Button>
      </div>
    </form>
  );
}
