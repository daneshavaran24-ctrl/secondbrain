import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { testDataService } from '@/services/testDataService';
import { generateDailyContent } from '@/services/dailyContentGenerator';
import { useToast } from '@/hooks/use-toast';
import { PersianNumber } from "@/components/ui/persian-number";

export function TestDataInitializer() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const handleInitializeData = async () => {
    setIsLoading(true);

    try {
      // ایجاد داده‌های اصلی
      await testDataService.initializeAllTestData();

      // ایجاد محتوای روزانه
      const dailyContent = generateDailyContent();
      localStorage.setItem('dailyContent', JSON.stringify(dailyContent));

      setIsInitialized(true);

      toast({
        title: "✅ داده‌های تستی آماده شد",
        description: "تمام ماژول‌های سیستم با داده‌های واقعی پر شدند",
      });

      // نمایش خلاصه
      const summary = await testDataService.getDataSummary();
      // console.log removed for production: summary

    } catch (error) {
      console.error('خطا در ایجاد داده‌های تستی:', error);
      toast({
        title: "❌ خطا در ایجاد داده‌ها",
        description: "مشکلی در ایجاد داده‌های تستی رخ داد",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDataStatus = () => {
    const personalTasks = localStorage.getItem('personalTasks');
    const projects = localStorage.getItem('projects');
    const meetings = localStorage.getItem('meetings');

    return !!(personalTasks && projects && meetings);
  };

  const getDataStats = () => {
    if (!checkDataStatus()) return null;

    return {
      personalTasks: JSON.parse(localStorage.getItem('personalTasks') || '[]').length,
      projects: JSON.parse(localStorage.getItem('projects') || '[]').length,
      projectTasks: 0,
      meetings: JSON.parse(localStorage.getItem('meetings') || '[]').length,
      knowledgeItems: JSON.parse(localStorage.getItem('knowledgeItems') || '[]').length,
      secretaryRequests: JSON.parse(localStorage.getItem('secretaryRequests') || '[]').length,
    };
  };

  const dataExists = checkDataStatus();
  const stats = getDataStats();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          مدیریت داده‌های تستی
        </CardTitle>
        <CardDescription>
          ایجاد داده‌های تستی واقعی برای تمام ماژول‌های سیستم Mora
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataExists && stats ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">داده‌های تستی موجود است</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-between">
                  وظایف شخصی
                  <span><PersianNumber>{stats.personalTasks}</PersianNumber></span>
                </Badge>
                <Badge variant="secondary" className="w-full justify-between">
                  پروژه‌ها
                  <span><PersianNumber>{stats.projects}</PersianNumber></span>
                </Badge>
                <Badge variant="secondary" className="w-full justify-between">
                  وظایف پروژه
                  <span><PersianNumber>{stats.projectTasks}</PersianNumber></span>
                </Badge>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-between">
                  جلسات
                  <span><PersianNumber>{stats.meetings}</PersianNumber></span>
                </Badge>
                <Badge variant="secondary" className="w-full justify-between">
                  آیتم‌های دانش
                  <span><PersianNumber>{stats.knowledgeItems}</PersianNumber></span>
                </Badge>
                <Badge variant="secondary" className="w-full justify-between">
                  درخواست‌های منشی
                  <span><PersianNumber>{stats.secretaryRequests}</PersianNumber></span>
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <span>هیچ داده تستی موجود نیست</span>
          </div>
        )}

        <Button
          onClick={handleInitializeData}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              در حال ایجاد داده‌ها...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              {dataExists ? 'بازسازی داده‌های تستی' : 'ایجاد داده‌های تستی'}
            </>
          )}
        </Button>

        {dataExists && (
          <div className="text-sm text-muted-foreground text-center">
            آخرین بار داده‌ها بروزرسانی شدند
          </div>
        )}
      </CardContent>
    </Card>
  );
}