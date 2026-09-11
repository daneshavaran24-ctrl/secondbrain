import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { salesService, ICPProfile } from '@/services/salesService';
import { toast } from 'sonner';

interface ICPFormProps {
  organizationId: string;
  profile?: ICPProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export function ICPForm({ organizationId, profile, onClose, onSuccess }: ICPFormProps) {
  const [formData, setFormData] = useState({
    profile_name: profile?.profile_name || '',
    industry: profile?.industry || '',
    company_size: profile?.company_size || '',
    annual_revenue_range: profile?.annual_revenue_range || '',
    decision_makers: profile?.decision_makers?.join(', ') || '',
    pain_points: profile?.pain_points?.join(', ') || '',
    buying_triggers: profile?.buying_triggers?.join(', ') || '',
    preferred_channels: profile?.preferred_channels?.join(', ') || '',
    notes: profile?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        organization_id: organizationId,
        profile_name: formData.profile_name,
        industry: formData.industry || null,
        company_size: formData.company_size || null,
        annual_revenue_range: formData.annual_revenue_range || null,
        decision_makers: formData.decision_makers ? formData.decision_makers.split(',').map(s => s.trim()) : [],
        pain_points: formData.pain_points ? formData.pain_points.split(',').map(s => s.trim()) : [],
        buying_triggers: formData.buying_triggers ? formData.buying_triggers.split(',').map(s => s.trim()) : [],
        preferred_channels: formData.preferred_channels ? formData.preferred_channels.split(',').map(s => s.trim()) : [],
        notes: formData.notes || null,
      };

      if (profile) {
        await salesService.updateICPProfile(profile.id, data);
        toast.success('پروفایل ICP به‌روزرسانی شد');
      } else {
        await salesService.createICPProfile(data);
        toast.success('پروفایل ICP ایجاد شد');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving ICP profile:', error);
      toast.error('خطا در ذخیره پروفایل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h3 className="text-lg font-semibold">
            {profile ? 'ویرایش پروفایل ICP' : 'افزودن پروفایل ICP جدید'}
          </h3>
          <p className="text-sm text-muted-foreground">مشخصات مشتری ایده‌آل خود را تعریف کنید</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profile_name">نام پروفایل *</Label>
              <Input
                id="profile_name"
                value={formData.profile_name}
                onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                placeholder="مثال: شرکت‌های فناوری میان‌سایز"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="industry">صنعت</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="مثال: فناوری، پزشکی"
                />
              </div>

              <div>
                <Label htmlFor="company_size">اندازه شرکت</Label>
                <Input
                  id="company_size"
                  value={formData.company_size}
                  onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                  placeholder="مثال: 50-200 نفر"
                />
              </div>

              <div>
                <Label htmlFor="annual_revenue_range">بازه درآمد سالانه</Label>
                <Input
                  id="annual_revenue_range"
                  value={formData.annual_revenue_range}
                  onChange={(e) => setFormData({ ...formData, annual_revenue_range: e.target.value })}
                  placeholder="مثال: 10-50 میلیارد"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="decision_makers">تصمیم‌گیرندگان (جدا شده با کاما)</Label>
              <Input
                id="decision_makers"
                value={formData.decision_makers}
                onChange={(e) => setFormData({ ...formData, decision_makers: e.target.value })}
                placeholder="مثال: CTO, CEO, مدیر فنی"
              />
            </div>

            <div>
              <Label htmlFor="pain_points">نقاط درد (جدا شده با کاما)</Label>
              <Textarea
                id="pain_points"
                value={formData.pain_points}
                onChange={(e) => setFormData({ ...formData, pain_points: e.target.value })}
                placeholder="مثال: کمبود نیروی متخصص, هزینه‌های بالا, عدم یکپارچگی سیستم‌ها"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="buying_triggers">محرک‌های خرید (جدا شده با کاما)</Label>
              <Textarea
                id="buying_triggers"
                value={formData.buying_triggers}
                onChange={(e) => setFormData({ ...formData, buying_triggers: e.target.value })}
                placeholder="مثال: رشد سریع تیم, نیاز به اتوماسیون, بودجه جدید"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="preferred_channels">کانال‌های ترجیحی (جدا شده با کاما)</Label>
              <Input
                id="preferred_channels"
                value={formData.preferred_channels}
                onChange={(e) => setFormData({ ...formData, preferred_channels: e.target.value })}
                placeholder="مثال: LinkedIn, ایمیل, رویدادها"
              />
            </div>

            <div>
              <Label htmlFor="notes">یادداشت‌ها</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="توضیحات اضافی..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 mt-6">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            لغو
          </Button>
        </div>
      </form>
    </div>
  );
}
