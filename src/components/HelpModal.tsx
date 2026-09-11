import { useState } from "react";
import {
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  PlayCircle,
  Users,
  Lightbulb
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PDFService } from "@/services/pdfService";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TabsListScrollable } from "@/components/ui/tabs-list-scrollable";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const faqItems = [
    // Calendar Module
    {
      id: "calendar-basics",
      question: "تقویم شخصی چگونه کار می‌کند؟",
      answer: "تقویم شامل سه حوزه دارد: شخصی، حرفه‌ای و سازمانی. در تقویم شخصی می‌توانید رویدادهای خانوادگی و شخصی را مدیریت کنید. امکان انتخاب عضو خانواده (همسر، فرزند، والدین) برای هر رویداد وجود دارد. می‌توانید رویدادها را تمام روز یا با ساعت مشخص تنظیم کنید و اولویت‌بندی نمایید."
    },
    {
      id: "calendar-integration",
      question: "چگونه تقویم‌های مختلف را ادغام کنم؟",
      answer: "با فعال کردن گزینه 'نمایش همه حوزه‌ها' می‌توانید رویدادهای شخصی، حرفه‌ای و سازمانی را در یک نمای واحد مشاهده کنید. هر حوزه با رنگ متفاوتی نمایش داده می‌شود. همچنین می‌توانید فیلتر کرده و فقط رویدادهای یک حوزه خاص را ببینید."
    },
    {
      id: "calendar-family",
      question: "فیلد خانواده در تقویم برای چیست؟",
      answer: "در تقویم شخصی می‌توانید برای هر رویداد مشخص کنید که مربوط به کدام عضو خانواده است (همسر، فرزند، والدین، خواهر/برادر، خویشاوند، دوست). این امکان به شما کمک می‌کند تا رویدادهای مربوط به اعضای مختلف خانواده را بهتر سازماندهی و پیگیری کنید."
    },

    // Project Management
    {
      id: "project-management",
      question: "مدیریت پروژه چگونه کار می‌کند؟",
      answer: "سیستم مدیریت پروژه شامل ایجاد پروژه، تعریف وظایف، تخصیص اعضای تیم، تعیین مهلت‌ها و ردیابی پیشرفت است. می‌توانید وظایف را به اولویت‌های مختلف (کم، متوسط، زیاد) تقسیم کنید، وابستگی‌ها تعریف کنید و فایل‌های مرتبط ضمیمه نمایید. نمودار گانت نیز برای نمایش جدول زمانی پروژه در دسترس است."
    },
    {
      id: "task-assignment",
      question: "چگونه وظایف را واگذار کنم؟",
      answer: "در بخش وظایف می‌توانید هر وظیفه را به یکی از اعضای تیم واگذار کنید. امکان تعیین مهلت، اولویت، برچسب‌ها و ضمیمه فایل وجود دارد. سیستم به طور خودکار اطلاع‌رسانی‌ها ارسال می‌کند و وضعیت وظایف را پیگیری می‌نماید. همچنین می‌توانید نظرات و به‌روزرسانی‌ها را به وظایف اضافه کنید."
    },
    {
      id: "project-collaboration",
      question: "همکاری تیمی در پروژه‌ها چگونه است؟",
      answer: "هر پروژه می‌تواند چندین عضو داشته باشد. هر عضو می‌تواند نقش مختلفی (مدیر، عضو، ناظر) داشته باشد. اعضای تیم می‌توانند وظایف محول شده را مشاهده کنند، وضعیت آن‌ها را به‌روزرسانی نمایند، نظر بگذارند و فایل‌های مرتبط را به اشتراک بگذارند."
    },

    // Task Delegation
    {
      id: "delegation-system",
      question: "سیستم واگذاری وظایف چگونه کار می‌کند؟",
      answer: "می‌توانید وظایف را به افراد درون یا خارج سازمان واگذار کنید. سیستم از طریق ایمیل یا SMS اطلاع‌رسانی می‌کند. امکان تعیین مهلت، اولویت، حوزه (شخصی/حرفه‌ای/سازمانی) و ردیابی وضعیت وجود دارد. می‌توانید اطلاعات تماس شامل نام، نام خانوادگی و شماره تلفن را ثبت کنید."
    },
    {
      id: "delegation-tracking",
      question: "چگونه وضعیت وظایف واگذار شده را پیگیری کنم؟",
      answer: "داشبورد واگذاری نمایش کاملی از تمام وظایف واگذار شده ارائه می‌دهد. می‌توانید بر اساس وضعیت (در انتظار، در حال انجام، تکمیل شده)، اولویت یا حوزه فیلتر کنید. همچنین آمار کلی شامل تعداد وظایف فعال، تکمیل شده و میانگین زمان تکمیل نمایش داده می‌شود."
    },
    {
      id: "delegation-notifications",
      question: "اطلاع‌رسانی‌های واگذاری چگونه است؟",
      answer: "سیستم به طور خودکار ایمیل یا SMS به فرد واگذار شده ارسال می‌کند. محتوای پیام شامل عنوان وظیفه، توضیحات، مهلت و اطلاعات تماس شما است. همچنین یادآوری‌هایی قبل از مهلت و اطلاع‌رسانی تکمیل وظیفه ارسال می‌شود."
    },

    // Personal Journal
    {
      id: "personal-journal",
      question: "دفترچه شخصی چه امکاناتی دارد؟",
      answer: "دفترچه شخصی محلی برای ثبت خاطرات، ایده‌ها، احساسات و تجربیات روزانه است. می‌توانید عنوان، محتوا، موقعیت مکانی، وضعیت آب و هوا و حالت روحی را ثبت کنید. امکان ضمیمه کردن تصاویر، اسناد و فایل‌های مختلف وجود دارد. همچنین می‌توانید یادداشت‌ها را خصوصی نگه دارید یا عمومی کنید."
    },
    {
      id: "journal-organization",
      question: "چگونه یادداشت‌ها را سازماندهی کنم؟",
      answer: "می‌توانید از برچسب‌ها (tags) برای دسته‌بندی یادداشت‌ها استفاده کنید. جستجوی قدرتمند امکان پیدا کردن یادداشت‌ها بر اساس عنوان، محتوا، برچسب یا تاریخ را فراهم می‌کند. همچنین می‌توانید یادداشت‌ها را بر اساس حالت روحی، مکان یا فیلترهای زمانی مرتب کنید."
    },

    // Meeting Recording System
    {
      id: "meeting-recording",
      question: "سیستم ضبط جلسات چگونه کار می‌کند؟",
      answer: "سیستم ضبط جلسات امکان ضبط صوتی و تصویری جلسات را فراهم می‌کند. پس از ضبط، سیستم به طور خودکار گفتار را به متن تبدیل کرده و خلاصه‌ای از محتوای جلسه تولید می‌کند. می‌توانید فایل‌های صوتی، متن کامل و خلاصه جلسه را دانلود کنید."
    },
    {
      id: "recording-features",
      question: "ویژگی‌های ضبط جلسه چه‌هایی هستند؟",
      answer: "شامل ضبط با کیفیت بالا، تبدیل گفتار به متن با دقت بالا، خلاصه‌نویسی هوشمند، ثبت مشارکت‌کنندگان، تولید نقاط اقدام (Action Items) و امکان دانلود همه فایل‌ها در فرمت‌های مختلف می‌باشد."
    },
    {
      id: "cultural-content-images",
      question: "چگونه تصویر جلد کتاب یا پوستر فیلم اضافه کنم؟",
      answer: "در بخش محتوای فرهنگی، هنگام اضافه کردن آیتم جدید، می‌توانید از دکمه 'انتخاب تصویر' برای آپلود جلد کتاب یا پوستر فیلم استفاده کنید. تصویر به طور خودکار بهینه‌سازی شده و پیش‌نمایش نمایش داده می‌شود. همچنین می‌توانید URL تصویر را نیز وارد کنید."
    },
    {
      id: "reading-status",
      question: "وضعیت‌های خواندن کتاب چه‌هایی هستند؟",
      answer: "سیستم شامل چهار وضعیت اصلی است: 'در صف مطالعه' (برای کتاب‌هایی که قصد خواندن دارید)، 'در حال خواندن' (برای کتاب‌های در دست مطالعه)، 'خوانده شده' (برای کتاب‌های تکمیل شده) و 'بایگانی' (برای کتاب‌های آرشیو شده). می‌توانید از دکمه‌های سریع برای تنظیم آسان وضعیت استفاده کنید."
    },

    // Gratitude Journal
    {
      id: "gratitude-journal",
      question: "دفتر شکرگذاری چگونه کار می‌کند؟",
      answer: "دفتر شکرگذاری محلی برای ثبت موارد مثبت و شکرگذاری روزانه است. هر روز می‌توانید سه مورد که برایشان احساس شکرگذاری می‌کنید را ثبت کنید. این کار به بهبود روحیه، افزایش خوشبینی و تقویت بهداشت روان کمک می‌کند."
    },
    {
      id: "gratitude-tracking",
      question: "چگونه پیشرفت شکرگذاری را پیگیری کنم؟",
      answer: "تقویم شکرگذاری روزهایی که ورودی ثبت کرده‌اید را نشان می‌دهد. آمار شامل تعداد کل ورودی‌ها، ورودی‌های این ماه و هفته اخیر نمایش داده می‌شود. همچنین آخرین ورودی‌های شما برای مرور و الهام‌بخشی نمایش داده می‌شوند."
    },
    {
      id: "gratitude-benefits",
      question: "فواید شکرگذاری روزانه چیست؟",
      answer: "شکرگذاری روزانه باعث بهبود کیفیت خواب، کاهش استرس، افزایش خوش‌بینی، تقویت سیستم ایمنی، بهبود روابط اجتماعی و افزایش احساس رضایت از زندگی می‌شود. این عادت ساده اما قدرتمند، ذهن را به سمت نکات مثبت زندگی هدایت می‌کند."
    },

    // Notifications
    {
      id: "notification-center",
      question: "مرکز اطلاع‌رسانی چگونه کار می‌کند؟",
      answer: "مرکز اطلاع‌رسانی تمام پیام‌ها، یادآوری‌ها و به‌روزرسانی‌های سیستم را در یک مکان متمرکز نمایش می‌دهد. انواع مختلف اطلاع‌رسانی شامل سیستم، پیام، هشدار، موفقیت و اطلاعات وجود دارد. می‌توانید هر پیام را خوانده علامت بزنید یا حذف کنید."
    },
    {
      id: "notification-types",
      question: "انواع اطلاع‌رسانی‌ها چه‌هایی هستند؟",
      answer: "اطلاع‌رسانی‌ها شامل: سیستم (به‌روزرسانی‌ها و تغییرات سیستم)، پیام (پیام‌های جدید و تماس‌ها)، هشدار (موارد فوری و هشدارها)، موفقیت (تکمیل عملیات موفق) و اطلاعات (اطلاعات مفید) می‌باشند. هر نوع با رنگ و آیکون مخصوص خود نمایش داده می‌شود."
    },

    // Quick Actions & Settings
    {
      id: "quick-actions",
      question: "اقدامات سریع چه کارهایی انجام می‌دهد؟",
      answer: "اقدامات سریع امکان دسترسی فوری به ویژگی‌های پرکاربرد سیستم را فراهم می‌کند. شامل ایجاد جلسه جدید، ایجاد یادداشت، واگذاری سریع وظیفه، ضبط صدا و عکس‌برداری از اسناد است. این دکمه‌ها در قسمت‌های مختلف سیستم قابل دسترس هستند."
    },
    {
      id: "settings-checklist",
      question: "چک‌لیست تنظیمات PDF چیست؟",
      answer: "چک‌لیست تنظیمات فایل PDF قابل دانلودی است که تمام تنظیمات مهم سیستم را شامل می‌شود. این چک‌لیست شامل تنظیمات حریم خصوصی، اتصال گجت‌ها، پیکربندی اطلاع‌رسانی‌ها، تنظیمات امنیتی و بهینه‌سازی عملکرد است. می‌توانید آن را دانلود کرده و مرحله به مرحله تنظیمات را بررسی کنید."
    },

    // Ideas Management
    {
      id: "ideas-system",
      question: "سیستم مدیریت ایده‌ها چگونه کار می‌کند؟",
      answer: "می‌توانید ایده‌هایتان را در سه حوزه شخصی، حرفه‌ای و سازمانی ثبت کنید. هر ایده شامل عنوان، توضیحات، بازار هدف، بودجه تخمینی، ROI مورد انتظار و امتیاز شدنی بودن است. ایده‌ها در مراحل مختلف (مفهوم، توسعه، تست، اجرا) قرار می‌گیرند."
    },
    {
      id: "swot-analysis",
      question: "تحلیل SWOT برای ایده‌ها چیست؟",
      answer: "برای هر ایده می‌توانید تحلیل SWOT کامل انجام دهید: نقاط قوت (Strengths)، نقاط ضعف (Weaknesses)، فرصت‌ها (Opportunities) و تهدیدها (Threats). سیستم استراتژی‌های ترکیبی SO، WO، ST، WT را نیز ارائه می‌دهد و اقدامات اولویت‌دار را مشخص می‌کند."
    },
    {
      id: "idea-milestones",
      question: "نقاط عطف ایده‌ها چگونه مدیریت می‌شود؟",
      answer: "برای هر ایده می‌توانید نقاط عطف (milestones) تعریف کنید. هر نقطه عطف شامل عنوان، توضیحات، تاریخ هدف و وضعیت تکمیل است. این امکان به شما کمک می‌کند پیشرفت ایده را مرحله به مرحله پیگیری کنید و از برنامه‌ریزی منطقی اطمینان حاصل نمایید."
    },

    // Legal Module
    {
      id: "legal-management",
      question: "ماژول حقوقی چه کارهایی انجام می‌دهد؟",
      answer: "بخش حقوقی برای مدیریت قراردادها، اسناد قانونی، پرونده‌ها و پیگیری‌های حقوقی طراحی شده است. می‌توانید اسناد را دسته‌بندی کنید، مهلت‌های مهم را تعیین نمایید، یادآوری‌ها دریافت کنید و فرآیندهای حقوقی را مستند نمایید."
    },
    {
      id: "legal-documents",
      question: "مدیریت اسناد حقوقی چگونه است؟",
      answer: "می‌توانید انواع اسناد حقوقی (قرارداد، وکالت‌نامه، دادخواست، و غیره) را آپلود کنید. سیستم OCR برای استخراج متن از تصاویر دارد. امکان برچسب‌گذاری، جستجو، تعیین مهلت‌های مهم و ضمیمه کردن فایل‌های مرتبط وجود دارد."
    },

    // Secretary System
    {
      id: "secretary-system",
      question: "سیستم منشی چگونه کار می‌کند؟",
      answer: "سیستم منشی دکتر مرتضی کرباسی شامل پورتال اختصاصی منشی‌ها است. منشی‌ها با کد منشی خاص وارد سیستم می‌شوند و دسترسی محدودی دارند. می‌توانند درخواست‌هایی برای ایجاد جلسه، ارسال پیام یا انجام کارهای اداری ثبت کنند. تمام درخواست‌ها نیاز به تأیید مدیر دارند و محدودیت ۲۰ درخواست در ساعت وجود دارد."
    },
    {
      id: "secretary-portal",
      question: "پورتال منشی چه امکاناتی دارد؟",
      answer: "پورتال منشی رابط کاربری اختصاصی برای منشی‌های کلینیک دکتر مرتضی کرباسی است. شامل اقدامات سریع (ایجاد جلسه، ارسال پیام، ثبت یادآوری)، نمایش وضعیت سیستم، محدودیت‌های دسترسی و اطلاعات تماس مدیر است. تمام درخواست‌ها از طریق این پورتال ثبت و پیگیری می‌شوند."
    },
    {
      id: "secretary-permissions",
      question: "مجوزهای منشی چگونه تنظیم می‌شود؟",
      answer: "برای هر منشی در کلینیک دکتر مرتضی کرباسی می‌توانید مجوزهای مختلفی تعریف کنید: ایجاد جلسه، دسترسی به تقویم، ارسال پیام، مدیریت مخاطبین و غیره. همچنین محدودیت تعداد درخواست در ساعت (۲۰ درخواست) قابل تنظیم است. تمام فعالیت‌های منشی لاگ می‌شود و قابل بررسی است."
    },

    // Data Analytics
    {
      id: "data-analytics",
      question: "بخش تحلیل داده‌ها چه اطلاعاتی ارائه می‌دهد؟",
      answer: "داشبورد تحلیل داده‌ها شامل آمار جلسات، تحلیل بهره‌وری، گزارش فعالیت‌های روزانه، تحلیل الگوهای رفتاری در رسانه‌های اجتماعی و نمودارهای عملکرد پروژه‌ها است. نمودارهای تعاملی با امکان فیلتر بر اساس بازه زمانی و نوع داده ارائه می‌شود."
    },
    {
      id: "performance-metrics",
      question: "معیارهای عملکرد چگونه محاسبه می‌شود؟",
      answer: "سیستم معیارهای مختلفی نظیر تعداد جلسات برگزار شده، میانگین مدت جلسات، نرخ تکمیل وظایف، زمان پاسخ به درخواست‌ها و میزان فعالیت در رسانه‌های اجتماعی را محاسبه می‌کند. این معیارها در نمودارهای مختلف نمایش داده شده و امکان مقایسه دوره‌ای وجود دارد."
    },

    // Integration & Settings
    {
      id: "social-media-hub",
      question: "Social Media Hub چگونه کار می‌کند؟",
      answer: "در بخش رسانه‌های اجتماعی می‌توانید اکانت‌های LinkedIn، X، Pinterest، Instagram و TikTok را متصل کنید. سیستم با تحلیل لایک‌ها، اشتراک‌گذاری‌ها و فعالیت‌هایتان، الگوی رفتاری شما را یاد می‌گیرد. این داده‌ها برای ارائه پیشنهادات محتوا، تشخیص علایق و بهینه‌سازی تعاملات حرفه‌ای استفاده می‌شود."
    },
    {
      id: "gadgets-integration",
      question: "چگونه گجت‌هایم را متصل کنم؟",
      answer: "از بخش گجت‌ها می‌توانید ساعت هوشمند، عینک هوشمند و دفترچه هوشمند خود را متصل کنید. سیستم Privacy-First Data Separation دارد، یعنی داده‌های هر گجت به‌طور مجزا ذخیره می‌شود. ساعت هوشمند برای سلامت، عینک برای جلسات و دفترچه برای یادداشت‌برداری استفاده می‌شود."
    },
    {
      id: "health-tracking",
      question: "ردیابی سلامت چگونه کار می‌کند؟",
      answer: "بخش سلامت داده‌های حیاتی نظیر ضربان قلب، فشار خون، قدم‌ها، کالری سوخته، خواب و وزن را ردیابی می‌کند. می‌توانید اهداف سلامتی تعیین کنید، پیشرفت را مشاهده نمایید و گزارش‌های دوره‌ای دریافت کنید. داده‌ها از ساعت هوشمند یا به صورت دستی وارد می‌شوند."
    },

    // AI & Automation
    {
      id: "ai-features",
      question: "ویژگی‌های هوش مصنوعی چه کارهایی انجام می‌دهد؟",
      answer: "AI سیستم شامل: تحلیل رفتاری در رسانه‌های اجتماعی، تشخیص محتوا و طبقه‌بندی علایق، خلاصه‌سازی خودکار جلسات و اسناد، پیشنهاد مکان و زمان بهینه برای جلسات، تولید Knowledge Graph، OCR برای تصاویر و تحلیل predictive برای بهبود بهره‌وری است."
    },
    {
      id: "knowledge-graph",
      question: "Knowledge Graph چیست و چگونه کار می‌کند؟",
      answer: "Knowledge Graph نمایش گرافیکی روابط بین اطلاعات، افراد، مفاهیم و اسناد شماست. سیستم به طور خودکار ارتباطات را تشخیص داده و گراف تعاملی ایجاد می‌کند. این امکان به شما کمک می‌کند الگوهای پنهان را کشف کنید، اطلاعات مرتبط را پیدا نمایید و بینش‌های جدیدی به دست آورید."
    },

    // Security & Privacy
    {
      id: "privacy",
      question: "حریم خصوصی من چگونه محافظت می‌شود؟",
      answer: "تمام داده‌های شما با رمزنگاری AES-256 محافظت می‌شوند. داده‌های گجت‌ها به‌صورت جدا ذخیره می‌شود. یادگیری رفتاری، ردیابی تحلیلی و اشتراک‌گذاری داده‌ها تنها با رضایت شما فعال می‌شود. شما کنترل کاملی بر قابلیت مشاهده پروفایل (خصوصی/سازمان/عمومی) دارید."
    },
    {
      id: "data-backup",
      question: "پشتیبان‌گیری از داده‌ها چگونه است؟",
      answer: "سیستم به طور خودکار از تمام داده‌هایتان پشتیبان تهیه می‌کند. پشتیبان‌ها در چندین مکان جغرافیایی ذخیره می‌شوند. می‌توانید در هر زمان کپی کاملی از داده‌هایتان دریافت کنید. همچنین امکان بازیابی داده‌ها از نسخه‌های قبلی وجود دارد."
    }
  ];

  const supportChannels = [
    {
      icon: Phone,
      title: "تماس تلفنی",
      description: "پشتیبانی ۲۴/۷",
      contact: "۰۵۱-۳۸۸۸۸۸۸۸",
      action: "تماس"
    },
    {
      icon: Mail,
      title: "ایمیل",
      description: "پاسخ در کمتر از ۲۴ ساعت",
      contact: "support@brainforge.ir",
      action: "ارسال ایمیل"
    },
    {
      icon: MessageCircle,
      title: "چت آنلاین",
      description: "پشتیبانی فوری",
      contact: "در ساعات اداری",
      action: "شروع چت"
    }
  ];

  const tutorials = [
    {
      icon: PlayCircle,
      title: "راهنمای شروع کار",
      description: "آموزش کامل نحوه استفاده از سیستم و تنظیمات اولیه",
      duration: "۱۵ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Book,
      title: "مدیریت تقویم و رویدادها",
      description: "آموزش کامل استفاده از تقویم، ایجاد رویداد و مدیریت خانواده",
      duration: "۱۲ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Users,
      title: "مدیریت پروژه و تیم",
      description: "ایجاد پروژه، واگذاری وظایف و همکاری تیمی",
      duration: "۱۸ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Lightbulb,
      title: "سیستم واگذاری وظایف",
      description: "آموزش واگذاری وظایف، اطلاع‌رسانی و پیگیری",
      duration: "۱۰ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Book,
      title: "مدیریت دانش و اسناد",
      description: "آپلود اسناد، OCR، جستجو و Knowledge Graph",
      duration: "۱۴ دقیقه",
      type: "ویدئو"
    },
    {
      icon: MessageCircle,
      title: "دفترچه شخصی",
      description: "ثبت یادداشت‌ها، ضمیمه فایل و سازماندهی محتوا",
      duration: "۸ دقیقه",
      type: "ویدئو"
    },
    {
      icon: MessageCircle,
      title: "دفتر شکرگذاری",
      description: "ثبت شکرگذاری روزانه و بهبود بهداشت روان",
      duration: "۶ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Lightbulb,
      title: "مدیریت ایده‌ها و SWOT",
      description: "ثبت ایده‌ها، تحلیل SWOT و مدیریت نقاط عطف",
      duration: "۱۲ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Users,
      title: "کار با رسانه‌های اجتماعی",
      description: "اتصال حساب‌ها، تحلیل رفتار و بهینه‌سازی محتوا",
      duration: "۱۰ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Book,
      title: "ماژول حقوقی",
      description: "مدیریت اسناد حقوقی، قراردادها و پیگیری‌ها",
      duration: "۹ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Users,
      title: "سیستم منشی",
      description: "مدیریت منشی‌ها، تنظیم مجوزها و پیگیری درخواست‌ها",
      duration: "۷ دقیقه",
      type: "ویدئو"
    },
    {
      icon: Download,
      title: "راهنمای کامل PDF",
      description: "راهنمای جامع تمام قابلیت‌ها و ترفندهای سیستم",
      duration: "۱۲۰ صفحه",
      type: "PDF"
    },
    {
      icon: Download,
      title: "چک‌لیست تنظیمات",
      description: "فهرست کاملی از تنظیمات ضروری برای شروع کار",
      duration: "۵ صفحه",
      type: "PDF"
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl text-right pr-8">
            <HelpCircle className="h-5 w-5" />
            مرکز راهنما و پشتیبانی
          </DialogTitle>
          <DialogDescription className="text-right pr-8">
            راهنماها، آموزش‌ها و روش‌های تماس با پشتیبانی
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              سوالات متداول
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2">
              <PlayCircle className="h-4 w-4" />
              آموزش‌ها
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              پشتیبانی
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Book className="h-4 w-4" />
              درباره
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <TabsContent value="faq" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    سوالات متداول
                  </CardTitle>
                  <CardDescription>
                    پاسخ سوالات رایج کاربران
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو در سوالات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredFAQ.map((item) => (
                      <Collapsible
                        key={item.id}
                        open={openFAQ === item.id}
                        onOpenChange={() => setOpenFAQ(openFAQ === item.id ? null : item.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-4 h-auto text-right"
                          >
                            <span className="font-medium">{item.question}</span>
                            {openFAQ === item.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            {item.answer}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>

                  {filteredFAQ.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>هیچ سوالی با جستجوی شما یافت نشد.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tutorials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    آموزش‌ها و راهنماها
                  </CardTitle>
                  <CardDescription>
                    ویدئوها و اسناد آموزشی
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {tutorials.map((tutorial, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <tutorial.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{tutorial.title}</h4>
                              <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">{tutorial.type}</Badge>
                                <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="gap-2"
                              disabled={isGeneratingPDF && tutorial.type === "PDF"}
                              onClick={async () => {
                                if (tutorial.type === "PDF") {
                                  if (tutorial.title === "چک‌لیست تنظیمات") {
                                    try {
                                      setIsGeneratingPDF(true);
                                      const pdfBytes = await PDFService.generateSettingsChecklist();
                                      await PDFService.downloadPDF(pdfBytes, 'settings-checklist.pdf');

                                      toast({
                                        title: "دانلود موفق",
                                        description: "فایل چک‌لیست تنظیمات با موفقیت دانلود شد",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "خطا در دانلود",
                                        description: "مشکلی در تولید فایل PDF پیش آمده است",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setIsGeneratingPDF(false);
                                    }
                                  } else {
                                    // Other PDF tutorials - placeholder
                                    const pdfContent = `راهنمای ${tutorial.title}`;
                                    const blob = new Blob([pdfContent], { type: 'application/pdf' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${tutorial.title}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);

                                    toast({
                                      title: "دانلود شروع شد",
                                      description: `فایل راهنمای ${tutorial.title} در حال دانلود است`,
                                    });
                                  }
                                } else {
                                  // Open tutorial video (placeholder functionality)
                                  window.open(`https://example.com/tutorials/${tutorial.title.replace(/\s+/g, '-')}`, '_blank');

                                  toast({
                                    title: "در حال باز کردن آموزش",
                                    description: `آموزش ${tutorial.title} در تب جدید باز می‌شود`,
                                  });
                                }
                              }}
                            >
                              {tutorial.type === "PDF" ? (
                                <>
                                  <Download className="h-4 w-4" />
                                  دانلود
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4" />
                                  تماشا
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    ارتباط با پشتیبانی
                  </CardTitle>
                  <CardDescription>
                    روش‌های مختلف تماس با تیم پشتیبانی
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {supportChannels.map((channel, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <channel.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{channel.title}</h4>
                              <p className="text-sm text-muted-foreground">{channel.description}</p>
                              <p className="text-sm font-medium mt-1">{channel.contact}</p>
                            </div>
                            <Button size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              {channel.action}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ارسال درخواست پشتیبانی</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">موضوع</Label>
                          <Input id="subject" placeholder="عنوان مشکل یا سوال" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">اولویت</Label>
                          <select className="w-full px-3 py-2 border rounded-md">
                            <option>کم</option>
                            <option>متوسط</option>
                            <option>زیاد</option>
                            <option>فوری</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">توضیحات</Label>
                        <textarea
                          id="message"
                          className="w-full px-3 py-2 border rounded-md h-24"
                          placeholder="لطفاً مشکل یا سوال خود را با جزئیات بیان کنید..."
                        />
                      </div>
                      <Button className="w-full">ارسال درخواست</Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    درباره Mora
                  </CardTitle>
                  <CardDescription>
                    اطلاعات سیستم و تیم توسعه
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 professional-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-2xl">BF</span>
                    </div>
                    <h3 className="text-xl font-bold">Mora</h3>
                    <p className="text-muted-foreground">نسخه ۱.۰.۰</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">درباره سیستم</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Mora یک سیستم مدیریت دانش پیشرفته است که برای مدیریت اطلاعات، جلسات، وظایف و ارتباطات حرفه‌ای طراحی شده است. این سیستم با استفاده از تکنولوژی‌های هوش مصنوعی و یادگیری ماشین، تجربه کاربری هوشمند و شخصی‌سازی شده ارائه می‌دهد.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">ویژگی‌های کلیدی</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• مدیریت هوشمند دانش و اسناد با OCR</li>
                        <li>• Knowledge Graph و روابط اطلاعات</li>
                        <li>• Social Media Hub با یادگیری رفتاری</li>
                        <li>• Privacy-First Gadgets Integration</li>
                        <li>• مدیریت جلسات با خلاصه‌سازی AI</li>
                        <li>• تنظیمات مکان و پیشنهادات هوشمند</li>
                        <li>• داشبورد Analytics و Quick Actions</li>
                        <li>• رمزنگاری AES-256 و کنترل حریم خصوصی</li>
                        <li>• پیشنهادات شخصی‌سازی شده</li>
                        <li>• مدیریت وظایف و یادآوری‌ها</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">تکنولوژی‌های استفاده شده</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• React 18 + TypeScript برای UI</li>
                        <li>• Tailwind CSS برای طراحی</li>
                        <li>• Supabase برای پایگاه داده و اعتماد</li>
                        <li>• Framer Motion برای انیمیشن‌ها</li>
                        <li>• Tesseract.js برای OCR</li>
                        <li>• D3.js برای نمودارها</li>
                        <li>• React Hook Form برای فرم‌ها</li>
                        <li>• Zustand برای مدیریت state</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">ماژول‌های سیستم</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>• داشبورد و آنالیتیکس</div>
                        <div>• تقویم (شخصی، حرفه‌ای، سازمانی)</div>
                        <div>• مدیریت پروژه و وظایف</div>
                        <div>• واگذاری وظایف</div>
                        <div>• دفترچه شخصی</div>
                        <div>• دفتر شکرگذاری</div>
                        <div>• مدیریت ایده‌ها</div>
                        <div>• مدیریت دانش و اسناد</div>
                        <div>• جلسات و ضبط</div>
                        <div>• ماژول حقوقی</div>
                        <div>• سیستم منشی</div>
                        <div>• رسانه‌های اجتماعی</div>
                        <div>• ردیابی سلامت</div>
                        <div>• گجت‌ها و IoT</div>
                        <div>• تحلیل ترندها</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">تیم توسعه</h4>
                      <p className="text-sm text-muted-foreground">
                        مرداد ۱۴۰۴ توسعه یافته برای دکتر کرباسی توسط دکتر نرگس طباطبایی
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>آخرین به‌روزرسانی: مرداد ۱۴۰۴</span>
                        <span>© ۱۴۰۴ دکتر نرگس طباطبایی</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;