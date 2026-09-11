import { useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { ResponsiveContainer, ResponsiveSection } from "@/components/ui/responsive-container";
import { ResponsiveLayout, ResponsiveStack } from "@/components/ui/responsive-layout";
import { ResponsiveHeading, ResponsiveText } from "@/components/ui/responsive-typography";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Watch,
  Glasses,
  BookOpen,
  Smartphone,
  Circle,
  Mic,
  Usb,
  Bluetooth,
  BatteryMedium,
  Wifi,
  Settings,
  Shield,
  Activity,
  Heart,
  Brain,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";

const gadgets = [
  {
    id: "smartwatch",
    name: "ساعت هوشمند",
    icon: Watch,
    model: "Apple Watch Series 9",
    connected: true,
    battery: 78,
    lastSync: "1 دقیقه پیش",
    status: "active",
    capabilities: ["heart_rate", "activity", "sleep"],
    activeSettings: {
      health: true,
      meetings: false,
      tasks: true,
      notifications: true
    }
  },
  {
    id: "smartglasses",
    name: "عینک هوشمند",
    icon: Glasses,
    model: "Google Glass Enterprise",
    connected: false,
    battery: 0,
    lastSync: "3 ساعت پیش",
    status: "disconnected",
    capabilities: ["camera", "display", "voice"],
    activeSettings: {
      meetings: true,
      knowledge: false,
      tasks: false,
      notifications: false
    }
  },
  {
    id: "smartnotebook",
    name: "دفترچه هوشمند",
    icon: BookOpen,
    model: "Rocketbook Core",
    connected: true,
    battery: 85,
    lastSync: "30 دقیقه پیش",
    status: "active",
    capabilities: ["handwriting", "scan", "sync"],
    activeSettings: {
      knowledge: true,
      tasks: true,
      meetings: true,
      notes: true
    }
  },
  {
    id: "oura_ring",
    name: "انگشتر هوشمند Oura",
    icon: Circle,
    model: "Oura Ring Gen 3",
    connected: false,
    battery: 0,
    lastSync: "هرگز",
    status: "disconnected",
    capabilities: ["sleep", "heart_rate", "hrv", "temperature", "activity", "readiness"],
    activeSettings: {
      health: true,
      meetings: false,
      tasks: false,
      notifications: false
    }
  },
  {
    id: "plaud_ai",
    name: "Plaud AI",
    icon: Mic,
    model: "Plaud Note",
    connected: false,
    battery: 85,
    lastSync: "هرگز",
    status: "disconnected",
    capabilities: ["audio_recording", "speech_to_text", "summary", "minutes", "action_items"],
    activeSettings: {
      meetings: true,
      tasks: true,
      knowledge: true,
      notes: true,
      notifications: false
    }
  },
  {
    id: "hi_dock_h1",
    name: "Hi Dock H1",
    icon: Usb,
    model: "Hi Dock H1",
    connected: false,
    battery: 100,
    lastSync: "هرگز",
    status: "disconnected",
    capabilities: ["audio_recording", "usb_hub", "charging", "speech_to_text", "summary"],
    activeSettings: {
      meetings: true,
      tasks: true,
      knowledge: true,
      notes: true,
      notifications: false
    }
  }
];

const integrationSections = [
  { id: "health", name: "سلامت", icon: Heart, color: "text-medical-green" },
  { id: "meetings", name: "جلسات", icon: Calendar, color: "text-medical-purple" },
  { id: "tasks", name: "وظایف", icon: FileText, color: "text-medical-amber" },
  { id: "knowledge", name: "دانش", icon: Brain, color: "text-medical-blue" },
  { id: "notes", name: "یادداشت‌ها", icon: BookOpen, color: "text-accent" },
  { id: "notifications", name: "اعلانات", icon: Smartphone, color: "text-foreground" }
];

const privacyData = [
  { compartment: "Health Data", isolation: 95, encrypted: true },
  { compartment: "Vision Data", isolation: 88, encrypted: true },
  { compartment: "Notes Data", isolation: 92, encrypted: true },
  { compartment: "Activity Data", isolation: 90, encrypted: true },
  { compartment: "Oura Ring Data", isolation: 96, encrypted: true },
  { compartment: "Plaud AI Data", isolation: 97, encrypted: true },
  { compartment: "Hi Dock H1 Data", isolation: 96, encrypted: true }
];

const GadgetsPage = () => {
  const [gadgetSettings, setGadgetSettings] = useState(
    gadgets.reduce((acc, gadget) => ({
      ...acc,
      [gadget.id]: gadget.activeSettings
    }), {})
  );

  const toggleSetting = (gadgetId: string, section: string) => {
    setGadgetSettings(prev => ({
      ...prev,
      [gadgetId]: {
        ...prev[gadgetId],
        [section]: !prev[gadgetId][section]
      }
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-medical-green" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'syncing': return <Activity className="h-4 w-4 text-medical-amber animate-pulse" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'disconnected': return 'قطع شده';
      case 'syncing': return 'در حال همگام‌سازی';
      default: return 'نامشخص';
    }
  };

  return (
    <ResponsiveContainer variant="page" className="bg-gradient-subtle">
      <ResponsiveSection spacing="lg">
        <SectionHeader
          title="مدیریت گجت‌ها"
          subtitle="ادغام و تنظیم دستگاه‌های هوشمند"
          icon={<Watch className="h-6 w-6" />}
          action={
            <div className="flex items-center gap-3">
              <ModernButton variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </ModernButton>
              <ModernButton variant="outline" size="icon">
                <Shield className="h-4 w-4" />
              </ModernButton>
            </div>
          }
          gradient
        />

        <ResponsiveLayout 
          cols={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="md"
        >
          {gadgets.map((gadget) => (
            <ResponsiveCard 
              key={gadget.id}
              title={gadget.name}
              icon={<gadget.icon className="h-5 w-5" />}
              hover
              glow
            >
              <ResponsiveStack spacing="md">
                <ResponsiveText size="sm" variant="muted">{gadget.model}</ResponsiveText>
                
                <div className="flex items-center justify-between">
                  <ResponsiveText size="sm">وضعیت:</ResponsiveText>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(gadget.status)}
                    <Badge variant={gadget.connected ? "default" : "destructive"}>
                      {getStatusText(gadget.status)}
                    </Badge>
                  </div>
                </div>

                {gadget.connected && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1">
                        <BatteryMedium className="h-3 w-3" />
                        باتری
                      </span>
                      <span className="text-sm font-medium">{gadget.battery}%</span>
                    </div>
                    <Progress value={gadget.battery} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <ResponsiveText size="sm">آخرین همگام‌سازی:</ResponsiveText>
                  <ResponsiveText size="sm" variant="muted">{gadget.lastSync}</ResponsiveText>
                </div>

                <div className="space-y-2">
                  <ResponsiveText size="sm" className="font-medium">قابلیت‌ها:</ResponsiveText>
                  <div className="flex flex-wrap gap-1">
                    {gadget.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ResponsiveStack>
            </ResponsiveCard>
          ))}
        </ResponsiveLayout>

        <ResponsiveCard
          title="تنظیمات ادغام"
          icon={<Zap className="h-5 w-5" />}
          hover
          glow
        >
          <ResponsiveText size="sm" variant="muted" className="mb-6">
            تعیین کنید هر گجت در کدام بخش‌های اپلیکیشن استفاده شود
          </ResponsiveText>
          <div className="space-y-6">
            {gadgets.map((gadget) => (
              <div key={gadget.id} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <gadget.icon className="h-4 w-4" />
                  <ResponsiveText className="font-medium">{gadget.name}</ResponsiveText>
                  <Badge variant={gadget.connected ? "default" : "secondary"}>
                    {gadget.connected ? "متصل" : "قطع"}
                  </Badge>
                </div>
                <ResponsiveLayout 
                  cols={{ mobile: 1, tablet: 2, desktop: 3 }}
                  gap="sm"
                >
                  {integrationSections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-lux">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <section.icon className={`h-4 w-4 ${section.color} flex-shrink-0`} />
                        <ResponsiveText size="sm" className="truncate">{section.name}</ResponsiveText>
                      </div>
                      <Switch
                        checked={gadgetSettings[gadget.id]?.[section.id] || false}
                        onCheckedChange={() => toggleSetting(gadget.id, section.id)}
                        disabled={!gadget.connected}
                      />
                    </div>
                  ))}
                </ResponsiveLayout>
              </div>
            ))}
          </div>
        </ResponsiveCard>

        <ResponsiveCard
          title="حفظ حریم خصوصی و جدا‌سازی داده‌ها"
          icon={<Shield className="h-5 w-5" />}
          hover
          glow
        >
          <ResponsiveText size="sm" variant="muted" className="mb-4">
            داده‌های هر گجت در بخش‌های جداگانه ذخیره و رمزگذاری می‌شوند
          </ResponsiveText>
          <ResponsiveLayout 
            cols={{ mobile: 1, tablet: 2, desktop: 2 }}
            gap="sm"
          >
            {privacyData.map((data, index) => (
              <div key={index} className="p-3 md:p-4 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <ResponsiveText className="font-medium">{data.compartment}</ResponsiveText>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-lux-emerald" />
                    <ResponsiveText size="xs" className="text-lux-emerald">رمزگذاری شده</ResponsiveText>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <ResponsiveText size="sm">سطح ایزولاسیون:</ResponsiveText>
                    <ResponsiveText size="sm" className="font-medium">{data.isolation}%</ResponsiveText>
                  </div>
                  <Progress value={data.isolation} className="h-2" />
                </div>
              </div>
            ))}
          </ResponsiveLayout>
        </ResponsiveCard>

        <ResponsiveCard className="border-lux-sapphire bg-lux-sapphire/10" hover={false}>
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-lux-sapphire mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <ResponsiveHeading level={3} weight="medium" className="text-lux-midnight mb-2">
                خلاصه جریان داده
              </ResponsiveHeading>
              <ResponsiveText size="sm" variant="muted" className="mb-2">
                داده‌های ساعت هوشمند → بخش سلامت | داده‌های عینک → جلسات و دانش | 
                داده‌های دفترچه → یادداشت‌ها و وظایف
              </ResponsiveText>
              <ResponsiveText size="xs" className="text-lux-sapphire">
                تمام انتقالات داده با پروتکل‌های امنیتی محافظت می‌شوند
              </ResponsiveText>
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default GadgetsPage;