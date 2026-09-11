import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SectionHeader } from "@/components/ui/section-header";
import { ModernButton } from "@/components/ui/modern-button";
import { LuxuryToolbar } from "@/components/ui/luxury-toolbar";
import { ModernCard } from "@/components/ui/modern-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EnhancedJalaliMonthGrid } from "@/components/calendar/EnhancedJalaliMonthGrid";
import { EventDetailsDialog } from "@/components/calendar/EventDetailsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { seedHolidaysToSupabase, deleteHolidaySeeds } from "@/services/calendarHolidaySeed";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { convertGregorianToJalali, convertJalaliToGregorian } from "@/lib/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppIcon } from "@/components/ui/app-icon";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ResponsiveGrid } from "@/components/ui/responsive-grid";
import { MobileSheetFilter } from "@/components/ui/mobile-sheet-filter";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Video,
  Bell,
  Edit,
  Trash2,
  Merge,
  Eye,
  User,
  Briefcase,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addMonths } from "date-fns-jalali";

type DomainType = 'personal' | 'professional' | 'organizational';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  domain: DomainType;
  event_type: string;
  location?: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  all_day: boolean;
  family_member?: string;
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

const CalendarPage = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const domain = (searchParams.get('domain') || 'personal') as DomainType;
  // Debug log to check domain value
  // console.log removed for production: Current domain from URL
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'hourly'>('month');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [showHijri, setShowHijri] = useState(false);
  const [showGregorian, setShowGregorian] = useState(false);
  const [showEventBars, setShowEventBars] = useState(true);
  const [highlightFridays, setHighlightFridays] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isNewEventFormOpen, setIsNewEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const [isHolidayDialogOpen, setHolidayDialogOpen] = useState(false);
const [selectedPacks, setSelectedPacks] = useState<{ IR: boolean; UN: boolean; TIMEIR: boolean }>({ IR: true, UN: false, TIMEIR: true });

  const [selectedDomains, setSelectedDomains] = useState<{ personal: boolean; organizational: boolean }>({ personal: true, organizational: true });
  const [processingSeed, setProcessingSeed] = useState<"add" | "delete" | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
    event_type: "meeting",
    priority: "medium" as 'low' | 'medium' | 'high',
    all_day: false,
    domain: domain,
    family_member: "",
    organizer: "",
    cost: 0,
    currency: "IRR",
    attendance_type: "in_person" as 'in_person' | 'online' | 'hybrid',
    capacity: undefined as number | undefined,
    registration_url: "",
    website_url: "",
    venue_address: "",
    contact_info: "",
    notes: "",
    tags: [] as string[]
  });

  const domainInfo = {
    personal: {
      title: 'تقویم شخصی',
      icon: User,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      eventColor: '#10B981'
    },
    professional: {
      title: 'تقویم حرفه‌ای',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      eventColor: '#3B82F6'
    },
    organizational: {
      title: 'تقویم سازمانی',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      eventColor: '#8B5CF6'
    }
  };

  const eventTypes = [
    { value: "meeting", label: "جلسه", icon: "Users" },
    { value: "presentation", label: "ارائه", icon: "Presentation" },
    { value: "appointment", label: "قرار ملاقات", icon: "Calendar" },
    { value: "training", label: "آموزش", icon: "GraduationCap" },
    { value: "travel", label: "سفر", icon: "Plane" },
    { value: "personal", label: "شخصی", icon: "User" },
    { value: "holiday", label: "تعطیلات", icon: "Sun" },
    { value: "exhibition", label: "نمایشگاه", icon: "Store" },
    { value: "conference", label: "کنفرانس", icon: "Mic" },
    { value: "webinar", label: "وبینار", icon: "Video" },
    { value: "workshop", label: "کارگاه آموزشی", icon: "Wrench" },
    { value: "networking", label: "رویداد شبکه‌سازی", icon: "Network" },
    { value: "business_event", label: "رویداد تجاری", icon: "Briefcase" },
    { value: "cultural_event", label: "رویداد فرهنگی", icon: "BookOpen" },
    { value: "sports_event", label: "رویداد ورزشی", icon: "Trophy" }
  ];

  const familyMembers = [
    { value: "spouse", label: "همسر" },
    { value: "child", label: "فرزند" },
    { value: "parent", label: "والدین" },
    { value: "sibling", label: "خواهر/برادر" },
    { value: "relative", label: "خویشاوند" },
    { value: "friend", label: "دوست" }
  ];

  const priorities = [
    { value: "high", label: "بالا", color: "bg-red-500" },
    { value: "medium", label: "متوسط", color: "bg-yellow-500" },
    { value: "low", label: "پایین", color: "bg-green-500" }
  ];

  // Load events from database
  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = (supabase as any)
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (!showAllDomains) {
        query = query.eq('domain', domain);
      }

      const { data, error } = await query;
      
      if (error) {
        toast({
          title: "خطا در بارگیری رویدادها",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const calendarEvents: CalendarEvent[] = (data as any[] || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        domain: event.domain as DomainType,
        event_type: event.event_type || 'event',
        location: event.location || undefined,
        priority: (event.priority || 'medium') as 'low' | 'medium' | 'high',
        color: event.color || '#3B82F6',
        all_day: event.all_day || false,
        family_member: event.family_member || undefined,
        organizer: event.organizer || undefined,
        cost: event.cost || undefined,
        currency: event.currency || 'IRR',
        attendance_type: event.attendance_type || 'in_person',
        capacity: event.capacity || undefined,
        registration_url: event.registration_url || undefined,
        website_url: event.website_url || undefined,
        venue_address: event.venue_address || undefined,
        contact_info: event.contact_info || undefined,
        notes: event.notes || undefined,
        tags: event.tags || []
      }));

      setEvents(calendarEvents);
      setFilteredEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save new event
  const handleSaveEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطا",
          description: "لطفاً وارد شوید",
          variant: "destructive"
        });
        return;
      }

      const startDateTime = newEvent.all_day 
        ? new Date(`${newEvent.start_date}T00:00:00`)
        : new Date(`${newEvent.start_date}T${newEvent.start_time}`);
      
      const endDateTime = newEvent.all_day 
        ? new Date(`${newEvent.end_date || newEvent.start_date}T23:59:59`)
        : new Date(`${newEvent.end_date || newEvent.start_date}T${newEvent.end_time || newEvent.start_time}`);

      const { error } = await (supabase as any)
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: newEvent.title,
          description: newEvent.description,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          domain: newEvent.domain,
          event_type: newEvent.event_type,
          location: newEvent.location,
          priority: newEvent.priority,
          color: domainInfo[newEvent.domain as DomainType].eventColor,
          all_day: newEvent.all_day,
          family_member: newEvent.family_member || null,
          organizer: newEvent.organizer || null,
          cost: newEvent.cost || 0,
          currency: newEvent.currency || 'IRR',
          attendance_type: newEvent.attendance_type || 'in_person',
          capacity: newEvent.capacity || null,
          registration_url: newEvent.registration_url || null,
          website_url: newEvent.website_url || null,
          venue_address: newEvent.venue_address || null,
          contact_info: newEvent.contact_info || null,
          notes: newEvent.notes || null,
          tags: newEvent.tags?.length ? newEvent.tags : null
        });

      if (error) {
        toast({
          title: "خطا در ذخیره رویداد",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "رویداد ذخیره شد",
        description: "رویداد با موفقیت در تقویم اضافه شد"
      });

      // Reset form
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        location: "",
        event_type: "meeting",
        priority: "medium",
        all_day: false,
        domain: domain,
        family_member: "",
        organizer: "",
        cost: 0,
        currency: "IRR",
        attendance_type: "in_person",
        capacity: undefined,
        registration_url: "",
        website_url: "",
        venue_address: "",
        contact_info: "",
        notes: "",
        tags: []
      });
      setShowNewEvent(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleSeedHolidays = async () => {
    try {
      setProcessingSeed('add');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'نیاز به ورود', description: 'برای افزودن مناسبت‌ها ابتدا وارد شوید.' });
        const current = window.location.pathname + window.location.search;
        const url = new URL(window.location.origin + current);
        url.searchParams.set('open', 'holidays');
        navigate(`/auth?redirect=${encodeURIComponent(url.pathname + url.search)}`, { replace: true });
        setProcessingSeed(null);
        setHolidayDialogOpen(false);
        return;
      }
      const packs: ('IR'|'UN'|'TIMEIR')[] = [];
      if (selectedPacks.IR) packs.push('IR');
      if (selectedPacks.UN) packs.push('UN');
      if (selectedPacks.TIMEIR) packs.push('TIMEIR');
      const domains: DomainType[] = [];
      if (selectedDomains.personal) domains.push('personal');
      if (selectedDomains.organizational) domains.push('organizational');
      if (packs.length === 0 || domains.length === 0) {
        toast({ title: 'انتخاب ناقص', description: 'لطفاً حداقل یک پکیج و یک حوزه انتخاب کنید', variant: 'destructive' });
        return;
      }
      const res = await seedHolidaysToSupabase({ packs, domains });
      toast({ title: 'ثبت شد', description: `افزوده شد: ${res.inserted} | تکراری: ${res.skipped}` });
      setHolidayDialogOpen(false);
      await loadEvents();
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message || 'مشکلی پیش آمد', variant: 'destructive' });
    } finally {
      setProcessingSeed(null);
    }
  };

  const handleDeleteHolidays = async () => {
    try {
      setProcessingSeed('delete');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'نیاز به ورود', description: 'برای حذف مناسبت‌ها ابتدا وارد شوید.' });
        const current = window.location.pathname + window.location.search;
        const url = new URL(window.location.origin + current);
        url.searchParams.set('open', 'holidays');
        navigate(`/auth?redirect=${encodeURIComponent(url.pathname + url.search)}`, { replace: true });
        setProcessingSeed(null);
        setHolidayDialogOpen(false);
        return;
      }
      const packs: ('IR'|'UN'|'TIMEIR')[] = [];
      if (selectedPacks.IR) packs.push('IR');
      if (selectedPacks.UN) packs.push('UN');
      if (selectedPacks.TIMEIR) packs.push('TIMEIR');
      const domains: DomainType[] = [];
      if (selectedDomains.personal) domains.push('personal');
      if (selectedDomains.organizational) domains.push('organizational');
      if (packs.length === 0 || domains.length === 0) {
        toast({ title: 'انتخاب ناقص', description: 'لطفاً حداقل یک پکیج و یک حوزه انتخاب کنید', variant: 'destructive' });
        return;
      }
      const res = await deleteHolidaySeeds({ packs, domains });
      toast({ title: 'حذف شد', description: `رویداد حذف‌شده: ${res.deleted}` });
      setHolidayDialogOpen(false);
      await loadEvents();
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message || 'مشکلی پیش آمد', variant: 'destructive' });
    } finally {
      setProcessingSeed(null);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventDate = event.start_date.toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  const getDomainColor = (eventDomain: DomainType) => {
    return domainInfo[eventDomain].eventColor;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(addMonths(currentDate, direction === 'prev' ? -1 : 1));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fa-IR-u-ca-persian', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // SEO: dynamic title and description
  useEffect(() => {
    document.title = `تقویم شمسی - ${formatDate(currentDate)}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'تقویم شمسی تمیز با نمایش اختیاری قمری و میلادی، سبک time.ir');
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [domain, showAllDomains]);

  const openHolidayDialog = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'نیاز به ورود', description: 'برای افزودن مناسبت‌ها ابتدا وارد شوید.' });
      const current = window.location.pathname + window.location.search;
      const url = new URL(window.location.origin + current);
      url.searchParams.set('open', 'holidays');
      navigate(`/auth?redirect=${encodeURIComponent(url.pathname + url.search)}`, { replace: true });
      return;
    }
    setHolidayDialogOpen(true);
  };

  useEffect(() => {
    const open = searchParams.get('open');
    if (open === 'holidays') {
      setHolidayDialogOpen(true);
    }
  }, []);

  const currentDomainInfo = domainInfo[domain];

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <SectionHeader
        title={currentDomainInfo.title}
        subtitle={`مدیریت رویدادها و برنامه‌های ${domain === 'personal' ? 'شخصی' : domain === 'professional' ? 'حرفه‌ای' : 'سازمانی'}`}
        icon={<AppIcon size={isMobile ? "md" : "lg"}><currentDomainInfo.icon /></AppIcon>}
        gradient
      />

      <LuxuryToolbar>
        <div className="flex items-center gap-2">
          <Switch
            id="merge-calendars"
            checked={showAllDomains}
            onCheckedChange={setShowAllDomains}
          />
          <Label htmlFor="merge-calendars" className="text-sm">
            نمایش همه حوزه‌ها
          </Label>
        </div>
        
        {/* Mobile/Desktop filters */}
        <MobileSheetFilter title="تنظیمات نمایش تقویم">
          <div className="flex items-center gap-2">
            <Switch id="show-hijri" checked={showHijri} onCheckedChange={setShowHijri} />
            <Label htmlFor="show-hijri" className="text-sm">نمایش قمری</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-gregorian" checked={showGregorian} onCheckedChange={setShowGregorian} />
            <Label htmlFor="show-gregorian" className="text-sm">نمایش میلادی</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-events" checked={showEventBars} onCheckedChange={setShowEventBars} />
            <Label htmlFor="show-events" className="text-sm">نمایش رویدادها</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="highlight-fridays" checked={highlightFridays} onCheckedChange={setHighlightFridays} />
            <Label htmlFor="highlight-fridays" className="text-sm">جمعه‌ها متمایز</Label>
          </div>
        </MobileSheetFilter>
        
        <ModernButton variant="outline" onClick={openHolidayDialog} magnetic>
          <AppIcon size="sm"><Calendar /></AppIcon>
          {isMobile ? "مناسبت‌ها" : "مناسبت‌های امسال"}
        </ModernButton>
        <ModernButton onClick={() => setShowNewEvent(true)} className="bg-gradient-to-r from-primary to-primary/80" magnetic glow>
          <AppIcon size="sm"><Plus /></AppIcon>
          رویداد جدید
        </ModernButton>
      </LuxuryToolbar>

      {/* Holidays Dialog */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0' : 'sm:max-w-md'}`}>
          <DialogHeader className={isMobile ? 'p-6 pb-0' : ''}>
            <DialogTitle>افزودن/حذف مناسبت‌های امسال</DialogTitle>
            <DialogDescription>پکیج و حوزه‌های مدنظر را انتخاب کنید.</DialogDescription>
          </DialogHeader>
          <div className={`space-y-4 ${isMobile ? 'p-6 py-4 overflow-y-auto flex-1' : ''}`}>
            <div>
              <Label className="text-sm mb-2 block">پکیج مناسبت‌ها</Label>
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <div className="flex items-center gap-2">
                  <Checkbox id="pack-ir" checked={selectedPacks.IR} onCheckedChange={(v) => setSelectedPacks((p) => ({ ...p, IR: !!v }))} />
                  <Label htmlFor="pack-ir">تعطیلات رسمی ایران</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="pack-un" checked={selectedPacks.UN} onCheckedChange={(v) => setSelectedPacks((p) => ({ ...p, UN: !!v }))} />
                  <Label htmlFor="pack-un">روزهای بین‌المللی (UN)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="pack-timeir" checked={selectedPacks.TIMEIR} onCheckedChange={(v) => setSelectedPacks((p) => ({ ...p, TIMEIR: !!v }))} />
                  <Label htmlFor="pack-timeir">مناسبت‌های time.ir</Label>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">حوزه‌ها</Label>
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <div className="flex items-center gap-2">
                  <Checkbox id="dom-personal" checked={selectedDomains.personal} onCheckedChange={(v) => setSelectedDomains((d) => ({ ...d, personal: !!v }))} />
                  <Label htmlFor="dom-personal">شخصی</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="dom-org" checked={selectedDomains.organizational} onCheckedChange={(v) => setSelectedDomains((d) => ({ ...d, organizational: !!v }))} />
                  <Label htmlFor="dom-org">سازمانی</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className={`gap-2 sm:gap-2 ${isMobile ? 'p-6 pt-0 flex-col' : ''}`}>
            <ModernButton variant="destructive" onClick={handleDeleteHolidays} disabled={processingSeed === 'delete'} loading={processingSeed === 'delete'} className={isMobile ? 'w-full' : ''}>
              حذف پکیج‌ها
            </ModernButton>
            <ModernButton onClick={handleSeedHolidays} disabled={processingSeed === 'add'} loading={processingSeed === 'add'} className={isMobile ? 'w-full' : ''}>
              افزودن
            </ModernButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Legend (when showing all domains) */}
      {showAllDomains && (
        <Card className="p-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium">حوزه‌ها:</span>
            {Object.entries(domainInfo).map(([key, info]) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: info.eventColor }}
                />
                <span className="text-sm">{info.title}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className={`text-base md:text-lg font-medium ${isMobile ? 'min-w-[160px]' : 'min-w-[200px]'} text-center`}>
              {formatDate(currentDate)}
            </h2>
            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => setCurrentDate(new Date())}>
            امروز
          </Button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[120px]'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">روزانه</SelectItem>
              <SelectItem value="week">هفتگی</SelectItem>
              <SelectItem value="month">ماهانه</SelectItem>
              <SelectItem value="year">سالانه</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* New Event Form */}
      {showNewEvent && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              رویداد جدید در {currentDomainInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>عنوان</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="عنوان رویداد"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع رویداد</Label>
                <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent({...newEvent, event_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="توضیحات رویداد"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="all-day"
                checked={newEvent.all_day}
                onCheckedChange={(checked) => setNewEvent({...newEvent, all_day: checked})}
              />
              <Label htmlFor="all-day">تمام روز</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاریخ شروع</Label>
                <PersianDatePicker
                  value={newEvent.start_date ? new Date(newEvent.start_date) : null}
                  onChange={(date) => {
                    const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                    setNewEvent({...newEvent, start_date: gregorianDate});
                  }}
                  placeholder="تاریخ شروع را انتخاب کنید"
                />
              </div>
              {!newEvent.all_day && (
                <div className="space-y-2">
                  <Label>ساعت شروع</Label>
                  <Input
                    type="time"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                  />
                </div>
              )}
            </div>

            {!newEvent.all_day && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاریخ پایان</Label>
                  <PersianDatePicker
                    value={newEvent.end_date ? new Date(newEvent.end_date) : null}
                    onChange={(date) => {
                      const gregorianDate = date ? date.toISOString().split('T')[0] : '';
                      setNewEvent({...newEvent, end_date: gregorianDate});
                    }}
                    placeholder="تاریخ پایان را انتخاب کنید"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ساعت پایان</Label>
                  <Input
                    type="time"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>مکان</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="محل برگزاری"
                />
              </div>
              <div className="space-y-2">
                <Label>اولویت</Label>
                <Select value={newEvent.priority} onValueChange={(value: any) => setNewEvent({...newEvent, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Family Member Field - Only for Personal Domain */}
            {domain === 'personal' && (
              <div className="space-y-2">
                <Label>عضو خانواده</Label>
                <Select value={newEvent.family_member} onValueChange={(value) => setNewEvent({...newEvent, family_member: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب عضو خانواده (اختیاری)" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map(member => (
                      <SelectItem key={member.value} value={member.value}>{member.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Event Details Section */}
            {['exhibition', 'conference', 'webinar', 'workshop', 'networking', 'business_event', 'cultural_event', 'sports_event'].includes(newEvent.event_type) && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground">جزئیات رویداد</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>برگزارکننده</Label>
                    <Input
                      value={newEvent.organizer}
                      onChange={(e) => setNewEvent({...newEvent, organizer: e.target.value})}
                      placeholder="نام برگزارکننده"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>نوع حضور</Label>
                    <Select value={newEvent.attendance_type} onValueChange={(value: any) => setNewEvent({...newEvent, attendance_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">حضوری</SelectItem>
                        <SelectItem value="online">آنلاین</SelectItem>
                        <SelectItem value="hybrid">ترکیبی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>هزینه</Label>
                    <Input
                      type="number"
                      value={newEvent.cost}
                      onChange={(e) => setNewEvent({...newEvent, cost: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>واحد پول</Label>
                    <Select value={newEvent.currency} onValueChange={(value) => setNewEvent({...newEvent, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IRR">ریال</SelectItem>
                        <SelectItem value="USD">دلار</SelectItem>
                        <SelectItem value="EUR">یورو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ظرفیت</Label>
                    <Input
                      type="number"
                      value={newEvent.capacity || ''}
                      onChange={(e) => setNewEvent({...newEvent, capacity: e.target.value ? parseInt(e.target.value) : undefined})}
                      placeholder="نامحدود"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>آدرس محل برگزاری</Label>
                  <Textarea
                    value={newEvent.venue_address}
                    onChange={(e) => setNewEvent({...newEvent, venue_address: e.target.value})}
                    placeholder="آدرس کامل محل برگزاری"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>لینک ثبت‌نام</Label>
                    <Input
                      type="url"
                      value={newEvent.registration_url}
                      onChange={(e) => setNewEvent({...newEvent, registration_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وبسایت رویداد</Label>
                    <Input
                      type="url"
                      value={newEvent.website_url}
                      onChange={(e) => setNewEvent({...newEvent, website_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>اطلاعات تماس</Label>
                  <Input
                    value={newEvent.contact_info}
                    onChange={(e) => setNewEvent({...newEvent, contact_info: e.target.value})}
                    placeholder="شماره تماس، ایمیل و..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>یادداشت‌ها</Label>
                  <Textarea
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                    placeholder="یادداشت‌های اضافی"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewEvent(false)}>
                انصراف
              </Button>
              <Button onClick={handleSaveEvent}>
                <Calendar className="h-4 w-4 ml-2" />
                ذخیره رویداد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && filteredEvents.length === 0 && (
        <ModernCard title="" hover>
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="text-sm text-body">
              هنوز رویدادی برای این تقویم ثبت نشده است. می‌توانید مناسبت‌های امسال را اضافه کنید.
            </div>
            <ModernButton onClick={openHolidayDialog} magnetic>
              افزودن مناسبت‌های امسال
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Calendar View */}
      <Card className="bg-card border-border">
        <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
          {loading ? (
            <div className="text-center py-8">در حال بارگیری...</div>
          ) : (
            <EnhancedJalaliMonthGrid
              currentDate={currentDate}
              onSelectDate={(date) => {
                setCurrentDate(date);
              }}
              getEventsForDate={getEventsForDate}
              getEventColor={(event) => showAllDomains ? getDomainColor(event.domain as DomainType || 'personal') : currentDomainInfo.eventColor}
              showHijri={showHijri}
              showGregorian={showGregorian}
              showEventBars={showEventBars}
              highlightFridays={highlightFridays}
              onDateChange={setCurrentDate}
              onNewEvent={(date) => {
                setCurrentDate(date);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            رویدادهای پیش رو
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4' : ''}>
          <div className="space-y-3">
            {filteredEvents
              .filter(event => event.start_date >= new Date())
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors cursor-pointer`}
                     onClick={() => {
                       setSelectedEvent(event);
                       setShowEventDetails(true);
                     }}>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: showAllDomains ? getDomainColor(event.domain) : currentDomainInfo.eventColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{event.title}</h4>
                    <div className={`flex items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground ${isMobile ? 'flex-wrap' : ''}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.start_date.toLocaleDateString('fa-IR')}
                      </span>
                      {!event.all_day && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start_date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                      {showAllDomains && (
                        <Badge variant="outline" className="text-xs">
                          {domainInfo[event.domain].title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                هیچ رویدادی برای نمایش وجود ندارد
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <EventDetailsDialog 
        event={selectedEvent}
        open={showEventDetails}
        onClose={() => {
          setShowEventDetails(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default CalendarPage;