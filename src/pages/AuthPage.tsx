import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate, Link } from "react-router-dom";
import { Brain, Loader2, Eye, EyeOff, AlertCircle, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { localSignIn } from "@/utils/localAuth";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { refreshAuth, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'owner' | 'subuser'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const ownerForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const subUserForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    document.title = "ورود به سیستم - Mora";
    
    // اگر کاربر قبلاً احراز هویت شده، هدایت به صفحه اصلی
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // ورود Owner (Supabase)
  const onOwnerSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInData?.user && !signInError) {
        console.log('✅ ورود Owner موفق');
        setSuccess('ورود موفقیت‌آمیز! در حال انتقال...');
        await refreshAuth();
        toast({
          title: "خوش آمدید",
          description: "با موفقیت وارد شدید",
        });
        setTimeout(() => {
          navigate('/');
        }, 500);
        return;
      }

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('ایمیل یا رمز عبور اشتباه است');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('لطفاً ابتدا ایمیل خود را تأیید کنید');
        } else {
          setError(`خطا در ورود: ${signInError.message}`);
        }
      }
    } catch (error: any) {
      console.error('خطا در ورود Owner:', error);
      setError('خطا در اتصال به سیستم');
    }

    setIsLoading(false);
  };

  // ورود Sub-User (Edge Function)
  const onSubUserSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 تلاش برای ورود Sub-User:', data.email);

      const { data: response, error: invokeError } = await supabase.functions.invoke('sub-user-login', {
        body: {
          email: data.email,
          password: data.password
        }
      });

      if (invokeError) {
        console.error('❌ خطا در فراخوانی Edge Function:', invokeError);
        setError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید');
        setIsLoading(false);
        return;
      }

      if (response?.error) {
        console.error('❌ خطا از سمت سرور:', response.error);
        setError(response.error);
        setIsLoading(false);
        return;
      }

      if (response?.success && response?.token) {
        console.log('✅ ورود Sub-User موفق');
        
        // ذخیره اطلاعات Sub-User در localStorage
        localStorage.setItem('subUserAuth', JSON.stringify({
          token: response.token,
          user: response.user,
          permissions: response.permissions,
          expiresAt: response.expiresAt
        }));

        setSuccess('ورود موفقیت‌آمیز! در حال انتقال...');
        
        toast({
          title: "خوش آمدید",
          description: `ورود موفق به عنوان ${response.user.name}`,
        });

        // ریفرش احراز هویت
        await refreshAuth();

        setTimeout(() => {
          navigate('/');
        }, 500);
        return;
      }

      setError('خطای نامشخص در ورود');
    } catch (error: any) {
      console.error('💥 خطای غیرمنتظره:', error);
      setError('خطا در اتصال به سیستم');
    }

    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* Aurora background — futuristic radial mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.22),transparent_55%),radial-gradient(ellipse_at_center,hsl(265_80%_60%/0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background))_85%)]" />
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-primary/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 -left-32 w-[520px] h-[520px] rounded-full bg-accent/15 blur-[140px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* لوگو و عنوان */}
        <div className="text-center space-y-3">
          <div className="inline-flex relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent blur-xl opacity-60" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl">
              <Brain className="h-9 w-9" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              مورا
            </h1>
            <p className="text-sm text-muted-foreground mt-1">دستیار هوشمند فارسی‌زبان شما</p>
          </div>
        </div>

        {/* کارت شیشه‌ای */}
        <Card className="border border-border/40 bg-card/40 backdrop-blur-2xl shadow-[0_8px_60px_-12px_hsl(var(--primary)/0.25)] rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-semibold">
              ورود به حساب
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              یکی از روش‌های ورود را انتخاب کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Tabs برای انتخاب نوع کاربر */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'owner' | 'subuser')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/40 backdrop-blur-sm border border-border/30 rounded-xl p-1">
                <TabsTrigger value="owner" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <User className="h-4 w-4" />
                  مالک
                </TabsTrigger>
                <TabsTrigger value="subuser" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Users className="h-4 w-4" />
                  کاربر فرعی
                </TabsTrigger>
              </TabsList>

              {/* فرم ورود Owner */}
              <TabsContent value="owner">
                <form onSubmit={ownerForm.handleSubmit(onOwnerSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">ایمیل</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      {...ownerForm.register('email')}
                      placeholder="آدرس ایمیل"
                      className="text-left"
                      dir="ltr"
                      disabled={isLoading}
                    />
                    {ownerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{ownerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-password">رمز عبور</Label>
                    <div className="relative">
                      <Input
                        id="owner-password"
                        type={showPassword ? "text" : "password"}
                        {...ownerForm.register('password')}
                        placeholder="رمز عبور"
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
                    {ownerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{ownerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {error && activeTab === 'owner' && (
                    <Alert className="border-destructive/30 bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && activeTab === 'owner' && (
                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                      <AlertCircle className="h-4 w-4 text-emerald-500" />
                      <AlertDescription className="text-emerald-500">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.01]" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    ورود
                  </Button>

                  <div className="text-center pt-4 border-t border-border/30">
                    <p className="text-sm text-muted-foreground">
                      حساب کاربری ندارید؟{' '}
                      <Link 
                        to="/auth/signup" 
                        className="text-primary hover:text-accent font-medium hover:underline transition-colors"
                      >
                        ثبت‌نام کنید
                      </Link>
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* فرم ورود Sub-User */}
              <TabsContent value="subuser">
                <form onSubmit={subUserForm.handleSubmit(onSubUserSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subuser-email">ایمیل</Label>
                    <Input
                      id="subuser-email"
                      type="email"
                      {...subUserForm.register('email')}
                      placeholder="آدرس ایمیل"
                      className="text-left"
                      dir="ltr"
                      disabled={isLoading}
                    />
                    {subUserForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{subUserForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subuser-password">رمز عبور</Label>
                    <div className="relative">
                      <Input
                        id="subuser-password"
                        type={showPassword ? "text" : "password"}
                        {...subUserForm.register('password')}
                        placeholder="رمز عبور"
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
                    {subUserForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{subUserForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  {error && activeTab === 'subuser' && (
                    <Alert className="border-destructive/30 bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && activeTab === 'subuser' && (
                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                      <AlertCircle className="h-4 w-4 text-emerald-500" />
                      <AlertDescription className="text-emerald-500">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl bg-gradient-to-br from-accent to-primary hover:opacity-90 text-primary-foreground shadow-lg shadow-accent/25 transition-all hover:shadow-accent/40 hover:scale-[1.01]" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    ورود کاربر فرعی
                  </Button>

                  <div className="text-center pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      کاربران فرعی توسط مالک سیستم ایجاد می‌شوند
                    </p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
