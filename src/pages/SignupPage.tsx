import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, Link } from "react-router-dom";
import { Brain, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const signupSchema = z.object({
  firstName: z.string()
    .min(2, 'نام باید حداقل 2 کاراکتر باشد')
    .max(50, 'نام نباید بیشتر از 50 کاراکتر باشد'),
  lastName: z.string()
    .min(2, 'نام خانوادگی باید حداقل 2 کاراکتر باشد')
    .max(50, 'نام خانوادگی نباید بیشتر از 50 کاراکتر باشد'),
  email: z.string()
    .email('ایمیل معتبر وارد کنید')
    .max(255, 'ایمیل نباید بیشتر از 255 کاراکتر باشد'),
  password: z.string()
    .min(8, 'رمز عبور باید حداقل 8 کاراکتر باشد')
    .regex(/[A-Z]/, 'رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد')
    .regex(/[a-z]/, 'رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد')
    .regex(/[0-9]/, 'رمز عبور باید حداقل یک عدد داشته باشد'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "رمز عبور و تأیید رمز عبور یکسان نیستند",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    document.title = "ثبت‌نام در سیستم - BrainForge";
    
    // اگر کاربر قبلاً احراز هویت شده، هدایت به صفحه اصلی
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // ثبت‌نام در Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            display_name: `${data.firstName} ${data.lastName}`
          }
        }
      });

      if (signUpError) {
        // بررسی خطاهای مختلف
        if (signUpError.message.includes('already registered')) {
          setError('این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید یا از ایمیل دیگری استفاده کنید.');
        } else if (signUpError.message.includes('invalid email')) {
          setError('فرمت ایمیل معتبر نیست. لطفاً یک ایمیل صحیح وارد کنید.');
        } else {
          setError(`خطا در ثبت‌نام: ${signUpError.message}`);
        }
        setIsLoading(false);
        return;
      }

      if (authData?.user) {
        // ثبت‌نام موفق
        console.log('✅ کاربر با موفقیت ثبت شد:', authData.user.id);
        
        // نمایش پیام موفقیت
        setSuccess('ثبت‌نام با موفقیت انجام شد! یک ایمیل تأیید برای شما ارسال شده است.');
        
        toast({
          title: "ثبت‌نام موفق",
          description: "لطفاً ایمیل خود را بررسی و حساب کاربری خود را تأیید کنید.",
          variant: "default",
        });

        // هدایت به صفحه لاگین بعد از 2 ثانیه
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error: any) {
      console.error('خطا در ثبت‌نام:', error);
      setError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* کارت اصلی ثبت‌نام */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                <Brain className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              ثبت‌نام در سیستم BrainForge
            </CardTitle>
            <CardDescription className="text-gray-600">
              ایجاد حساب کاربری به عنوان مالک (Owner)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* نام */}
              <div className="space-y-2">
                <Label htmlFor="firstName">نام</Label>
                <Input
                  id="firstName"
                  type="text"
                  {...form.register('firstName')}
                  placeholder="نام شما"
                  disabled={isLoading}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              {/* نام خانوادگی */}
              <div className="space-y-2">
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <Input
                  id="lastName"
                  type="text"
                  {...form.register('lastName')}
                  placeholder="نام خانوادگی شما"
                  disabled={isLoading}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                )}
              </div>

              {/* ایمیل */}
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="example@domain.com"
                  className="text-left"
                  dir="ltr"
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* رمز عبور */}
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register('password')}
                    placeholder="حداقل 8 کاراکتر"
                    className="text-left pr-3 pl-10"
                    dir="ltr"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  رمز عبور باید شامل: حروف بزرگ و کوچک انگلیسی، اعداد
                </p>
              </div>

              {/* تأیید رمز عبور */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأیید رمز عبور</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...form.register('confirmPassword')}
                    placeholder="رمز عبور را دوباره وارد کنید"
                    className="text-left pr-3 pl-10"
                    dir="ltr"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* پیام خطا */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* پیام موفقیت */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* دکمه ثبت‌نام */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ثبت‌نام به عنوان Owner
              </Button>

              {/* لینک به صفحه لاگین */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  قبلاً حساب کاربری دارید؟{' '}
                  <Link 
                    to="/auth" 
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    وارد شوید
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* اطلاعات تکمیلی */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  حساب Owner چیست؟
                </h3>
                <p className="text-sm text-blue-800">
                  با ثبت‌نام به عنوان Owner، می‌توانید تا 3 کاربر فرعی (Sub-User) با دسترسی‌های محدود ایجاد کنید و کنترل کامل بر سیستم خود داشته باشید.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
