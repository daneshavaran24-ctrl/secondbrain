import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export default function CompanySettingsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) {
      toast.error('شناسه شرکت نامعتبر است');
      navigate('/companies');
      return;
    }

    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('لطفاً وارد شوید');
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('business_companies')
      .select('*')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      toast.error('شرکت یافت نشد');
      navigate('/companies');
      return;
    }

    setCompany(data);
    setFormData(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.company_name) {
      toast.error('نام شرکت الزامی است');
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('business_companies')
      .update(formData)
      .eq('id', companyId!);

    setIsSaving(false);

    if (error) {
      toast.error('خطا در ذخیره اطلاعات');
      console.error(error);
      return;
    }

    toast.success('اطلاعات با موفقیت ذخیره شد');
    navigate(`/company/${companyId}`);
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این شرکت اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
      return;
    }

    const { error } = await supabase.from('business_companies').delete().eq('id', companyId!);

    if (error) {
      toast.error('خطا در حذف شرکت');
      console.error(error);
      return;
    }

    toast.success('شرکت با موفقیت حذف شد');
    navigate('/companies');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">تنظیمات شرکت</h1>
          <Button variant="outline" onClick={() => navigate(`/company/${companyId}`)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            بازگشت
          </Button>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>نام شرکت *</Label>
              <Input
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="نام شرکت"
              />
            </div>

            <div className="space-y-2">
              <Label>صنعت</Label>
              <Input
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="صنعت فعالیت"
              />
            </div>

            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات کوتاه درباره شرکت"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>لوگو (URL)</Label>
              <Input
                value={formData.logo_url || ''}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات تماس</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وب‌سایت</Label>
                <Input
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>ایمیل</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label>تلفن</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="021-12345678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>آدرس</Label>
              <Textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="آدرس کامل شرکت"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            حذف شرکت
          </Button>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </div>
    </div>
  );
}
