import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { companyService, CompanyProfile } from '@/services/companyService';
import { toast } from 'sonner';
import { Edit2, Save, X } from 'lucide-react';

interface ProfileSectionProps {
  companyId: string;
}

export function CompanyProfileSection({ companyId }: ProfileSectionProps) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});

  useEffect(() => {
    loadProfile();
  }, [companyId]);

  const loadProfile = async () => {
    setIsLoading(true);
    let data = await companyService.getProfile(companyId);
    
    if (!data) {
      data = await companyService.createProfile(companyId);
    }

    setProfile(data);
    setFormData(data || {});
    setIsLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(profile || {});
  };

  const handleSave = async () => {
    const success = await companyService.updateProfile(companyId, formData);
    
    if (success) {
      toast.success('اطلاعات با موفقیت ذخیره شد');
      setIsEditing(false);
      loadProfile();
    } else {
      toast.error('خطا در ذخیره اطلاعات');
    }
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    const array = (formData[field as keyof CompanyProfile] as string[]) || [];
    const newArray = [...array];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleAddArrayItem = (field: string) => {
    const array = (formData[field as keyof CompanyProfile] as string[]) || [];
    setFormData({ ...formData, [field]: [...array, ''] });
  };

  const handleRemoveArrayItem = (field: string, index: number) => {
    const array = (formData[field as keyof CompanyProfile] as string[]) || [];
    setFormData({ ...formData, [field]: array.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>معرفی شرکت</CardTitle>
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline" size="sm" className="gap-2">
              <Edit2 className="w-4 h-4" />
              ویرایش
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                ذخیره
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2">
                <X className="w-4 h-4" />
                انصراف
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>چشم‌انداز</Label>
              {isEditing ? (
                <Textarea
                  value={formData.vision || ''}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="چشم‌انداز شرکت را وارد کنید"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile?.vision || 'چشم‌اندازی تعریف نشده است'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>ماموریت</Label>
              {isEditing ? (
                <Textarea
                  value={formData.mission || ''}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="ماموریت شرکت را وارد کنید"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile?.mission || 'ماموریتی تعریف نشده است'}
                </p>
              )}
            </div>
          </div>

          {/* Values */}
          <div className="space-y-2">
            <Label>ارزش‌های سازمانی</Label>
            {isEditing ? (
              <div className="space-y-2">
                {(formData.values || []).map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={value}
                      onChange={(e) => handleArrayChange('values', index, e.target.value)}
                      placeholder="ارزش سازمانی"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveArrayItem('values', index)}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => handleAddArrayItem('values')}>
                  افزودن ارزش
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.values && profile.values.length > 0 ? (
                  profile.values.map((value, index) => (
                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {value}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">ارزش‌های سازمانی تعریف نشده است</p>
                )}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>تاریخ تاسیس</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.established_date || ''}
                  onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile?.established_date || 'تعریف نشده'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>تعداد کارکنان</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.employee_count || ''}
                  onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) })}
                  placeholder="0"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile?.employee_count || 'تعریف نشده'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>درآمد سالانه (تومان)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.annual_revenue || ''}
                  onChange={(e) => setFormData({ ...formData, annual_revenue: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile?.annual_revenue
                    ? profile.annual_revenue.toLocaleString('fa-IR')
                    : 'تعریف نشده'}
                </p>
              )}
            </div>
          </div>

          {/* Target Customers */}
          <div className="space-y-2">
            <Label>مشتریان هدف</Label>
            {isEditing ? (
              <Textarea
                value={formData.target_customers || ''}
                onChange={(e) => setFormData({ ...formData, target_customers: e.target.value })}
                placeholder="مشتریان هدف خود را توضیح دهید"
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {profile?.target_customers || 'تعریف نشده'}
              </p>
            )}
          </div>

          {/* Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اهداف کوتاه‌مدت</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {(formData.short_term_goals || []).map((goal, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={goal}
                        onChange={(e) => handleArrayChange('short_term_goals', index, e.target.value)}
                        placeholder="هدف کوتاه‌مدت"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveArrayItem('short_term_goals', index)}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddArrayItem('short_term_goals')}
                  >
                    افزودن هدف
                  </Button>
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {profile?.short_term_goals && profile.short_term_goals.length > 0 ? (
                    profile.short_term_goals.map((goal, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {goal}
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">تعریف نشده</p>
                  )}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label>اهداف بلندمدت</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {(formData.long_term_goals || []).map((goal, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={goal}
                        onChange={(e) => handleArrayChange('long_term_goals', index, e.target.value)}
                        placeholder="هدف بلندمدت"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveArrayItem('long_term_goals', index)}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddArrayItem('long_term_goals')}
                  >
                    افزودن هدف
                  </Button>
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {profile?.long_term_goals && profile.long_term_goals.length > 0 ? (
                    profile.long_term_goals.map((goal, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {goal}
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">تعریف نشده</p>
                  )}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
