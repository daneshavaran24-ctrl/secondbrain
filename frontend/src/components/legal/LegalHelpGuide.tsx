import React from 'react';
import { HelpCircle, FileText, Calendar, Users, StickyNote, Mic, Volume2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function LegalHelpGuide() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <HelpCircle className="h-5 w-5 text-primary" />
          راهنمای استفاده از بخش امور حقوقی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Quick Start */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            شروع سریع
          </h3>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">1</Badge>
              <span>پرونده حقوقی جدید ایجاد کنید</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">2</Badge>
              <span>روی پرونده کلیک کنید تا جزئیات باز شود</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">3</Badge>
              <span>به تب "یادداشت‌ها" بروید</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">4</Badge>
              <span>دکمه "یادداشت جدید" را کلیک کنید</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Voice Notes Feature */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mic className="h-4 w-4 text-red-500" />
            قابلیت یادداشت‌برداری صوتی
          </h3>
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mic className="h-3 w-3 text-red-500" />
              <span><strong>ضبط صوت:</strong> دکمه میکروفون را فشار دهید</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Volume2 className="h-3 w-3 text-green-500" />
              <span><strong>پخش:</strong> صدای ضبط شده را بشنوید</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-3 w-3 text-blue-500" />
              <span><strong>تبدیل به متن:</strong> صوت به طور خودکار به متن فارسی تبدیل می‌شود</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation Guide */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-purple-500" />
            نحوه دسترسی به یادداشت‌ها
          </h3>
          <div className="grid gap-3">
            <Card className="p-3">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">۱. از صفحه اصلی</p>
                  <p className="text-xs text-muted-foreground">امور حقوقی ← انتخاب پرونده ← تب یادداشت‌ها</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">۲. مدیریت جلسات</p>
                  <p className="text-xs text-muted-foreground">جلسات ← ایجاد جلسه جدید ← درج یادداشت‌ها</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-orange-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">۳. هماهنگی با وکیل</p>
                  <p className="text-xs text-muted-foreground">یادداشت‌های جلسات قبل را مرور کنید</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Tips */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">نکات مفید</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>همیشه قبل از جلسه باوکیل، یادداشت‌های قبلی را مرور کنید</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>از قابلیت ضبط صوت برای ثبت نکات مهم استفاده کنید</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>یادداشت‌ها به طور خودکار ذخیره می‌شوند</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>می‌توانید هم متن تایپ کنید و هم صوت ضبط کنید</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}