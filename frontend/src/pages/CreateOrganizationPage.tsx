import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Upload, X } from 'lucide-react';
import { organizationService } from '@/services/organizationService';

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

export default function CreateOrganizationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Redirect به صفحه ورود اگر کاربر لاگین نیست
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: 'دسترسی محدود',
        description: 'لطفاً ابتدا وارد سیستم شوید',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [user, isLoading, navigate, toast]);

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

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'خطا',
          description: 'لطفاً ابتدا وارد شوید',
          variant: 'destructive',
        });
        return;
      }

      // ایجاد سازمان با استفاده از organizationService
      const organization = await organizationService.addOrganization(
        data.name,
        data.type,
        data.description
      );

      if (!organization) {
        throw new Error('Failed to create organization');
      }

      // به‌روزرسانی اطلاعات تکمیلی
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          website: data.website || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
        })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // آپلود لوگو در صورت وجود
      if (logoFile) {
        const logoUrl = await organizationService.uploadOrganizationLogo(organization.id, logoFile);
        
        if (logoUrl) {
          console.log('✅ Logo uploaded successfully:', logoUrl);
        }
      }

      toast({
        title: 'موفقیت',
        description: 'سازمان با موفقیت ایجاد شد',
      });
      
      navigate(`/organizations/${organization.id}`);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: 'خطا در ایجاد سازمان',
        description: error.message || 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ایجاد سازمان جدید</h1>
              <p className="text-muted-foreground">اطلاعات سازمان خود را وارد کنید</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات اصلی</CardTitle>
            <CardDescription>
              تمام فیلدهای ستاره‌دار الزامی هستند
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <FormLabel>لوگوی سازمان</FormLabel>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 rounded-lg object-cover border-2 border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 w-6 h-6"
                          onClick={removeLogo}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام سازمان *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: شرکت فناوری نوین" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع سازمان *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب کنید..." />
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

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="توضیحات کوتاهی درباره سازمان..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        این توضیحات در صفحه سازمان نمایش داده می‌شود
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ایمیل</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تلفن</FormLabel>
                        <FormControl>
                          <Input placeholder="021-12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وب‌سایت</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="آدرس کامل سازمان..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'در حال ایجاد...' : 'ایجاد سازمان'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    disabled={isSubmitting}
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
