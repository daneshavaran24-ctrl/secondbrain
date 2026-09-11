import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getActiveUserId } from '@/config/mockUser';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getPersonalInfo, upsertPersonalInfo, type PersonalInfo } from '@/services/resumeService';
import { Loader2, Save, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function ResumePersonalInfo() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PersonalInfo>>({
    full_name: '',
    birth_date: '',
    bio: '',
    avatar_url: '',
    social_links: {
      instagram: '',
      telegram: '',
      x: '',
      linkedin: ''
    }
  });

  useEffect(() => {
    loadPersonalInfo();
  }, []);

  const loadPersonalInfo = async () => {
    setLoading(true);
    try {
      const data = await getPersonalInfo(getActiveUserId());
      if (data) {
        setFormData(data);
      }
    } catch (error: any) {
      console.error('Error loading personal info:', error);
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertPersonalInfo(getActiveUserId(), formData);
      toast.success('اطلاعات با موفقیت ذخیره شد');
    } catch (error: any) {
      console.error('Error saving personal info:', error);
      toast.error('خطا در ذخیره اطلاعات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            اطلاعات شخصی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label>عکس پروفایل</Label>
              <Input
                type="text"
                placeholder="آدرس URL عکس"
                value={formData.avatar_url || ''}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="نام کامل خود را وارد کنید"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">تاریخ تولد</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">بیوگرافی کوتاه</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="توضیحات کوتاهی در مورد خودتان بنویسید..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label>لینک‌های اجتماعی</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">اینستاگرام</Label>
                <Input
                  id="instagram"
                  value={formData.social_links?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value }
                  })}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram">تلگرام</Label>
                <Input
                  id="telegram"
                  value={formData.social_links?.telegram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, telegram: e.target.value }
                  })}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="x">X (Twitter)</Label>
                <Input
                  id="x"
                  value={formData.social_links?.x || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, x: e.target.value }
                  })}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.social_links?.linkedin || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value }
                  })}
                  placeholder="profile-url"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  ذخیره تغییرات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}