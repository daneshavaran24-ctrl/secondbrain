import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { networkingService } from "@/services/networkingService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NetworkingInteractionFormProps {
  contactId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NetworkingInteractionForm({ contactId, onSuccess, onCancel }: NetworkingInteractionFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    interaction_type: "meeting",
    title: "",
    description: "",
    interaction_date: new Date().toISOString().split("T")[0],
    duration: "",
    outcome: "positive",
    follow_up_action: "",
    follow_up_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "عنوان تعامل الزامی است", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await networkingService.createInteraction({
        contact_id: contactId,
        user_id: user.id,
        interaction_type: formData.interaction_type,
        title: formData.title,
        description: formData.description || null,
        interaction_date: new Date(formData.interaction_date).toISOString(),
        duration: formData.duration ? parseInt(formData.duration) : null,
        outcome: formData.outcome || null,
        follow_up_action: formData.follow_up_action || null,
        follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
      });

      toast({ title: "تعامل ثبت شد" });
      onSuccess();
    } catch (error) {
      console.error("Error creating interaction:", error);
      toast({ title: "خطا در ثبت تعامل", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>نوع تعامل</Label>
          <Select value={formData.interaction_type} onValueChange={(v) => setFormData({ ...formData, interaction_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">جلسه حضوری</SelectItem>
              <SelectItem value="call">تماس تلفنی</SelectItem>
              <SelectItem value="email">ایمیل</SelectItem>
              <SelectItem value="linkedin">پیام LinkedIn</SelectItem>
              <SelectItem value="event">رویداد</SelectItem>
              <SelectItem value="referral">معرفی</SelectItem>
              <SelectItem value="video_call">تماس تصویری</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>تاریخ</Label>
          <Input
            type="date"
            value={formData.interaction_date}
            onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>عنوان *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="مثال: جلسه معرفی محصول"
        />
      </div>

      <div className="space-y-2">
        <Label>توضیحات</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="خلاصه‌ای از تعامل..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>مدت زمان (دقیقه)</Label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="30"
          />
        </div>

        <div className="space-y-2">
          <Label>نتیجه</Label>
          <Select value={formData.outcome} onValueChange={(v) => setFormData({ ...formData, outcome: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">مثبت</SelectItem>
              <SelectItem value="neutral">خنثی</SelectItem>
              <SelectItem value="needs_followup">نیاز به پیگیری</SelectItem>
              <SelectItem value="no_response">بدون پاسخ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>اقدام پیگیری</Label>
        <Input
          value={formData.follow_up_action}
          onChange={(e) => setFormData({ ...formData, follow_up_action: e.target.value })}
          placeholder="مثال: ارسال پروپوزال"
        />
      </div>

      <div className="space-y-2">
        <Label>تاریخ پیگیری</Label>
        <Input
          type="date"
          value={formData.follow_up_date}
          onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "در حال ثبت..." : "ثبت تعامل"}
        </Button>
      </div>
    </form>
  );
}
