import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Bell, 
  Clock, 
  Mail, 
  Phone, 
  MessageSquare,
  Save,
  RefreshCw,
  Settings
} from 'lucide-react';

interface DelegationSettingsProps {
  domain?: string;
  onSettingsUpdate?: () => void;
}

export function DelegationSettings({ domain = 'personal', onSettingsUpdate }: DelegationSettingsProps) {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      secretary: true
    },
    reminders: {
      enabled: true,
      beforeDueDate: 24, // hours
      frequency: 'daily', // daily, hourly, custom
      methods: ['email', 'push']
    },
    autoAssignment: {
      enabled: false,
      rules: []
    },
    templates: {
      emailTemplate: 'default',
      smsTemplate: 'default',
      secretaryTemplate: 'default'
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "موفقیت",
        description: "تنظیمات با موفقیت ذخیره شد",
      });
      
      onSettingsUpdate?.();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره تنظیمات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotificationSetting = (type: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: enabled
      }
    }));
  };

  const updateReminderSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            تنظیمات واگذاری وظایف
            {domain && (
              <Badge variant="outline" className="text-sm">
                حوزه {domain === 'personal' ? 'فردی' : domain === 'professional' ? 'حرفه‌ای' : 'سازمانی'}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">تنظیم اطلاع‌رسانی‌ها و یادآوری‌ها برای حوزه انتخابی</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="btn-primary">
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              ذخیره تنظیمات
            </>
          )}
        </Button>
      </div>

      {/* Notification Settings */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            تنظیمات اطلاع‌رسانی
          </CardTitle>
          <CardDescription>
            انتخاب کنید که چه زمانی و از چه طریقی اطلاع‌رسانی دریافت کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <Label>اطلاع‌رسانی ایمیل</Label>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => updateNotificationSetting('email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <Label>اطلاع‌رسانی پیامک</Label>
                </div>
                <Switch
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) => updateNotificationSetting('sms', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-purple-600" />
                  <Label>اطلاع‌رسانی فوری</Label>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => updateNotificationSetting('push', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <Label>اطلاع‌رسانی منشی</Label>
                </div>
                <Switch
                  checked={settings.notifications.secretary}
                  onCheckedChange={(checked) => updateNotificationSetting('secretary', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            تنظیمات یادآوری
          </CardTitle>
          <CardDescription>
            تنظیم زمان‌بندی و نحوه ارسال یادآوری‌های وظایف
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>فعال‌سازی یادآوری‌ها</Label>
            <Switch
              checked={settings.reminders.enabled}
              onCheckedChange={(checked) => updateReminderSetting('enabled', checked)}
            />
          </div>

          {settings.reminders.enabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>زمان یادآوری قبل از سررسید</Label>
                    <Select
                      value={settings.reminders.beforeDueDate.toString()}
                      onValueChange={(value) => updateReminderSetting('beforeDueDate', parseInt(value))}
                    >
                      <SelectTrigger className="input-glass mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ساعت قبل</SelectItem>
                        <SelectItem value="6">6 ساعت قبل</SelectItem>
                        <SelectItem value="12">12 ساعت قبل</SelectItem>
                        <SelectItem value="24">1 روز قبل</SelectItem>
                        <SelectItem value="48">2 روز قبل</SelectItem>
                        <SelectItem value="72">3 روز قبل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>فرکانس یادآوری</Label>
                    <Select
                      value={settings.reminders.frequency}
                      onValueChange={(value) => updateReminderSetting('frequency', value)}
                    >
                      <SelectTrigger className="input-glass mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">یک بار</SelectItem>
                        <SelectItem value="daily">روزانه</SelectItem>
                        <SelectItem value="hourly">ساعتی</SelectItem>
                        <SelectItem value="custom">سفارشی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>روش‌های یادآوری</Label>
                  <div className="space-y-2">
                    {['email', 'sms', 'push'].map((method) => (
                      <div key={method} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`reminder-${method}`}
                          checked={settings.reminders.methods.includes(method)}
                          onChange={(e) => {
                            const newMethods = e.target.checked
                              ? [...settings.reminders.methods, method]
                              : settings.reminders.methods.filter(m => m !== method);
                            updateReminderSetting('methods', newMethods);
                          }}
                          className="rounded border-border"
                        />
                        <Label htmlFor={`reminder-${method}`} className="flex items-center gap-2">
                          {method === 'email' && <Mail className="h-4 w-4" />}
                          {method === 'sms' && <Phone className="h-4 w-4" />}
                          {method === 'push' && <Bell className="h-4 w-4" />}
                          {method === 'email' ? 'ایمیل' : method === 'sms' ? 'پیامک' : 'اطلاع‌رسانی فوری'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Template Settings */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle>قالب‌های پیام</CardTitle>
          <CardDescription>
            انتخاب قالب‌های پیش‌فرض برای انواع مختلف اطلاع‌رسانی
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>قالب ایمیل</Label>
              <Select
                value={settings.templates.emailTemplate}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  templates: { ...prev.templates, emailTemplate: value }
                }))}
              >
                <SelectTrigger className="input-glass mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">پیش‌فرض</SelectItem>
                  <SelectItem value="formal">رسمی</SelectItem>
                  <SelectItem value="friendly">دوستانه</SelectItem>
                  <SelectItem value="urgent">فوری</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>قالب پیامک</Label>
              <Select
                value={settings.templates.smsTemplate}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  templates: { ...prev.templates, smsTemplate: value }
                }))}
              >
                <SelectTrigger className="input-glass mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">پیش‌فرض</SelectItem>
                  <SelectItem value="short">کوتاه</SelectItem>
                  <SelectItem value="detailed">تفصیلی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>قالب کارتابل منشی</Label>
              <Select
                value={settings.templates.secretaryTemplate}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  templates: { ...prev.templates, secretaryTemplate: value }
                }))}
              >
                <SelectTrigger className="input-glass mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">پیش‌فرض</SelectItem>
                  <SelectItem value="professional">حرفه‌ای</SelectItem>
                  <SelectItem value="simple">ساده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card className="card-glass border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">وضعیت فعلی تنظیمات</h3>
              <p className="text-sm text-muted-foreground">خلاصه تنظیمات فعال</p>
            </div>
            <div className="flex gap-2">
              {settings.notifications.email && <Badge variant="secondary">ایمیل</Badge>}
              {settings.notifications.sms && <Badge variant="secondary">پیامک</Badge>}
              {settings.notifications.push && <Badge variant="secondary">فوری</Badge>}
              {settings.reminders.enabled && <Badge variant="outline">یادآوری فعال</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}