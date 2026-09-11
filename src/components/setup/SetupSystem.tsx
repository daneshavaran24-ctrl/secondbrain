import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ADMIN_CREDENTIALS } from '@/utils/createAdminUser';
import { signInWithoutEmailConfirmation, signUpWithoutEmailConfirmation } from '@/utils/auth-bypass';
import { forceCreateAdminUser, checkCurrentUser } from '@/utils/forceCreateAdmin';

interface SetupSystemProps {
  onSetupComplete: () => void;
}

export function SetupSystem({ onSetupComplete }: SetupSystemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [adminCredentials, setAdminCredentials] = useState({
    email: ADMIN_CREDENTIALS.email,
    password: ADMIN_CREDENTIALS.password,
    mobile: ADMIN_CREDENTIALS.mobile
  });

  const checkSystemSetup = async () => {
    try {
      console.log('🔍 بررسی وضعیت سیستم...');
      
      // بررسی کاربر فعلی
      const { user } = await checkCurrentUser();
      if (user) {
        console.log('✅ کاربر وارد شده موجود است');
        setSetupStatus('success');
        setMessage('سیستم آماده است');
        onSetupComplete();
        return true;
      }

      // تلاش برای ورود با اطلاعات پیش‌فرض ادمین
      const { data, error } = await signInWithoutEmailConfirmation(
        ADMIN_CREDENTIALS.email,
        ADMIN_CREDENTIALS.password
      );

      if (data?.user) {
        console.log('✅ ورود با اطلاعات پیش‌فرض موفق');
        setSetupStatus('success');
        setMessage('سیستم آماده است');
        onSetupComplete();
        return true;
      }
      
      console.log('⚠️ نیاز به راه‌اندازی سیستم');
      return false;
    } catch (error) {
      console.log('❌ خطا در بررسی سیستم:', error);
      return false;
    }
  };

  useEffect(() => {
    checkSystemSetup();
  }, []);

  const handleSetupSystem = async () => {
    setIsLoading(true);
    setMessage('در حال راه‌اندازی سیستم...');

    try {
      console.log('🚀 شروع راه‌اندازی سیستم با تابع اجباری...');
      
      // استفاده از تابع ایجاد اجباری کاربر ادمین
      const result = await forceCreateAdminUser();
      
      if (result.success && result.user) {
        console.log('✅ کاربر ادمین با موفقیت ایجاد شد');
        setSetupStatus('success');
        setMessage('سیستم با موفقیت راه‌اندازی شد!');
        
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } else {
        throw new Error(result.error || 'خطا در ایجاد کاربر ادمین');
      }

    } catch (error: any) {
      console.error('❌ خطا در راه‌اندازی:', error);
      setSetupStatus('error');
      setMessage(`خطا در راه‌اندازی: ${error.message}`);
    }

    setIsLoading(false);
  };

  if (setupStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">سیستم آماده است!</CardTitle>
            <CardDescription>
              در حال انتقال به داشبورد...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-800">راه‌اندازی سیستم</CardTitle>
          <CardDescription>
            لطفاً اطلاعات کاربر ادمین را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل ادمین</Label>
            <Input
              id="email"
              type="email"
              value={adminCredentials.email}
              onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
              placeholder="admin@example.com"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              type="password"
              value={adminCredentials.password}
              onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="حداقل 6 کاراکتر"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">شماره موبایل</Label>
            <Input
              id="mobile"
              type="tel"
              value={adminCredentials.mobile}
              onChange={(e) => setAdminCredentials(prev => ({ ...prev, mobile: e.target.value }))}
              placeholder="09123456789"
              dir="ltr"
            />
          </div>

          {message && (
            <Alert className={setupStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
              {setupStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              )}
              <AlertDescription className={setupStatus === 'error' ? 'text-red-700' : 'text-blue-700'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleSetupSystem} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              راه‌اندازی سیستم
            </Button>
            
            <Button 
              onClick={async () => {
                setIsLoading(true);
                setMessage('در حال ایجاد مجدد کاربر ادمین...');
                
                try {
                  const result = await forceCreateAdminUser();
                  if (result.success) {
                    setMessage('کاربر ادمین با موفقیت ایجاد شد!');
                    setTimeout(() => onSetupComplete(), 1500);
                  } else {
                    setMessage(`خطا: ${result.error}`);
                  }
                } catch (error: any) {
                  setMessage(`خطا: ${error.message}`);
                }
                
                setIsLoading(false);
              }}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ایجاد مجدد کاربر ادمین
            </Button>
          </div>

          <div className="text-sm text-gray-600 text-center">
            <p className="font-semibold mb-1">اطلاعات پیش‌فرض ادمین:</p>
            <p>ایمیل: {ADMIN_CREDENTIALS.email}</p>
            <p>رمز عبور: {ADMIN_CREDENTIALS.password}</p>
            <p>موبایل: {ADMIN_CREDENTIALS.mobile}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
