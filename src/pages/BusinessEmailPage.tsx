import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, 
  Mail, 
  Building2, 
  Users, 
  Target,
  Globe,
  Languages,
  Sparkles,
  Copy,
  RefreshCw,
  Send,
  FileText,
  Loader2,
  Check,
  Zap
} from "lucide-react";

// Types
interface EmailOutput {
  subject: string;
  body: string;
  translations: Record<string, { subject: string; body: string }>;
}

interface SenderInfo {
  name: string;
  email: string;
  phone: string;
  title: string;
  company: string;
}

// Constants
const EMAIL_PURPOSES = [
  { value: "company_introduction", label: "معرفی شرکت", icon: "🏢" },
  { value: "collaboration_request", label: "درخواست همکاری", icon: "🤝" },
  { value: "quotation", label: "پیشنهاد قیمت", icon: "💰" },
  { value: "follow_up", label: "پیگیری", icon: "🔄" },
  { value: "export_email", label: "ایمیل صادراتی", icon: "🌍" },
  { value: "official_organizational", label: "ایمیل رسمی سازمانی", icon: "📋" },
  { value: "custom", label: "سایر (سفارشی)", icon: "✏️" },
];

const INDUSTRIES = [
  { value: "technology_IT", label: "فناوری / IT", icon: "💻" },
  { value: "industrial_equipment", label: "تجهیزات صنعتی", icon: "🏭" },
  { value: "medical_equipment", label: "تجهیزات پزشکی", icon: "🏥" },
  { value: "education_EdTech", label: "آموزش / EdTech", icon: "📚" },
  { value: "municipality_government", label: "شهرداری / سازمان دولتی", icon: "🏛️" },
  { value: "export", label: "صادرات", icon: "📦" },
  { value: "other", label: "سایر", icon: "📁" },
];

const RECIPIENT_TYPES = [
  { value: "purchasing_manager", label: "مدیر خرید", icon: "🛒" },
  { value: "CEO", label: "مدیرعامل", icon: "👔" },
  { value: "supply_officer", label: "مسئول تأمین", icon: "📊" },
  { value: "government_organization", label: "سازمان دولتی", icon: "🏛️" },
  { value: "foreign_company", label: "شرکت خارجی", icon: "🌐" },
  { value: "individual", label: "شخص حقیقی", icon: "👤" },
];

const LANGUAGES = [
  { value: "persian", label: "فارسی", flag: "🇮🇷" },
  { value: "english", label: "English", flag: "🇬🇧" },
  { value: "arabic", label: "العربية", flag: "🇸🇦" },
  { value: "turkish", label: "Türkçe", flag: "🇹🇷" },
  { value: "german", label: "Deutsch", flag: "🇩🇪" },
  { value: "french", label: "Français", flag: "🇫🇷" },
  { value: "russian", label: "Русский", flag: "🇷🇺" },
  { value: "chinese", label: "中文", flag: "🇨🇳" },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const outputVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.3 },
  },
};

export default function BusinessEmailPage() {
  const navigate = useNavigate();
  
  // Form state
  const [purpose, setPurpose] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [recipientType, setRecipientType] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientOrg, setRecipientOrg] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("persian");
  const [translateTo, setTranslateTo] = useState<string[]>([]);
  
  // Sender info
  const [senderInfo, setSenderInfo] = useState<SenderInfo>({
    name: "",
    email: "",
    phone: "",
    title: "",
    company: "",
  });
  
  // Output state
  const [output, setOutput] = useState<EmailOutput | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingPart, setRegeneratingPart] = useState<string | null>(null);
  const [activeTranslationTab, setActiveTranslationTab] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Toggle translation language
  const toggleTranslation = (lang: string) => {
    if (lang === primaryLanguage) return;
    setTranslateTo(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  // Generate email
  const generateEmail = async (regenerateOnly?: 'subject' | 'body' | 'translation') => {
    if (!purpose || !industry || !recipientType || !keyPoints.trim()) {
      toast.error("لطفاً تمام فیلدهای اجباری را پر کنید");
      return;
    }

    if (regenerateOnly) {
      setRegeneratingPart(regenerateOnly);
    } else {
      setIsGenerating(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-business-email', {
        body: {
          purpose,
          industry: industry === 'other' ? customIndustry : industry,
          recipientType,
          recipientName: recipientName || undefined,
          recipientOrg: recipientOrg || undefined,
          keyPoints,
          primaryLanguage,
          translateTo,
          senderInfo: senderInfo.name ? senderInfo : undefined,
          regenerateOnly,
          currentSubject: regenerateOnly ? editedSubject : undefined,
          currentBody: regenerateOnly ? editedBody : undefined,
        }
      });

      if (error) throw error;

      if (regenerateOnly === 'subject') {
        setEditedSubject(data.subject);
      } else if (regenerateOnly === 'body') {
        setEditedBody(data.body);
      } else if (regenerateOnly === 'translation') {
        setOutput(prev => prev ? { ...prev, translations: data.translations } : null);
      } else {
        setOutput(data);
        setEditedSubject(data.subject);
        setEditedBody(data.body);
        if (translateTo.length > 0) {
          setActiveTranslationTab(translateTo[0]);
        }
      }

      toast.success(regenerateOnly ? "بخش مورد نظر به‌روزرسانی شد" : "ایمیل با موفقیت تولید شد");
    } catch (error: any) {
      console.error('Error generating email:', error);
      if (error.message?.includes('402')) {
        toast.error("اعتبار کافی نیست. لطفاً اعتبار خود را شارژ کنید.");
      } else if (error.message?.includes('429')) {
        toast.error("درخواست‌های زیادی ارسال شده. لطفاً کمی صبر کنید.");
      } else {
        toast.error("خطا در تولید ایمیل. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      setIsGenerating(false);
      setRegeneratingPart(null);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("کپی شد");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open mailto
  const openMailto = () => {
    const subject = encodeURIComponent(editedSubject);
    const body = encodeURIComponent(editedBody);
    const mailto = `mailto:${recipientName ? '' : ''}?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-10 glass-header"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="glass-button rounded-xl hover:glow-primary"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 glow-soft"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Mail className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                    ایمیل‌ساز هوشمند تجاری
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    تولید ایمیل حرفه‌ای با هوش مصنوعی پیشرفته
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Split View */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Form Section */}
          <motion.div 
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Email Purpose */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card rounded-2xl border-0 hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    هدف ایمیل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger className="glass-input rounded-xl border-0">
                      <SelectValue placeholder="انتخاب کنید..." />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-xl border-0">
                      {EMAIL_PURPOSES.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            {/* Industry */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card rounded-2xl border-0 hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/10">
                      <Building2 className="h-4 w-4 text-accent" />
                    </div>
                    صنعت / حوزه تخصصی
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="glass-input rounded-xl border-0">
                      <SelectValue placeholder="انتخاب کنید..." />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-xl border-0">
                      {INDUSTRIES.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AnimatePresence>
                    {industry === 'other' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Input 
                          placeholder="نام صنعت یا حوزه را بنویسید..."
                          value={customIndustry}
                          onChange={(e) => setCustomIndustry(e.target.value)}
                          className="glass-input rounded-xl border-0"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recipient */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card rounded-2xl border-0 hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    مخاطب ایمیل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger className="glass-input rounded-xl border-0">
                      <SelectValue placeholder="نوع مخاطب..." />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-xl border-0">
                      {RECIPIENT_TYPES.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="نام مخاطب (اختیاری)"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="glass-input rounded-xl border-0"
                    />
                    <Input 
                      placeholder="نام سازمان (اختیاری)"
                      value={recipientOrg}
                      onChange={(e) => setRecipientOrg(e.target.value)}
                      className="glass-input rounded-xl border-0"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Key Points - Most Important! */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card rounded-2xl border-0 hover-glow gradient-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    📝 نکات کلیدی ایمیل
                    <Badge className="text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-0">
                      مهم
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder={`مواردی که حتماً باید در ایمیل گفته شود:

– معرفی کوتاه شرکت
– تأکید بر کیفیت و سابقه
– درخواست جلسه آنلاین
– لحن رسمی و محترمانه
– اشاره به محصول جدید`}
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    className="min-h-[150px] resize-none glass-input rounded-xl border-0"
                  />
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    AI تمام این نکات را در متن نهایی لحاظ می‌کند
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Language Settings */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card rounded-2xl border-0 hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/10">
                      <Globe className="h-4 w-4 text-accent" />
                    </div>
                    تنظیمات زبان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">زبان اصلی ایمیل</Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(lang => (
                        <motion.div key={lang.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={primaryLanguage === lang.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setPrimaryLanguage(lang.value);
                              setTranslateTo(prev => prev.filter(l => l !== lang.value));
                            }}
                            className={`gap-1 rounded-xl ${primaryLanguage === lang.value ? 'glow-primary' : 'glass-button border-0'}`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      ترجمه همزمان به
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.filter(l => l.value !== primaryLanguage).map(lang => (
                        <motion.div key={lang.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={translateTo.includes(lang.value) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => toggleTranslation(lang.value)}
                            className={`gap-1 rounded-xl ${translateTo.includes(lang.value) ? '' : 'glass-button border-0'}`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                            {translateTo.includes(lang.value) && <Check className="h-3 w-3" />}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sender Info */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card rounded-2xl border-0 hover-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    اطلاعات فرستنده (برای امضا)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="نام شما"
                      value={senderInfo.name}
                      onChange={(e) => setSenderInfo({...senderInfo, name: e.target.value})}
                      className="glass-input rounded-xl border-0"
                    />
                    <Input 
                      placeholder="ایمیل شما"
                      value={senderInfo.email}
                      onChange={(e) => setSenderInfo({...senderInfo, email: e.target.value})}
                      className="glass-input rounded-xl border-0"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input 
                      placeholder="شماره تماس"
                      value={senderInfo.phone}
                      onChange={(e) => setSenderInfo({...senderInfo, phone: e.target.value})}
                      className="glass-input rounded-xl border-0"
                    />
                    <Input 
                      placeholder="عنوان شغلی"
                      value={senderInfo.title}
                      onChange={(e) => setSenderInfo({...senderInfo, title: e.target.value})}
                      className="glass-input rounded-xl border-0"
                    />
                    <Input 
                      placeholder="نام شرکت"
                      value={senderInfo.company}
                      onChange={(e) => setSenderInfo({...senderInfo, company: e.target.value})}
                      className="glass-input rounded-xl border-0"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Generate Button */}
            <motion.div variants={cardVariants}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  className="w-full gap-3 rounded-2xl h-14 text-base font-semibold bg-gradient-to-l from-primary to-accent hover:opacity-90 glow-primary" 
                  onClick={() => generateEmail()}
                  disabled={isGenerating || !purpose || !industry || !recipientType || !keyPoints.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      در حال تولید با هوش مصنوعی...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      تولید ایمیل با AI
                      <Zap className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right: Output Section */}
          <div className="space-y-5">
            <AnimatePresence mode="wait">
              {output ? (
                <motion.div
                  key="output"
                  variants={outputVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-5"
                >
                  {/* Subject */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="glass-card rounded-2xl border-0 hover-glow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">موضوع ایمیل</CardTitle>
                          <div className="flex gap-2">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(editedSubject, 'subject')}
                                className="glass-button rounded-xl border-0"
                              >
                                {copiedField === 'subject' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => generateEmail('subject')}
                                disabled={regeneratingPart === 'subject'}
                                className="glass-button rounded-xl border-0"
                              >
                                {regeneratingPart === 'subject' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Input 
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="font-medium glass-input rounded-xl border-0"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Body */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="glass-card rounded-2xl border-0 hover-glow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">متن ایمیل</CardTitle>
                          <div className="flex gap-2">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(editedBody, 'body')}
                                className="glass-button rounded-xl border-0"
                              >
                                {copiedField === 'body' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => generateEmail('body')}
                                disabled={regeneratingPart === 'body'}
                                className="glass-button rounded-xl border-0"
                              >
                                {regeneratingPart === 'body' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea 
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          className="min-h-[300px] resize-none leading-relaxed glass-input rounded-xl border-0"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Translations */}
                  <AnimatePresence>
                    {translateTo.length > 0 && output.translations && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card className="glass-card rounded-2xl border-0 hover-glow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Languages className="h-4 w-4 text-primary" />
                                ترجمه‌ها
                              </CardTitle>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => generateEmail('translation')}
                                  disabled={regeneratingPart === 'translation'}
                                  className="glass-button rounded-xl border-0"
                                >
                                  {regeneratingPart === 'translation' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </motion.div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Tabs value={activeTranslationTab} onValueChange={setActiveTranslationTab}>
                              <TabsList className="mb-4 glass-card rounded-xl border-0 p-1">
                                {translateTo.map(lang => {
                                  const langInfo = LANGUAGES.find(l => l.value === lang);
                                  return (
                                    <TabsTrigger key={lang} value={lang} className="gap-1 rounded-lg">
                                      <span>{langInfo?.flag}</span>
                                      <span>{langInfo?.label}</span>
                                    </TabsTrigger>
                                  );
                                })}
                              </TabsList>
                              {translateTo.map(lang => (
                                <TabsContent key={lang} value={lang} className="space-y-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">موضوع</Label>
                                    <Input 
                                      value={output.translations[lang]?.subject || ''} 
                                      readOnly 
                                      className="mt-1 glass-input rounded-xl border-0"
                                      dir={lang === 'arabic' ? 'rtl' : 'ltr'}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">متن</Label>
                                    <Textarea 
                                      value={output.translations[lang]?.body || ''} 
                                      readOnly 
                                      className="mt-1 min-h-[200px] glass-input rounded-xl border-0"
                                      dir={lang === 'arabic' ? 'rtl' : 'ltr'}
                                    />
                                  </div>
                                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => copyToClipboard(
                                        `${output.translations[lang]?.subject}\n\n${output.translations[lang]?.body}`,
                                        `translation-${lang}`
                                      )}
                                      className="gap-2 glass-button rounded-xl border-0"
                                    >
                                      {copiedField === `translation-${lang}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                      کپی ترجمه
                                    </Button>
                                  </motion.div>
                                </TabsContent>
                              ))}
                            </Tabs>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-3"
                  >
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        className="w-full gap-2 rounded-xl h-12 bg-gradient-to-l from-primary to-accent hover:opacity-90"
                        onClick={() => copyToClipboard(`${editedSubject}\n\n${editedBody}`, 'all')}
                      >
                        {copiedField === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        کپی کل ایمیل
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="secondary"
                        className="w-full gap-2 rounded-xl h-12 glass-button border-0"
                        onClick={openMailto}
                      >
                        <Send className="h-4 w-4" />
                        باز کردن در ایمیل
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="outline"
                        onClick={() => generateEmail()}
                        disabled={isGenerating}
                        className="glass-button rounded-xl h-12 border-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
                /* Empty State */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="glass-card rounded-3xl border-0 h-full min-h-[600px] flex items-center justify-center">
                    <div className="text-center space-y-6 p-8">
                      <motion.div 
                        className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit mx-auto glow-soft"
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 5, 0, -5, 0],
                        }}
                        transition={{ 
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Mail className="h-16 w-16 text-primary" />
                      </motion.div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                          ایمیل شما اینجا نمایش داده می‌شود
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          فرم سمت راست را پر کنید و روی "تولید ایمیل با AI" کلیک کنید تا ایمیل حرفه‌ای و متناسب با صنعت شما تولید شود.
                        </p>
                      </div>
                      <motion.div 
                        className="flex flex-wrap gap-2 justify-center mt-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          visible: { transition: { staggerChildren: 0.1 } }
                        }}
                      >
                        {['ساختار استاندارد', 'لحن حرفه‌ای', 'ترجمه همزمان', 'قابل ویرایش'].map((text, i) => (
                          <motion.div
                            key={text}
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              visible: { opacity: 1, y: 0 },
                            }}
                          >
                            <Badge 
                              variant="outline" 
                              className="glass-button border-0 rounded-full px-4 py-1.5"
                            >
                              {text}
                            </Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
