import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SeedResult {
  success: boolean;
  message: string;
  created: {
    company: any;
    organization: any;
    profile: any;
  };
  errors: string[];
}

export function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('لطفاً ابتدا وارد سیستم شوید');
        return;
      }

      const response = await supabase.functions.invoke('seed-database', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const seedResult = response.data as SeedResult;
      setResult(seedResult);

      if (seedResult.success) {
        toast.success('ساختار اولیه دیتابیس با موفقیت ایجاد شد');
        
        // ذخیره شرکت و سازمان پیش‌فرض در localStorage
        if (seedResult.created.company) {
          localStorage.setItem('main_company', JSON.stringify(seedResult.created.company));
        }
        if (seedResult.created.organization) {
          localStorage.setItem('main_organization', JSON.stringify(seedResult.created.organization));
        }

        // رفرش صفحه بعد از 2 ثانیه
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('برخی خطاها رخ داد');
      }
    } catch (error: any) {
      console.error('خطا در seed کردن دیتابیس:', error);
      toast.error(`خطا: ${error.message}`);
      setResult({
        success: false,
        message: error.message,
        created: { company: null, organization: null, profile: null },
        errors: [error.message],
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          راه‌اندازی اولیه دیتابیس
        </CardTitle>
        <CardDescription>
          ایجاد ساختار و داده‌های پیش‌فرض دیتابیس
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>این ابزار موارد زیر را ایجاد می‌کند:</p>
          <ul className="list-disc list-inside space-y-1 mr-4">
            <li>پروفایل کاربری</li>
            <li>شرکت پیش‌فرض (شرکت شماره یک)</li>
            <li>سازمان پیش‌فرض (سازمان شماره یک)</li>
          </ul>
        </div>

        {result && (
          <Alert variant={result.success && result.errors.length === 0 ? "default" : "destructive"}>
            {result.success && result.errors.length === 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{result.message}</p>
                {result.errors.length > 0 && (
                  <div className="text-xs space-y-1">
                    {result.errors.map((error, index) => (
                      <p key={index}>• {error}</p>
                    ))}
                  </div>
                )}
                {result.created.company && (
                  <p className="text-xs">✓ شرکت: {result.created.company.company_name}</p>
                )}
                {result.created.organization && (
                  <p className="text-xs">✓ سازمان: {result.created.organization.name}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSeed}
          disabled={isSeeding}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال راه‌اندازی...
            </>
          ) : (
            <>
              <Database className="ml-2 h-4 w-4" />
              راه‌اندازی دیتابیس
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
