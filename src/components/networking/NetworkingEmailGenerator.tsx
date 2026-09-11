import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Mail, RefreshCw, Send, Globe, Users, MessageSquare } from "lucide-react";
import { NetworkingContact } from "@/services/networkingService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NetworkingEmailGeneratorProps {
  contact: NetworkingContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailTypes = [
  { id: "introduction", label: "معرفی", description: "آشنایی اولیه" },
  { id: "meeting_request", label: "درخواست جلسه", description: "درخواست ملاقات" },
  { id: "followup", label: "پیگیری", description: "بعد از تعامل" },
  { id: "thank_you", label: "تشکر", description: "قدردانی" },
  { id: "collaboration", label: "همکاری", description: "پیشنهاد همکاری" },
  { id: "product_intro", label: "معرفی محصول", description: "معرفی محصول/خدمات" },
  { id: "event_invitation", label: "دعوت رویداد", description: "دعوت به رویداد" },
  { id: "congratulation", label: "تبریک", description: "تبریک موفقیت" },
  { id: "reminder", label: "یادآوری", description: "یادآوری موضوع" },
  { id: "custom", label: "سفارشی", description: "با توضیحات شما" },
];

const languages = [
  { id: "persian", label: "فارسی", flag: "🇮🇷" },
  { id: "english", label: "English", flag: "🇬🇧" },
  { id: "arabic", label: "العربية", flag: "🇸🇦" },
  { id: "turkish", label: "Türkçe", flag: "🇹🇷" },
  { id: "german", label: "Deutsch", flag: "🇩🇪" },
  { id: "french", label: "Français", flag: "🇫🇷" },
  { id: "spanish", label: "Español", flag: "🇪🇸" },
  { id: "russian", label: "Русский", flag: "🇷🇺" },
  { id: "chinese", label: "中文", flag: "🇨🇳" },
  { id: "japanese", label: "日本語", flag: "🇯🇵" },
];

const cultures = [
  { id: "iranian", label: "ایرانی", description: "تعارفات و احترامات فارسی" },
  { id: "arabic", label: "عربی", description: "آداب عربی با دعا و احترام" },
  { id: "turkish", label: "ترکی", description: "سایگی و احترام ترکی" },
  { id: "german", label: "آلمانی", description: "مستقیم و دقیق" },
  { id: "american", label: "آمریکایی", description: "صمیمی و عمل‌گرا" },
  { id: "british", label: "بریتانیایی", description: "مؤدبانه و رسمی" },
  { id: "japanese", label: "ژاپنی", description: "Keigo و احترام شدید" },
  { id: "chinese", label: "چینی", description: "سلسله‌مراتب و میانه‌روی" },
];

const tones = [
  { id: "formal", label: "رسمی", description: "بسیار رسمی و محترمانه" },
  { id: "semi_formal", label: "نیمه‌رسمی", description: "حرفه‌ای اما گرم" },
  { id: "friendly", label: "صمیمی", description: "دوستانه و صمیمی" },
  { id: "professional", label: "حرفه‌ای", description: "کاری و حرفه‌ای" },
];

interface SenderInfo {
  name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
}

export function NetworkingEmailGenerator({ contact, open, onOpenChange }: NetworkingEmailGeneratorProps) {
  const [selectedType, setSelectedType] = useState<string>("introduction");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("persian");
  const [selectedCulture, setSelectedCulture] = useState<string>("iranian");
  const [selectedTone, setSelectedTone] = useState<string>("semi_formal");
  const [customDescription, setCustomDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [activeTab, setActiveTab] = useState("type");
  
  // Sender info
  const [senderInfo, setSenderInfo] = useState<SenderInfo>({
    name: "",
    email: "",
    phone: "",
    title: "",
    company: "",
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-networking-email", {
        body: {
          contact: {
            name: contact.name,
            title: contact.title,
            organization_name: contact.organization_name,
            category: contact.category,
            networking_goal: contact.networking_goal,
            notes: contact.notes,
            how_met: contact.how_met,
          },
          emailType: selectedType,
          language: selectedLanguage,
          culture: selectedCulture,
          tone: selectedTone,
          senderInfo: senderInfo.name ? senderInfo : undefined,
          customDescription: selectedType === "custom" ? customDescription : undefined,
        },
      });

      if (error) throw error;

      setGeneratedEmail(data);
      setEditedSubject(data.subject);
      setEditedBody(data.body);
      toast.success("ایمیل با موفقیت تولید شد");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("خطا در تولید ایمیل");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const fullEmail = `موضوع: ${editedSubject}\n\n${editedBody}`;
    await navigator.clipboard.writeText(fullEmail);
    toast.success("ایمیل کپی شد");
  };

  const handleOpenInMailClient = () => {
    if (!contact.email) {
      toast.error("ایمیل مخاطب ثبت نشده است");
      return;
    }
    const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
    window.open(mailtoUrl, "_blank");
  };

  const handleReset = () => {
    setGeneratedEmail(null);
    setEditedSubject("");
    setEditedBody("");
    setCustomDescription("");
    setActiveTab("type");
  };

  const isRtl = ["persian", "arabic"].includes(selectedLanguage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            تولید ایمیل حرفه‌ای برای {contact.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {!generatedEmail ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="type" className="text-xs sm:text-sm">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    نوع
                  </TabsTrigger>
                  <TabsTrigger value="language" className="text-xs sm:text-sm">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    زبان
                  </TabsTrigger>
                  <TabsTrigger value="culture" className="text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    فرهنگ
                  </TabsTrigger>
                  <TabsTrigger value="sender" className="text-xs sm:text-sm">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    فرستنده
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="type" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>نوع ایمیل</Label>
                    <div className="flex flex-wrap gap-2">
                      {emailTypes.map((type) => (
                        <Badge
                          key={type.id}
                          variant={selectedType === type.id ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 text-sm"
                          onClick={() => setSelectedType(type.id)}
                        >
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {emailTypes.find((t) => t.id === selectedType)?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>لحن ایمیل</Label>
                    <div className="flex flex-wrap gap-2">
                      {tones.map((tone) => (
                        <Badge
                          key={tone.id}
                          variant={selectedTone === tone.id ? "default" : "outline"}
                          className="cursor-pointer px-3 py-2 text-sm"
                          onClick={() => setSelectedTone(tone.id)}
                        >
                          {tone.label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tones.find((t) => t.id === selectedTone)?.description}
                    </p>
                  </div>

                  {selectedType === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="customDesc">توضیحات سفارشی</Label>
                      <Textarea
                        id="customDesc"
                        placeholder="توضیح دهید چه نوع ایمیلی می‌خواهید..."
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="language" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>زبان ایمیل</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setSelectedLanguage(lang.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                            selectedLanguage === lang.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="culture" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>فرهنگ مقصد</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cultures.map((culture) => (
                        <button
                          key={culture.id}
                          onClick={() => setSelectedCulture(culture.id)}
                          className={`flex flex-col items-start p-3 rounded-lg border text-sm transition-colors ${
                            selectedCulture === culture.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <span className="font-medium">{culture.label}</span>
                          <span className="text-xs text-muted-foreground">{culture.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sender" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label>اطلاعات فرستنده (برای امضا)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="senderName" className="text-xs">نام کامل</Label>
                        <Input
                          id="senderName"
                          placeholder="نام شما"
                          value={senderInfo.name}
                          onChange={(e) => setSenderInfo({ ...senderInfo, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="senderEmail" className="text-xs">ایمیل</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          placeholder="email@example.com"
                          value={senderInfo.email}
                          onChange={(e) => setSenderInfo({ ...senderInfo, email: e.target.value })}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="senderPhone" className="text-xs">شماره تماس</Label>
                        <Input
                          id="senderPhone"
                          placeholder="+98 912 123 4567"
                          value={senderInfo.phone}
                          onChange={(e) => setSenderInfo({ ...senderInfo, phone: e.target.value })}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="senderTitle" className="text-xs">عنوان شغلی</Label>
                        <Input
                          id="senderTitle"
                          placeholder="مدیر فروش"
                          value={senderInfo.title}
                          onChange={(e) => setSenderInfo({ ...senderInfo, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="senderCompany" className="text-xs">شرکت/سازمان</Label>
                        <Input
                          id="senderCompany"
                          placeholder="نام شرکت شما"
                          value={senderInfo.company}
                          onChange={(e) => setSenderInfo({ ...senderInfo, company: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1 mt-4">
                  <p className="font-medium">اطلاعات مخاطب:</p>
                  <p>نام: {contact.name}</p>
                  {contact.title && <p>عنوان: {contact.title}</p>}
                  {contact.organization_name && <p>سازمان: {contact.organization_name}</p>}
                  {contact.networking_goal && <p>هدف: {contact.networking_goal}</p>}
                  {contact.how_met && <p>نحوه آشنایی: {contact.how_met}</p>}
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (selectedType === "custom" && !customDescription)}
                  className="w-full mt-4"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <Mail className="ml-2 h-4 w-4" />
                      تولید ایمیل با AI
                    </>
                  )}
                </Button>
              </Tabs>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">موضوع</Label>
                  <Input
                    id="subject"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">متن ایمیل</Label>
                  <Textarea
                    id="body"
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={14}
                    dir={isRtl ? "rtl" : "ltr"}
                    className="font-normal leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCopy} variant="outline">
                    <Copy className="ml-2 h-4 w-4" />
                    کپی
                  </Button>
                  <Button onClick={handleOpenInMailClient} variant="outline" disabled={!contact.email}>
                    <Send className="ml-2 h-4 w-4" />
                    باز کردن در ایمیل
                  </Button>
                  <Button onClick={handleGenerate} variant="outline" disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="ml-2 h-4 w-4" />
                    )}
                    تولید مجدد
                  </Button>
                  <Button onClick={handleReset} variant="ghost">
                    شروع مجدد
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
