import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Building2, Upload, X, Trash2, Save, CheckCircle, XCircle } from 'lucide-react';
import { organizationService, Organization } from '@/services/organizationService';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, 'نام سازمان باید حداقل 2 حرف باشد').max(100, 'نام سازمان خیلی طولانی است'),
  type: z.string().min(1, 'نوع سازمان را انتخاب کنید'),
  description: z.string().optional(),
  website: z.string().url('آدرس وب‌سایت معتبر نیست').optional().or(z.literal('')),
  email: z.string().email('ایمیل معتبر نیست').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const organizationTypes = [
  { value: 'company', label: 'شرکت' },
  { value: 'government', label: 'نهاد دولتی' },
  { value: 'ngo', label: 'NGO / خیریه' },
  { value: 'educational', label: 'آموزشی' },
  { value: 'chamber', label: 'اتاق بازرگانی' },
  { value: 'association', label: 'انجمن / اتحادیه' },
  { value: 'other', label: 'سایر' },
];

export default function OrganizationSettingsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      description: '',
      website: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    loadOrganization();
  }, [organizationId]);

  const loadOrganization = async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      const org = await organizationService.getOrganizationById(organizationId);
      
      if (!org) {
        toast({
          title: 'خطا',
          description: 'سازمان یافت نشد',
          variant: 'destructive',
        });
        navigate('/profile');
        return;
      }

      setOrganization(org);
      setLogoPreview(org.logo_url || null);
      setIsActive(org.is_active ?? true);

      form.reset({
        name: org.name,
        type: org.type,
        description: org.description || '',
        website: org.website || '',
        email: org.email || '',
        phone: org.phone || '',
        address: org.address || '',
      });
    } catch (error) {
      console.error('Error loading organization:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در بارگذاری اطلاعات به وجود آمد',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'خطا',
          description: 'حجم فایل باید کمتر از 2 مگابایت باشد',
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'خطا',
          description: 'فقط فایل‌های تصویری مجاز هستند',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = async () => {
    if (!organizationId) return;

    try {
      setIsDeletingLogo(true);
      await organizationService.deleteOrganizationLogo(organizationId);
      setLogoPreview(null);
      setLogoFile(null);
      
      toast({
        title: 'موفقیت',
        description: 'لوگو با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در حذف لوگو به وجود آمد',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!organizationId) return;

    try {
      setIsSubmitting(true);
      console.log('🔄 Starting organization update...', { organizationId, data });

      // به‌روزرسانی اطلاعات سازمان
      const success = await organizationService.updateOrganization(organizationId, {
        name: data.name,
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: data.address,
      });

      if (!success) {
        throw new Error('Failed to update organization details');
      }

      console.log('✅ Organization details updated successfully');

      // آپلود لوگو جدید در صورت انتخاب
      if (logoFile) {
        console.log('📤 Uploading new logo...');
        const logoUrl = await organizationService.uploadOrganizationLogo(organizationId, logoFile);
        
        if (logoUrl) {
          console.log('✅ Logo uploaded successfully:', logoUrl);
          setLogoPreview(logoUrl);
          setLogoFile(null);
        } else {
          console.error('❌ Logo upload failed');
        }
      }

      toast({
        title: 'موفقیت',
        description: 'تغییرات با موفقیت ذخیره شد',
      });

      organizationService.invalidateCache();
      await loadOrganization();
    } catch (error: any) {
      console.error('❌ Error updating organization:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      
      toast({
        title: 'خطا در ذخیره‌سازی',
        description: error?.message || 'مشکلی در به‌روزرسانی اطلاعات به وجود آمد. لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!organizationId) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: checked })
        .eq('id', organizationId);

      if (error) throw error;

      setIsActive(checked);
      organizationService.invalidateCache();

      toast({
        title: 'موفقیت',
        description: checked ? 'سازمان فعال شد' : 'سازمان غیرفعال شد',
      });
    } catch (error: any) {
      console.error('Error updating active status:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در به‌روزرسانی وضعیت رخ داد',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organizationId || !organization) return;

    try {
      await organizationService.deleteOrganization(organizationId, organization.name);
      
      toast({
        title: 'موفقیت',
        description: 'سازمان با موفقیت حذف شد',
      });

      navigate('/profile');
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'خطا در حذف',
        description: error.message || 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/organizations/${organizationId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">تنظیمات سازمان</h1>
                <Badge variant={isActive ? "default" : "destructive"} className="flex items-center gap-1">
                  {isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      فعال
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      غیرفعال
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground">{organization.name}</p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اطلاعات عمومی</CardTitle>
            <CardDescription>ویرایش اطلاعات سازمان</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <FormLabel>لوگوی سازمان</FormLabel>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-24 h-24 rounded-lg object-cover border-2 border-border"
                        />
                        {!logoFile && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 w-6 h-6"
                                disabled={isDeletingLogo}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف لوگو</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آیا مطمئن هستید که می‌خواهید لوگو را حذف کنید؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteLogo}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-accent/50">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        حداکثر 2 مگابایت - PNG, JPG, SVG
                      </p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام سازمان *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع سازمان *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ایمیل</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تلفن</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وب‌سایت</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <Save className="w-4 h-4 ml-2" />
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وضعیت سازمان</CardTitle>
            <CardDescription>مدیریت فعال/غیرفعال بودن سازمان</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
              <div className="flex-1">
                <p className="font-medium mb-1">
                  {isActive ? 'سازمان فعال است' : 'سازمان غیرفعال است'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? 'سازمان در حال حاضر فعال است و برای اعضا قابل دسترسی می‌باشد'
                    : 'سازمان غیرفعال است و در لیست سازمان‌ها نمایش داده نمی‌شود'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={handleToggleActive}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">منطقه خطرناک</CardTitle>
            <CardDescription>عملیات برگشت‌ناپذیر</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف سازمان
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    با حذف سازمان، تمام اطلاعات، اعضا و داده‌های مرتبط به طور کامل حذف خواهند شد.
                    این عملیات قابل بازگشت نیست.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteOrganization}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    حذف سازمان
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
