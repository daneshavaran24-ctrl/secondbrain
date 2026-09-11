import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Mail, Send, Globe, Users, MessageSquare, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuickNetworkingEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailTypes = [
  { id: "introduction", label: "معرفی", description: "آشنایی اولیه" },
  { id: "meeting_request", label: "درخواست جلسه", description: "درخواست ملاقات" },
  { id: "followup", label: "پیگیری", description: "بعد از تعامل" },
  { id: "thank_you", label: "تشکر", description: "قدردانی" },
  { id: "collaboration", label: "همکاری", description: "پیشنهاد همکاری" },
  { id: "custom", label: "سفارشی", description: "با توضیحات شما" },
];

const languages = [
  { id: "persian", label: "فارسی", flag: "🇮🇷" },
  { id: "english", label: "English", flag: "🇬🇧" },
  { id: "arabic", label: "العربية", flag: "🇸🇦" },
  { id: "turkish", label: "Türkçe", flag: "🇹🇷" },
  { id: "german", label: "Deutsch", flag: "🇩🇪" },
  { id: "french", label: "Français", flag: "🇫🇷" },
];

const cultures = [
  { id: "iranian", label: "ایرانی" },
  { id: "american", label: "آمریکایی" },
  { id: "german", label: "آلمانی" },
  { id: "british", label: "بریتانیایی" },
  { id: "arabic", label: "عربی" },
  { id: "turkish", label: "ترکی" },
];

const tones = [
  { id: "formal", label: "رسمی" },
  { id: "semi_formal", label: "نیمه‌رسمی" },
  { id: "friendly", label: "صمیمی" },
  { id: "professional", label: "حرفه‌ای" },
];

export function QuickNetworkingEmail({ open, onOpenChange }: QuickNetworkingEmailProps) {
  const [step, setStep] = useState<"input" | "result">("input");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  
  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [recipientOrg, setRecipientOrg] = useState("");
  const [howMet, setHowMet] = useState("");
  const [goal, setGoal] = useState("");
  
  const [selectedType, setSelectedType] = useState("introduction");
  const [selectedLanguage, setSelectedLanguage] = useState("persian");
  const [selectedCulture, setSelectedCulture] = useState("iranian");
  const [selectedTone, setSelectedTone] = useState("semi_formal");
  const [customDescription, setCustomDescription] = useState("");
  
  // Sender info
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderTitle, setSenderTitle] = useState("");
  const [senderCompany, setSenderCompany] = useState("");

  const handleGenerate = async () => {
    if (!recipientName) {
      toast.error("لطفاً نام مخاطب را وارد کنید");
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-networking-email", {
        body: {
          contact: {
            name: recipientName,
            title: recipientTitle,
            organization_name: recipientOrg,
            networking_goal: goal,
            how_met: howMet,
          },
          emailType: selectedType,
          language: selectedLanguage,
          culture: selectedCulture,
          tone: selectedTone,
          senderInfo: senderName ? {
            name: senderName,
            email: senderEmail,
            title: senderTitle,
            company: senderCompany,
          } : undefined,
          customDescription: selectedType === "custom" ? customDescription : undefined,
        },
      });

      if (error) throw error;

      setGeneratedEmail(data);
      setStep("result");
      toast.success("ایمیل با موفقیت تولید شد");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("خطا در تولید ایمیل");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;
    const fullEmail = `موضوع: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    await navigator.clipboard.writeText(fullEmail);
    toast.success("ایمیل کپی شد");
  };

  const handleOpenInMailClient = () => {
    if (!generatedEmail || !recipientEmail) {
      toast.error("ایمیل مخاطب وارد نشده است");
      return;
    }
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(generatedEmail.subject)}&body=${encodeURIComponent(generatedEmail.body)}`;
    window.open(mailtoUrl, "_blank");
  };

  const handleReset = () => {
    setStep("input");
    setGeneratedEmail(null);
  };

  const isRtl = ["persian", "arabic"].includes(selectedLanguage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            تولید سریع ایمیل نتورکینگ
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {step === "input" ? (
            <Tabs defaultValue="recipient" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recipient">مخاطب</TabsTrigger>
                <TabsTrigger value="settings">تنظیمات</TabsTrigger>
                <TabsTrigger value="sender">فرستنده</TabsTrigger>
              </TabsList>

              <TabsContent value="recipient" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="recipientName">نام مخاطب *</Label>
                    <Input
                      id="recipientName"
                      placeholder="نام کامل مخاطب"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="recipientEmail">ایمیل مخاطب</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="recipientTitle">عنوان شغلی</Label>
                    <Input
                      id="recipientTitle"
                      placeholder="مدیرعامل، مدیر فروش..."
                      value={recipientTitle}
                      onChange={(e) => setRecipientTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="recipientOrg">سازمان</Label>
                    <Input
                      id="recipientOrg"
                      placeholder="نام شرکت یا سازمان"
                      value={recipientOrg}
                      onChange={(e) => setRecipientOrg(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="howMet">نحوه آشنایی</Label>
                    <Input
                      id="howMet"
                      placeholder="لینکدین، کنفرانس، معرفی..."
                      value={howMet}
                      onChange={(e) => setHowMet(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="goal">هدف ارتباط</Label>
                    <Input
                      id="goal"
                      placeholder="همکاری، مشاوره، فروش..."
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>نوع ایمیل</Label>
                    <div className="flex flex-wrap gap-2">
                      {emailTypes.map((type) => (
                        <Badge
                          key={type.id}
                          variant={selectedType === type.id ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1.5"
                          onClick={() => setSelectedType(type.id)}
                        >
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedType === "custom" && (
                    <div className="space-y-1">
                      <Label htmlFor="customDesc">توضیحات سفارشی</Label>
                      <Textarea
                        id="customDesc"
                        placeholder="توضیح دهید چه نوع ایمیلی می‌خواهید..."
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>زبان</Label>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <Badge
                          key={lang.id}
                          variant={selectedLanguage === lang.id ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1.5"
                          onClick={() => setSelectedLanguage(lang.id)}
                        >
                          {lang.flag} {lang.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>فرهنگ</Label>
                    <div className="flex flex-wrap gap-2">
                      {cultures.map((c) => (
                        <Badge
                          key={c.id}
                          variant={selectedCulture === c.id ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1.5"
                          onClick={() => setSelectedCulture(c.id)}
                        >
                          {c.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>لحن</Label>
                    <div className="flex flex-wrap gap-2">
                      {tones.map((t) => (
                        <Badge
                          key={t.id}
                          variant={selectedTone === t.id ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1.5"
                          onClick={() => setSelectedTone(t.id)}
                        >
                          {t.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sender" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="senderName">نام شما</Label>
                    <Input
                      id="senderName"
                      placeholder="نام کامل"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="senderEmail">ایمیل شما</Label>
                    <Input
                      id="senderEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="senderTitle">عنوان شغلی</Label>
                    <Input
                      id="senderTitle"
                      placeholder="مدیر فروش"
                      value={senderTitle}
                      onChange={(e) => setSenderTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="senderCompany">شرکت</Label>
                    <Input
                      id="senderCompany"
                      placeholder="نام شرکت"
                      value={senderCompany}
                      onChange={(e) => setSenderCompany(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  این اطلاعات در امضای ایمیل استفاده می‌شود
                </p>
              </TabsContent>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !recipientName}
                className="w-full mt-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <Sparkles className="ml-2 h-4 w-4" />
                    تولید ایمیل با AI
                  </>
                )}
              </Button>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>موضوع</Label>
                <div className="p-3 bg-muted/50 rounded-lg" dir={isRtl ? "rtl" : "ltr"}>
                  {generatedEmail?.subject}
                </div>
              </div>

              <div className="space-y-2">
                <Label>متن ایمیل</Label>
                <div 
                  className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto"
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  {generatedEmail?.body}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCopy} variant="outline">
                  <Copy className="ml-2 h-4 w-4" />
                  کپی
                </Button>
                <Button onClick={handleOpenInMailClient} variant="outline" disabled={!recipientEmail}>
                  <Send className="ml-2 h-4 w-4" />
                  باز کردن در ایمیل
                </Button>
                <Button onClick={handleReset} variant="ghost">
                  ایمیل جدید
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
