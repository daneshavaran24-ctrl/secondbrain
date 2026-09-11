import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { habitTrackerService, HabitSettings as Settings } from '@/services/habitTrackerService';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

export const HabitSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const data = await habitTrackerService.getSettings(user.id);
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    if (!user) return;
    setLoading(true);
    try {
      const updated = await habitTrackerService.updateSettings(user.id, updates);
      setSettings(updated);
      toast({
        title: 'تنظیمات ذخیره شد',
        description: 'تغییرات شما با موفقیت اعمال شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره تنظیمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!user) return;
    try {
      const habits = await habitTrackerService.getHabits(user.id);
      const now = new Date();
      const completions = await habitTrackerService.getCompletionsForMonth(
        user.id,
        now.getFullYear(),
        now.getMonth() + 1
      );

      const data = {
        habits,
        completions,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habits-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'خروجی گرفته شد',
        description: 'فایل JSON با موفقیت دانلود شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در خروجی گرفتن داده‌ها',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const completions = await habitTrackerService.getCompletionsForMonth(
        user.id,
        now.getFullYear(),
        now.getMonth() + 1
      );

      const csv = Papa.unparse(completions);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habits-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'خروجی گرفته شد',
        description: 'فایل CSV با موفقیت دانلود شد.',
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در خروجی گرفتن داده‌ها',
        variant: 'destructive',
      });
    }
  };

  if (!settings) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>اعلان‌ها</CardTitle>
          <CardDescription>مدیریت اعلان‌های روزانه برای یادآوری عادت‌ها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">فعال‌سازی اعلان‌ها</Label>
            <Switch
              id="notifications"
              checked={settings.notification_enabled}
              onCheckedChange={(checked) =>
                handleUpdateSettings({ notification_enabled: checked })
              }
              disabled={loading}
            />
          </div>

          {settings.notification_enabled && (
            <div className="space-y-2">
              <Label htmlFor="notification-time">زمان اعلان</Label>
              <Input
                id="notification-time"
                type="time"
                value={settings.notification_time}
                onChange={(e) =>
                  handleUpdateSettings({ notification_time: e.target.value })
                }
                disabled={loading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>ظاهر</CardTitle>
          <CardDescription>تنظیمات ظاهری رابط کاربری</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>حالت تیره</Label>
            <Switch
              checked={settings.theme === 'dark'}
              onCheckedChange={(checked) =>
                handleUpdateSettings({ theme: checked ? 'dark' : 'light' })
              }
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle>خروجی داده‌ها</CardTitle>
          <CardDescription>دریافت نسخه پشتیبان از عادت‌ها و پیشرفت‌های خود</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleExportJSON} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              دانلود JSON
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              دانلود CSV
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            فایل‌های خروجی شامل تمام عادت‌ها و تکمیل‌های ماه جاری می‌شوند.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
