import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Book, 
  Code, 
  Database, 
  Shield, 
  User, 
  Settings,
  ChevronDown,
  ChevronRight,
  Layers,
  GitBranch,
  Server,
  Cloud,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrintToPDF = () => {
    window.print();
  };

  const sections = [
    { id: 'overview', title: 'معرفی کلی', icon: Book },
    { id: 'modules', title: 'ماژول‌ها و فیچرها', icon: Layers },
    { id: 'frs', title: 'مشخصات عملکردی (FRS)', icon: FileText },
    { id: 'architecture', title: 'معماری سیستم', icon: Code },
    { id: 'database', title: 'مدل داده', icon: Database },
    { id: 'security', title: 'امنیت', icon: Shield },
    { id: 'users', title: 'نقش‌های کاربری', icon: User },
    { id: 'roadmap', title: 'نقشه راه', icon: GitBranch }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 mora-gradient rounded-xl flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">مستندات نرم‌افزار مورا</h1>
              <p className="text-lg text-muted-foreground">سیستم مدیریت دانش شخصی و سازمانی</p>
            </div>
          </div>
          <Button onClick={handlePrintToPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            دانلود PDF
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline">نسخه 2.1.0</Badge>
          <span>آخرین بروزرسانی: ۱۳ آبان ۱۴۰۳</span>
          <span>توسعه‌دهنده: تیم مورا</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">فهرست مطالب</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div ref={contentRef} className="print:p-0">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Book className="w-5 h-5" />
                      معرفی کلی نرم‌افزار مورا
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg leading-relaxed">
                      مورا یک سیستم جامع مدیریت دانش شخصی و سازمانی است که برای مدیران، پزشکان و متخصصان طراحی شده است. 
                      این نرم‌افزار به عنوان "مغز دوم دیجیتال" عمل می‌کند و کمک می‌کند تا اطلاعات، دانش و فعالیت‌های روزانه 
                      به صورت هوشمند مدیریت شوند.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <h4 className="font-semibold mb-2">هدف اصلی</h4>
                        <p className="text-sm text-muted-foreground">
                          تسهیل مدیریت دانش و افزایش بهره‌وری فردی و سازمانی
                        </p>
                      </div>
                      <div className="p-4 bg-secondary/5 rounded-lg">
                        <h4 className="font-semibold mb-2">کاربران هدف</h4>
                        <p className="text-sm text-muted-foreground">
                          مدیران، پزشکان، متخصصان و سازمان‌های بهداشتی
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">ویژگی‌های کلیدی</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'مدیریت دانش هوشمند',
                          'سیستم تقویم پیشرفته',
                          'مدیریت جلسات و ملاقات‌ها',
                          'دستیار هوش مصنوعی',
                          'مدیریت پروژه‌ها',
                          'سیستم واگذاری وظایف',
                          'پورتال سازمانی',
                          'گزارش‌گیری پیشرفته'
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Modules Section */}
            {activeSection === 'modules' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Layers className="w-5 h-5" />
                      ماژول‌ها و فیچرهای نرم‌افزار
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          title: 'ماژول مدیریت دانش',
                          features: [
                            'ذخیره و سازماندهی اسناد',
                            'جستجوی هوشمند',
                            'تگ‌گذاری خودکار',
                            'استخراج متن از PDF',
                            'OCR برای تصاویر',
                            'گراف دانش'
                          ]
                        },
                        {
                          title: 'ماژول تقویم و زمان‌بندی',
                          features: [
                            'تقویم فارسی/میلادی',
                            'یادآورهای هوشمند',
                            'مناسبت‌های ملی و مذهبی',
                            'برنامه‌ریزی روزانه',
                            'تحلیل زمان',
                            'هماهنگی با تقویم‌های خارجی'
                          ]
                        },
                        {
                          title: 'ماژول مدیریت جلسات',
                          features: [
                            'برنامه‌ریزی جلسات',
                            'ضبط صوتی جلسات',
                            'تبدیل گفتار به متن',
                            'تولید خلاصه هوشمند',
                            'مدیریت شرکت‌کنندگان',
                            'پیگیری تصمیمات'
                          ]
                        },
                        {
                          title: 'دستیار هوش مصنوعی',
                          features: [
                            'پاسخ به سوالات',
                            'خلاصه‌سازی اسناد',
                            'تولید نقشه ذهنی',
                            'پیشنهادات هوشمند',
                            'تحلیل متن',
                            'ترجمه'
                          ]
                        },
                        {
                          title: 'ماژول مدیریت پروژه',
                          features: [
                            'تابلوی کانبان',
                            'روش اسکرام',
                            'نظارت بر پیشرفت',
                            'تخصیص منابع',
                            'گزارش‌گیری',
                            'مدیریت ریسک'
                          ]
                        },
                        {
                          title: 'سیستم واگذاری وظایف',
                          features: [
                            'تعریف وظایف',
                            'تخصیص به افراد',
                            'پیگیری اجرا',
                            'ارزیابی عملکرد',
                            'اعلان‌ها',
                            'گزارش فعالیت'
                          ]
                        }
                      ].map((module, index) => (
                        <Collapsible key={index}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <span className="font-semibold">{module.title}</span>
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {module.features.map((feature, fIndex) => (
                                  <div key={fIndex} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    <span className="text-sm">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Architecture Section */}
            {activeSection === 'architecture' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Code className="w-5 h-5" />
                      معماری سیستم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">نمودار معماری کلی</h4>
                      <div className="mb-6">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-4">نمودار معماری سیستم:</p>
                          <div className="space-y-3 text-sm">
                            <div><strong>Frontend:</strong> React + TypeScript + Tailwind CSS</div>
                            <div><strong>Backend:</strong> Supabase (PostgreSQL + Auth + Storage)</div>
                            <div><strong>External APIs:</strong> OpenAI + Speech-to-Text + OCR</div>
                            <div><strong>Deployment:</strong> Vercel + Edge Functions</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h4 className="font-semibold">لایه فرانت‌اند</h4>
                        <div className="space-y-2">
                          {[
                            { name: 'React 18', desc: 'کتابخانه UI اصلی' },
                            { name: 'TypeScript', desc: 'نوع‌گذاری استاتیک' },
                            { name: 'Tailwind CSS', desc: 'استایل‌دهی' },
                            { name: 'Shadcn/ui', desc: 'کامپوننت‌های UI' },
                            { name: 'Vite', desc: 'ابزار بیلد' }
                          ].map((tech, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded border">
                              <span className="font-medium">{tech.name}</span>
                              <span className="text-sm text-muted-foreground">{tech.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">لایه بک‌اند</h4>
                        <div className="space-y-2">
                          {[
                            { name: 'Supabase', desc: 'پلتفرم BaaS' },
                            { name: 'PostgreSQL', desc: 'پایگاه داده' },
                            { name: 'Edge Functions', desc: 'لاجیک سرور' },
                            { name: 'Real-time', desc: 'به‌روزرسانی لحظه‌ای' },
                            { name: 'Storage', desc: 'ذخیره فایل' }
                          ].map((tech, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded border">
                              <span className="font-medium">{tech.name}</span>
                              <span className="text-sm text-muted-foreground">{tech.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">ساختار پروژه</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-sm font-mono whitespace-pre-wrap">
                          {`src/\n├── components/          # کامپوننت‌های قابل استفاده مجدد\n│   ├── ui/             # کامپوننت‌های پایه UI\n│   ├── auth/           # احراز هویت\n│   ├── chat/           # چت و پیام‌رسانی\n│   └── ...\n├── pages/              # صفحات اصلی\n├── hooks/              # هوک‌های سفارشی\n├── services/           # سرویس‌ها و API\n├── types/              # تعریف انواع TypeScript\n└── lib/                # توابع کمکی`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Database Section */}
            {activeSection === 'database' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Database className="w-5 h-5" />
                      مدل داده‌ای سیستم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">نمودار روابط موجودات (ERD)</h4>
                      <div className="mb-6">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-4">جداول اصلی پایگاه داده:</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>• users (کاربران)</div>
                            <div>• knowledge_items (آیتم‌های دانش)</div>
                            <div>• meetings (جلسات)</div>
                            <div>• tasks (وظایف)</div>
                            <div>• projects (پروژه‌ها)</div>
                            <div>• delegations (واگذاری‌ها)</div>
                            <div>• organizations (سازمان‌ها)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-3">جداول اصلی</h4>
                        <div className="space-y-3">
                          {[
                            { name: 'users', desc: 'اطلاعات کاربران', records: '~1000' },
                            { name: 'knowledge_items', desc: 'آیتم‌های دانش', records: '~10000' },
                            { name: 'meetings', desc: 'جلسات و ملاقات‌ها', records: '~5000' },
                            { name: 'tasks', desc: 'وظایف و کارها', records: '~15000' },
                            { name: 'projects', desc: 'پروژه‌ها', records: '~500' }
                          ].map((table, index) => (
                            <div key={index} className="p-3 border rounded">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{table.name}</span>
                                <Badge variant="outline" className="text-xs">{table.records}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{table.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">سیاست‌های امنیتی</h4>
                        <div className="space-y-3">
                          {[
                            'Row Level Security (RLS) فعال',
                            'دسترسی بر اساس نقش کاربر',
                            'رمزگذاری داده‌های حساس',
                            'پشتیبان‌گیری خودکار روزانه',
                            'لاگ کامل فعالیت‌ها'
                          ].map((policy, index) => (
                            <div key={index} className="flex items-center gap-2 p-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{policy}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* FRS Section */}
            {activeSection === 'frs' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      مشخصات عملکردی سیستم (FRS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="knowledge" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="knowledge">مدیریت دانش</TabsTrigger>
                        <TabsTrigger value="meetings">جلسات</TabsTrigger>
                        <TabsTrigger value="projects">پروژه‌ها</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="knowledge" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold">الزامات عملکردی ماژول مدیریت دانش</h4>
                          {[
                            { id: 'FRS-KM-001', title: 'آپلود فایل', desc: 'سیستم باید امکان آپلود انواع فایل (PDF, DOC, TXT, Image) را فراهم کند' },
                            { id: 'FRS-KM-002', title: 'استخراج متن', desc: 'سیستم باید متن را از فایل‌های PDF و تصاویر استخراج کند' },
                            { id: 'FRS-KM-003', title: 'جستجوی پیشرفته', desc: 'کاربر باید بتواند با کلیدواژه، تاریخ و تگ جستجو کند' },
                            { id: 'FRS-KM-004', title: 'دسته‌بندی خودکار', desc: 'سیستم باید محتوا را بر اساس موضوع دسته‌بندی کند' },
                            { id: 'FRS-KM-005', title: 'تگ‌گذاری هوشمند', desc: 'سیستم باید تگ‌های مناسب را پیشنهاد دهد' }
                          ].map((req, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">{req.id}</Badge>
                                <div>
                                  <h5 className="font-medium">{req.title}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">{req.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="meetings" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold">الزامات عملکردی ماژول جلسات</h4>
                          {[
                            { id: 'FRS-MT-001', title: 'برنامه‌ریزی جلسه', desc: 'کاربر باید بتواند جلسه تعریف و شرکت‌کنندگان را دعوت کند' },
                            { id: 'FRS-MT-002', title: 'ضبط صوتی', desc: 'سیستم باید امکان ضبط صوتی جلسات را فراهم کند' },
                            { id: 'FRS-MT-003', title: 'تبدیل گفتار به متن', desc: 'سیستم باید گفتار را به متن تبدیل کند' },
                            { id: 'FRS-MT-004', title: 'تولید خلاصه', desc: 'سیستم باید خلاصه‌ای از جلسه تولید کند' },
                            { id: 'FRS-MT-005', title: 'پیگیری مصوبات', desc: 'سیستم باید امکان پیگیری اجرای مصوبات را فراهم کند' }
                          ].map((req, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">{req.id}</Badge>
                                <div>
                                  <h5 className="font-medium">{req.title}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">{req.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="projects" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold">الزامات عملکردی ماژول پروژه‌ها</h4>
                          {[
                            { id: 'FRS-PM-001', title: 'ایجاد پروژه', desc: 'کاربر باید بتواند پروژه جدید تعریف کند' },
                            { id: 'FRS-PM-002', title: 'تابلوی کانبان', desc: 'سیستم باید تابلوی کانبان برای مدیریت وظایف فراهم کند' },
                            { id: 'FRS-PM-003', title: 'تخصیص منابع', desc: 'مدیر پروژه باید بتواند منابع را به وظایف اختصاص دهد' },
                            { id: 'FRS-PM-004', title: 'گزارش پیشرفت', desc: 'سیستم باید گزارش پیشرفت پروژه را نمایش دهد' },
                            { id: 'FRS-PM-005', title: 'مدیریت ریسک', desc: 'سیستم باید امکان شناسایی و مدیریت ریسک‌ها را فراهم کند' }
                          ].map((req, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">{req.id}</Badge>
                                <div>
                                  <h5 className="font-medium">{req.title}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">{req.desc}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Section */}
            {activeSection === 'users' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <User className="w-5 h-5" />
                      نقش‌های کاربری
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          role: 'مدیر سیستم',
                          permissions: [
                            'مدیریت کاربران',
                            'تنظیمات سیستم',
                            'مشاهده گزارش‌های کلی',
                            'مدیریت سازمان‌ها',
                            'بازیابی داده‌ها'
                          ],
                          color: 'bg-red-500'
                        },
                        {
                          role: 'مدیر ارشد',
                          permissions: [
                            'مدیریت تیم',
                            'دسترسی به تمام ماژول‌ها',
                            'تولید گزارش',
                            'واگذاری وظایف',
                            'مدیریت پروژه‌ها'
                          ],
                          color: 'bg-blue-500'
                        },
                        {
                          role: 'مدیر میانی',
                          permissions: [
                            'مدیریت پروژه‌های اختصاصی',
                            'مدیریت دانش شخصی',
                            'برگزاری جلسات',
                            'پیگیری وظایف',
                            'گزارش عملکرد'
                          ],
                          color: 'bg-green-500'
                        },
                        {
                          role: 'کاربر عادی',
                          permissions: [
                            'مدیریت دانش شخصی',
                            'مشارکت در جلسات',
                            'انجام وظایف محوله',
                            'استفاده از دستیار AI',
                            'تقویم شخصی'
                          ],
                          color: 'bg-gray-500'
                        }
                      ].map((userRole, index) => (
                        <Card key={index} className="h-full">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${userRole.color}`} />
                              <CardTitle className="text-lg">{userRole.role}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {userRole.permissions.map((permission, pIndex) => (
                                <div key={pIndex} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                  <span className="text-sm">{permission}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Shield className="w-5 h-5" />
                      ویژگی‌های امنیتی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">احراز هویت و مجوزها</h4>
                        <div className="space-y-3">
                          {[
                            'احراز هویت چندمرحله‌ای (MFA)',
                            'رمزگذاری رمز عبور',
                            'نشست‌های امن',
                            'کنترل دسترسی مبتنی بر نقش',
                            'لاگ فعالیت‌های کاربران'
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">امنیت داده‌ها</h4>
                        <div className="space-y-3">
                          {[
                            'رمزگذاری داده‌ها در حین انتقال',
                            'رمزگذاری داده‌ها در حین ذخیره',
                            'پشتیبان‌گیری خودکار',
                            'Row Level Security (RLS)',
                            'حذف امن داده‌ها'
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">تست‌های امنیتی</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { test: 'تست نفوذ', status: 'موفق', lastRun: '۱۴۰۳/۰۸/۱۵' },
                          { test: 'بررسی آسیب‌پذیری', status: 'موفق', lastRun: '۱۴۰۳/۰۸/۱۰' },
                          { test: 'تست SQL Injection', status: 'موفق', lastRun: '۱۴۰۳/۰۸/۰۵' }
                        ].map((test, index) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="text-sm font-medium">{test.test}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                {test.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{test.lastRun}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Roadmap Section */}
            {activeSection === 'roadmap' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5" />
                      نقشه راه توسعه
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {[
                        {
                          version: 'نسخه ۲.۲.۰',
                          quarter: 'زمستان ۱۴۰۳',
                          status: 'در حال توسعه',
                          features: [
                            'بهبود عملکرد جستجو',
                            'اپلیکیشن موبایل',
                            'یکپارچگی با تقویم‌های خارجی',
                            'گزارش‌گیری پیشرفته'
                          ]
                        },
                        {
                          version: 'نسخه ۲.۳.۰',
                          quarter: 'بهار ۱۴۰۴',
                          status: 'برنامه‌ریزی',
                          features: [
                            'ماژول CRM',
                            'یکپارچگی با سیستم‌های خارجی',
                            'خلاصه‌سازی خودکار اسناد',
                            'تحلیل احساسات'
                          ]
                        },
                        {
                          version: 'نسخه ۳.۰.۰',
                          quarter: 'تابستان ۱۴۰۴',
                          status: 'ایده',
                          features: [
                            'معماری میکروسرویس',
                            'قابلیت‌های پیشرفته AI',
                            'پشتیبانی چندزبانه کامل',
                            'API عمومی'
                          ]
                        }
                      ].map((roadmapItem, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{roadmapItem.version}</h4>
                              <p className="text-sm text-muted-foreground">{roadmapItem.quarter}</p>
                            </div>
                            <Badge variant={roadmapItem.status === 'در حال توسعه' ? 'default' : 'outline'}>
                              {roadmapItem.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {roadmapItem.features.map((feature, fIndex) => (
                              <div key={fIndex} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1in;
          }
          .no-print {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentationPage;