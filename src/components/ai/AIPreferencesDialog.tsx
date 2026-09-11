import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Settings, Key, CheckCircle, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { checkPerplexityApiStatus } from '@/lib/ai';

interface AIPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIPreferencesDialog: React.FC<AIPreferencesDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error' | 'not_configured'>('unknown');

  useEffect(() => {
    if (isOpen) {
      // Check API status when dialog opens
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('unknown');

    try {
      const status = await checkPerplexityApiStatus();
      
      if (!status.configured) {
        setConnectionStatus('not_configured');
        toast({
          title: "کلید API پیکربندی نشده",
          description: "لطفاً از طریق Supabase Secrets کلید PERPLEXITY_API_KEY را اضافه کنید.",
          variant: "destructive"
        });
      } else if (status.success) {
        setConnectionStatus('success');
        toast({
          title: "اتصال موفق",
          description: "اتصال به Perplexity AI با موفقیت برقرار شد.",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "خطا در اتصال",
          description: "کلید API معتبر نیست یا مشکلی در اتصال وجود دارد.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "خطا در اتصال",
        description: "خطا در برقراری ارتباط با سرور.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-right pr-8">
            <Settings className="h-5 w-5" />
            تنظیمات هوش مصنوعی
          </DialogTitle>
          <DialogDescription className="text-right pr-8">
            وضعیت اتصال و قابلیت‌های هوش مصنوعی
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-400">
                <Shield className="h-4 w-4" />
                امنیت پیشرفته
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 dark:text-green-300">
              <p>
                کلید API به صورت امن در سرور ذخیره شده و هیچگاه به مرورگر ارسال نمی‌شود.
                تمام درخواست‌ها از طریق Edge Function پردازش می‌شوند.
              </p>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                وضعیت Perplexity API
              </CardTitle>
              <CardDescription>
                کلید API از طریق Supabase Secrets مدیریت می‌شود
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {connectionStatus === 'unknown' && isTestingConnection && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">در حال بررسی...</span>
                    </>
                  )}
                  {connectionStatus === 'success' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        اتصال برقرار
                      </Badge>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        خطا در اتصال
                      </Badge>
                    </>
                  )}
                  {connectionStatus === 'not_configured' && (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        پیکربندی نشده
                      </Badge>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      در حال تست...
                    </>
                  ) : (
                    'تست اتصال'
                  )}
                </Button>
              </div>

              {connectionStatus === 'not_configured' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium mb-1">راهنمای پیکربندی:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>به داشبورد Supabase بروید</li>
                    <li>به بخش Edge Functions → Secrets بروید</li>
                    <li>کلید PERPLEXITY_API_KEY را اضافه کنید</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle>قابلیت‌های دردسترس</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">خلاصه‌سازی هوشمند</h4>
                  <p className="text-sm text-muted-foreground">
                    خلاصه‌سازی کتاب‌ها با جزئیات قابل تنظیم
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">تولید مایندمپ</h4>
                  <p className="text-sm text-muted-foreground">
                    ساخت مایندمپ‌های تعاملی از محتوای کتاب‌ها
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            تمام
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
