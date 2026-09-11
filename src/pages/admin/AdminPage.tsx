import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import UserManagement from '../../components/auth/admin/UserManagement';
import { DataCleanupTool } from '../../components/admin/DataCleanupTool';
import { DatabaseSeeder } from '../../components/debug/DatabaseSeeder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { TabsListScrollable } from '../../components/ui/tabs-list-scrollable';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { LocationPicker } from '../../components/meetings/LocationPicker';
import { useIsMobile } from '../../hooks/use-mobile';
import { cn } from '../../lib/utils';

const AdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }
        
        // Check if user has admin role
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (userRole?.system_role !== 'admin') {
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Navigate happens in useEffect
  }

  return (
    <div className={cn("container mx-auto", isMobile ? "py-4 px-3" : "py-8 px-4")}>
      <h1 className={cn("font-bold mb-6", isMobile ? "text-xl" : "text-3xl")}>پنل مدیریت</h1>
      
      <Tabs defaultValue="users" className="w-full">
        {isMobile ? (
          <TabsListScrollable className="mb-6">
            <TabsTrigger value="users">کاربران</TabsTrigger>
            <TabsTrigger value="seed">دیتابیس</TabsTrigger>
            <TabsTrigger value="cleanup">پاکسازی</TabsTrigger>
            <TabsTrigger value="audit">ممیزی</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsListScrollable>
        ) : (
          <TabsList className="mb-6">
            <TabsTrigger value="users">مدیریت کاربران</TabsTrigger>
            <TabsTrigger value="seed">راه‌اندازی دیتابیس</TabsTrigger>
            <TabsTrigger value="cleanup">پاکسازی داده‌ها</TabsTrigger>
            <TabsTrigger value="audit">گزارش‌های ممیزی</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات سیستم</TabsTrigger>
          </TabsList>
        )}
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="seed">
          <DatabaseSeeder />
        </TabsContent>
        
        <TabsContent value="cleanup">
          <DataCleanupTool />
        </TabsContent>
        
        <TabsContent value="audit">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">گزارش‌های ممیزی</h2>
            <p className="text-muted-foreground">
              این بخش به زودی فعال خواهد شد. تاریخچه تمام اقدامات مدیریتی را نمایش می‌دهد.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="bg-card rounded-lg p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">تنظیمات سیستم</h2>
              <p className="text-muted-foreground mb-6">
                پیکربندی عمومی سیستم
              </p>
            </div>

            {/* Google Maps API Key Setting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تنظیمات Google Maps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="google-maps-key">کلید API گوگل مپ</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="google-maps-key"
                      type="password"
                      placeholder="AIza..."
                      defaultValue={typeof window !== 'undefined' ? localStorage.getItem('google_maps_api_key') || '' : ''}
                    />
                    <Button onClick={() => {
                      const input = document.getElementById('google-maps-key') as HTMLInputElement;
                      if (input.value) {
                        localStorage.setItem('google_maps_api_key', input.value);
                        toast.success('کلید API ذخیره شد');
                        window.location.reload();
                      }
                    }}>
                      ذخیره
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    برای دریافت کلید API به{' '}
                    <a 
                      href="https://console.cloud.google.com/google/maps-apis" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Cloud Console
                    </a>
                    {' '}مراجعه کنید.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Default Meeting Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">مکان پیش‌فرض جلسات</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationPicker
                  onChange={(loc) => {
                    if (loc) {
                      localStorage.setItem('default_meeting_location', JSON.stringify(loc));
                      toast.success('مکان پیش‌فرض ذخیره شد');
                    } else {
                      localStorage.removeItem('default_meeting_location');
                      toast.success('مکان پیش‌فرض پاک شد');
                    }
                  }}
                  value={
                    typeof window !== 'undefined' && localStorage.getItem('default_meeting_location')
                      ? JSON.parse(localStorage.getItem('default_meeting_location')!)
                      : undefined
                  }
                  placeholder="مکان پیش‌فرض برای جلسات جدید"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
