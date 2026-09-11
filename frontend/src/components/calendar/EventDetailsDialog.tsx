import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Globe, 
  Link as LinkIcon,
  Phone,
  DollarSign,
  User,
  Building2,
  StickyNote,
  Tag
} from "lucide-react";
import { format } from "date-fns-jalali";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  domain: string;
  event_type: string;
  location?: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  all_day: boolean;
  organizer?: string;
  cost?: number;
  currency?: string;
  attendance_type?: 'in_person' | 'online' | 'hybrid';
  capacity?: number;
  registration_url?: string;
  website_url?: string;
  venue_address?: string;
  contact_info?: string;
  notes?: string;
  tags?: string[];
}

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export const EventDetailsDialog = ({ event, open, onClose }: EventDetailsDialogProps) => {
  if (!event) return null;

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500"
  };

  const priorityLabels = {
    high: "بالا",
    medium: "متوسط",
    low: "پایین"
  };

  const attendanceLabels = {
    in_person: "حضوری",
    online: "آنلاین",
    hybrid: "ترکیبی"
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: Record<string, string> = {
      IRR: "ریال",
      USD: "دلار",
      EUR: "یورو"
    };
    return `${amount.toLocaleString('fa-IR')} ${currencySymbols[currency] || currency}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${priorityColors[event.priority]}`} />
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {event.event_type === 'meeting' && 'جلسه'}
              {event.event_type === 'exhibition' && 'نمایشگاه'}
              {event.event_type === 'conference' && 'کنفرانس'}
              {event.event_type === 'webinar' && 'وبینار'}
              {event.event_type === 'workshop' && 'کارگاه آموزشی'}
              {event.event_type === 'networking' && 'رویداد شبکه‌سازی'}
              {event.event_type === 'business_event' && 'رویداد تجاری'}
              {event.event_type === 'cultural_event' && 'رویداد فرهنگی'}
              {event.event_type === 'sports_event' && 'رویداد ورزشی'}
            </Badge>
            <Badge className={priorityColors[event.priority]}>
              {priorityLabels[event.priority]}
            </Badge>
            {event.all_day && <Badge variant="secondary">تمام روز</Badge>}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}

          <Separator />

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">تاریخ:</span>
              <span>{format(event.start_date, "yyyy/MM/dd")}</span>
            </div>
            {!event.all_day && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ساعت:</span>
                <span>
                  {format(event.start_date, "HH:mm")} - {format(event.end_date, "HH:mm")}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">مکان:</span>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}

          {/* Organizer */}
          {event.organizer && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">برگزارکننده:</span>
                <span>{event.organizer}</span>
              </div>
            </>
          )}

          {/* Attendance Type & Capacity */}
          {event.attendance_type && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">نوع حضور:</span>
                <span>{attendanceLabels[event.attendance_type]}</span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ظرفیت:</span>
                  <span>{event.capacity.toLocaleString('fa-IR')} نفر</span>
                </div>
              )}
            </div>
          )}

          {/* Cost */}
          {event.cost && event.cost > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">هزینه:</span>
              <span>{formatCurrency(event.cost, event.currency || 'IRR')}</span>
            </div>
          )}

          {/* Venue Address */}
          {event.venue_address && (
            <>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="font-medium">آدرس کامل:</span>
                  <p className="text-muted-foreground mt-1">{event.venue_address}</p>
                </div>
              </div>
            </>
          )}

          {/* URLs */}
          {(event.registration_url || event.website_url) && (
            <>
              <Separator />
              <div className="space-y-2">
                {event.registration_url && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={event.registration_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      لینک ثبت‌نام
                    </a>
                  </div>
                )}
                {event.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={event.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      وبسایت رویداد
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Contact Info */}
          {event.contact_info && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">اطلاعات تماس:</span>
              <span>{event.contact_info}</span>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="font-medium">یادداشت‌ها:</span>
                  <p className="text-muted-foreground mt-1">{event.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
