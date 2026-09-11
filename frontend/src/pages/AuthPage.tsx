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
import { Brain, Loader2, Eye, EyeOff, AlertCircle, Users, User, Phone, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiLogin, apiSubUserLogin, BACKEND_URL } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { refreshAuth, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'owner' | 'subuser' | 'phone'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

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

  // ورود Owner
  const onOwnerSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await apiLogin(data.email, data.password);

    if (result.success) {
      setSuccess('ورود موفقیت‌آمیز! در حال انتقال...');
      await refreshAuth();
      toast({ title: 'خوش آمدید', description: 'با موفقیت وارد شدید' });
      setTimeout(() => navigate('/'), 500);
    } else {
      setError(result.error || 'خطا در ورود');
    }

    setIsLoading(false);
  };

  // ورود Sub-User
  const onSubUserSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const result = await apiSubUserLogin(data.email, data.password);

    if (result.success) {
      setSuccess('ورود موفقیت‌آمیز! در حال انتقال...');
      await refreshAuth();
      toast({ title: 'خوش آمدید', description: `ورود موفق به عنوان ${result.user?.profile?.display_name || data.email}` });
      setTimeout(() => navigate('/'), 500);
    } else {
      setError(result.error || 'خطا در ورود');
    }

    setIsLoading(false);
  };

  // Send OTP to phone
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('شماره موبایل معتبر وارد کنید');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        toast({ title: 'کد ارسال شد', description: 'کد ۶ رقمی به شماره شما ارسال شد' });
      } else {
        setError(data.error || 'خطا در ارسال کد');
      }
    } catch {
      setError('خطا در اتصال به سرور');
    }
    setIsLoading(false);
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setError('کد تأیید را وارد کنید');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('mora_access_token', data.token);
        if (data.refreshToken) localStorage.setItem('mora_refresh_token', data.refreshToken);
        if (data.user) localStorage.setItem('mora_user', JSON.stringify(data.user));
        await refreshAuth();
        toast({ title: 'خوش آمدید', description: 'با موفقیت وارد شدید' });
        setTimeout(() => navigate('/'), 400);
      } else {
        setError(data.error || 'کد اشتباه است');
      }
    } catch {
      setError('خطا در اتصال به سرور');
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
        <Card className="auth-card border-0 overflow-hidden">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-lg font-semibold">
              ورود به سیستم
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              روش ورود را انتخاب کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            {/* Tabs برای انتخاب نوع کاربر */}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'owner' | 'subuser' | 'phone'); setError(''); setSuccess(''); }} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/40 backdrop-blur-sm border border-border/30 rounded-xl p-1">
                <TabsTrigger value="owner" className="flex items-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <User className="h-3.5 w-3.5" />
                  مالک
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Phone className="h-3.5 w-3.5" />
                  موبایل
                </TabsTrigger>
                <TabsTrigger value="subuser" className="flex items-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  <Users className="h-3.5 w-3.5" />
                  فرعی
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

              {/* فرم ورود با موبایل */}
              <TabsContent value="phone">
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phone-number">شماره موبایل</Label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone-number"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="09123456789"
                            className="pr-10 text-left"
                            dir="ltr"
                            disabled={isLoading}
                            maxLength={11}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">کد تأیید به این شماره ارسال می‌شود</p>
                      </div>

                      {error && activeTab === 'phone' && (
                        <Alert className="border-destructive/30 bg-destructive/10 py-2">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          <AlertDescription className="text-destructive text-xs">{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="button"
                        className="w-full h-11 rounded-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.01]"
                        onClick={handleSendOtp}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Phone className="ml-2 h-4 w-4" />}
                        ارسال کد تأیید
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-1 py-2">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                        <p className="text-sm font-medium">کد ارسال شد</p>
                        <p className="text-xs text-muted-foreground">
                          کد ۶ رقمی به <span className="font-mono text-foreground">{phoneNumber}</span> ارسال شد
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="otp-code">کد تأیید</Label>
                        <Input
                          id="otp-code"
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="کد ۶ رقمی"
                          className="text-center text-xl tracking-[0.5em] font-mono h-12"
                          dir="ltr"
                          disabled={isLoading}
                          maxLength={6}
                        />
                      </div>

                      {error && activeTab === 'phone' && (
                        <Alert className="border-destructive/30 bg-destructive/10 py-2">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          <AlertDescription className="text-destructive text-xs">{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="button"
                        className="w-full h-11 rounded-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otpCode.length < 4}
                      >
                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
                        تأیید و ورود
                      </Button>

                      <button
                        type="button"
                        className="w-full text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                        onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                      >
                        ویرایش شماره
                      </button>
                    </>
                  )}
                </div>
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
