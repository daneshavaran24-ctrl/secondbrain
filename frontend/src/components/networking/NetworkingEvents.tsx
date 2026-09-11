import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, MapPin, Users, Bell, Trash2 } from "lucide-react";
import { networkingService, NetworkingEvent } from "@/services/networkingService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";

interface NetworkingEventsProps {
  companyId?: string;
  organizationId?: string;
}

const eventTypeLabels: Record<string, string> = {
  conference: "کنفرانس",
  meetup: "میتاپ",
  webinar: "وبینار",
  workshop: "کارگاه",
  dinner: "شام کاری",
  exhibition: "نمایشگاه",
  networking: "نتورکینگ",
};

export function NetworkingEvents({ companyId, organizationId }: NetworkingEventsProps) {
  const [events, setEvents] = useState<NetworkingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    event_type: "conference",
    location: "",
    event_date: "",
    contacts_made: "0",
    follow_ups_scheduled: "0",
    notes: "",
  });

  useEffect(() => {
    loadEvents();
  }, [companyId, organizationId]);

  const loadEvents = async () => {
    try {
      const data = await networkingService.getEvents(companyId, organizationId);
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: "عنوان رویداد الزامی است", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await networkingService.createEvent({
        user_id: user.id,
        company_id: companyId || null,
        organization_id: organizationId || null,
        title: formData.title,
        event_type: formData.event_type || null,
        location: formData.location || null,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
        contacts_made: parseInt(formData.contacts_made) || 0,
        follow_ups_scheduled: parseInt(formData.follow_ups_scheduled) || 0,
        notes: formData.notes || null,
      });

      toast({ title: "رویداد اضافه شد" });
      setShowForm(false);
      setFormData({
        title: "",
        event_type: "conference",
        location: "",
        event_date: "",
        contacts_made: "0",
        follow_ups_scheduled: "0",
        notes: "",
      });
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({ title: "خطا در ایجاد رویداد", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await networkingService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast({ title: "رویداد حذف شد" });
    } catch (error) {
      toast({ title: "خطا در حذف رویداد", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">رویدادهای نتورکینگ</h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          رویداد جدید
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">هنوز رویدادی ثبت نشده است</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 ml-2" />
            اضافه کردن اولین رویداد
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{event.title}</h4>
                      {event.event_type && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {eventTypeLabels[event.event_type] || event.event_type}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      {event.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.event_date), "PPP", { locale: faIR })}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{event.contacts_made} مخاطب جدید</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Bell className="h-4 w-4 text-yellow-500" />
                        <span>{event.follow_ups_scheduled} فالوآپ</span>
                      </div>
                    </div>

                    {event.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن رویداد جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان رویداد *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: کنفرانس استارتاپی تهران"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع رویداد</Label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">کنفرانس</SelectItem>
                    <SelectItem value="meetup">میتاپ</SelectItem>
                    <SelectItem value="webinar">وبینار</SelectItem>
                    <SelectItem value="workshop">کارگاه</SelectItem>
                    <SelectItem value="dinner">شام کاری</SelectItem>
                    <SelectItem value="exhibition">نمایشگاه</SelectItem>
                    <SelectItem value="networking">نتورکینگ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تاریخ</Label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>مکان</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="آدرس یا لینک آنلاین"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تعداد مخاطبین جدید</Label>
                <Input
                  type="number"
                  value={formData.contacts_made}
                  onChange={(e) => setFormData({ ...formData, contacts_made: e.target.value })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>تعداد فالوآپ‌ها</Label>
                <Input
                  type="number"
                  value={formData.follow_ups_scheduled}
                  onChange={(e) => setFormData({ ...formData, follow_ups_scheduled: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>یادداشت</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="نکات مهم رویداد..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                انصراف
              </Button>
              <Button type="submit">
                افزودن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
