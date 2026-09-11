import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, LogOut, Shield } from "lucide-react";
import { format } from "date-fns-jalali";

export function SecuritySection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      toast.error('رمز عبور جدید و تأیید آن یکسان نیستند');
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('رمز عبور باید حداقل 8 کاراکتر باشد');
      return;
    }

    // Password strength validation
    if (!/[A-Za-z]/.test(passwords.new)) {
      toast.error('رمز عبور باید حداقل یک حرف داشته باشد');
      return;
    }

    if (!/[0-9]/.test(passwords.new)) {
      toast.error('رمز عبور باید حداقل یک عدد داشته باشد');
      return;
    }

    try {
      setLoading(true);

      // Supabase's updateUser validates the active session automatically
      // No need to re-authenticate with signInWithPassword - the user is already logged in
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (updateError) {
        // Handle specific error cases
        if (updateError.message.includes('session') || updateError.message.includes('refresh')) {
          toast.error('جلسه شما منقضی شده است. لطفاً دوباره وارد شوید');
          return;
        }
        throw updateError;
      }

      // ثبت در audit log
      await supabase.from('auth_audit').insert({
        actor_id: user?.id,
        actor_type: 'user',
        action: 'password_changed',
        details: { changed_at: new Date().toISOString() }
      });

      toast.success('رمز عبور با موفقیت تغییر کرد');
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error('خطا در تغییر رمز عبور: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('از همه دستگاه‌ها خارج شدید');
    } catch (error: any) {
      toast.error('خطا در خروج: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* تغییر رمز عبور */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغییر رمز عبور
          </CardTitle>
          <CardDescription>
            برای امنیت بیشتر، رمز عبور قوی انتخاب کنید (حداقل 8 کاراکتر، شامل حرف و عدد)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new">رمز عبور جدید</Label>
              <Input
                id="new"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                placeholder="رمز عبور جدید (حداقل 8 کاراکتر، شامل حرف و عدد)"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">تأیید رمز عبور جدید</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="رمز عبور جدید را مجدداً وارد کنید"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              تغییر رمز عبور
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* اطلاعات امنیتی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            اطلاعات امنیتی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">ایمیل حساب</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">تاریخ ایجاد حساب</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at 
                  ? format(new Date(user.created_at), 'yyyy/MM/dd - HH:mm')
                  : 'نامشخص'
                }
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleSignOutAllDevices}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج از همه دستگاه‌ها
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              با این کار از همه دستگاه‌های دیگر خارج خواهید شد
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
