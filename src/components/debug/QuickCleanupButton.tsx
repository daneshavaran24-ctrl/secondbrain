import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { executeAdminCleanup, displayCleanupResults, type CleanupResult } from '@/utils/adminCleanupHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function QuickCleanupButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);

  const handleCleanup = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResult(null);
    
    try {
      toast.info('شروع پاکسازی داده‌های تستی...', {
        description: 'لطفاً صبر کنید، این عمل ممکن است چند ثانیه طول بکشد'
      });

      console.log('🚀 شروع فرآیند پاکسازی خودکار...');
      
      const cleanupResult = await executeAdminCleanup();
      setResult(cleanupResult);
      
      displayCleanupResults(cleanupResult);
      
      if (cleanupResult.success) {
        toast.success('پاکسازی با موفقیت انجام شد!', {
          description: 'تمام داده‌های تستی پاک شدند. صفحه در حال بازسازی...'
        });
        
        // Reload page after 2 seconds to show clean dashboard
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('خطا در پاکسازی', {
          description: cleanupResult.message
        });
      }
    } catch (error) {
      console.error('خطا در پاکسازی:', error);
      toast.error('خطای غیرمنتظره', {
        description: 'خطا در اجرای پاکسازی. لطفاً دوباره امتحان کنید.'
      });
      setResult({
        success: false,
        message: 'خطای غیرمنتظره رخ داد',
        error: String(error)
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <AlertCircle className="h-5 w-5" />
          پاکسازی داده‌های تستی
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          این ابزار تمام داده‌های تستی را از localStorage و Supabase پاک می‌کند
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>هشدار:</strong> این عمل غیرقابل برگشت است و تمام داده‌های تستی پاک خواهد شد.
            فقط در محیط توسعه کار می‌کند.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleCleanup}
          disabled={isRunning}
          variant="destructive"
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال پاکسازی...
            </>
          ) : (
            <>
              <Trash2 className="ml-2 h-4 w-4" />
              شروع پاکسازی
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? 
            "border-green-200 bg-green-50/50" : 
            "border-red-200 bg-red-50/50"
          }>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className={result.success ? "text-green-800" : "text-red-800"}>
                  <strong>{result.success ? '✅ موفق' : '❌ ناموفق'}:</strong> {result.message}
                </p>
                
                {result.details && (
                  <div className="text-sm text-muted-foreground">
                    <p>📊 localStorage پاک شده: {result.details.localStorageItemsRemoved} آیتم</p>
                    <p>🗄️ Supabase پاک شده: {result.details.supabaseRecordsRemoved} رکورد</p>
                    <p>📋 جداول: {result.details.tablesCleared.join(', ') || 'هیچ'}</p>
                  </div>
                )}
                
                {result.error && (
                  <p className="text-red-700 text-sm">
                    <strong>خطا:</strong> {result.error}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}