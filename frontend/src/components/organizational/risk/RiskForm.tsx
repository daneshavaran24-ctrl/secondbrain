import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

const riskSchema = z.object({
  title: z.string().min(1, 'عنوان ریسک الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  category: z.string().min(1, 'دسته‌بندی الزامی است'),
  probability: z.number().min(1).max(10),
  impact: z.number().min(1).max(10),
  responsiblePerson: z.string().min(1, 'مسئول الزامی است'),
  mitigationStrategy: z.string().min(1, 'استراتژی کاهش الزامی است'),
  contingencyPlan: z.string().min(1, 'برنامه اضطراری الزامی است'),
  status: z.string().min(1, 'وضعیت الزامی است'),
});

export type RiskFormData = z.infer<typeof riskSchema>;

interface RiskFormProps {
  onSubmit: (data: RiskFormData) => void;
  onCancel: () => void;
  initialData?: Partial<RiskFormData>;
  isEdit?: boolean;
}

const categories = [
  { value: 'فناوری', label: 'فناوری اطلاعات' },
  { value: 'مالی', label: 'مالی و اقتصادی' },
  { value: 'محیطی', label: 'محیطی و قانونی' },
  { value: 'داخلی', label: 'داخلی و عملیاتی' },
  { value: 'انسانی', label: 'منابع انسانی' },
  { value: 'استراتژیک', label: 'استراتژیک' }
];

const statusOptions = [
  { value: 'فعال', label: 'فعال' },
  { value: 'در نظارت', label: 'در نظارت' },
  { value: 'کنترل شده', label: 'کنترل شده' },
  { value: 'غیرفعال', label: 'غیرفعال' }
];

const calculateRiskLevel = (probability: number, impact: number): string => {
  const score = probability * impact;
  if (score >= 70) return 'بحرانی';
  if (score >= 40) return 'بالا';
  if (score >= 20) return 'متوسط';
  return 'پایین';
};

const getRiskLevelColor = (level: string): string => {
  switch (level) {
    case 'بحرانی': return 'destructive';
    case 'بالا': return 'secondary';
    case 'متوسط': return 'outline';
    case 'پایین': return 'default';
    default: return 'outline';
  }
};

export default function RiskForm({ onSubmit, onCancel, initialData, isEdit = false }: RiskFormProps) {
  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      probability: initialData?.probability || 5,
      impact: initialData?.impact || 5,
      responsiblePerson: initialData?.responsiblePerson || '',
      mitigationStrategy: initialData?.mitigationStrategy || '',
      contingencyPlan: initialData?.contingencyPlan || '',
      status: initialData?.status || 'فعال',
    },
  });

  const watchedProbability = form.watch('probability');
  const watchedImpact = form.watch('impact');
  const riskScore = watchedProbability * watchedImpact;
  const riskLevel = calculateRiskLevel(watchedProbability, watchedImpact);

  const handleSubmit = (data: RiskFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isEdit ? 'ویرایش ریسک' : 'ایجاد ریسک جدید'}</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان ریسک</FormLabel>
                    <FormControl>
                      <Input placeholder="عنوان ریسک را وارد کنید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>دسته‌بندی</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <TextInputWithVoice
                      value={field.value}
                      onChange={field.onChange}
                      type="textarea"
                      placeholder="توضیحات تفصیلی ریسک را وارد کنید"
                      rows={4}
                      enableVoice={true}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="responsiblePerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مسئول مدیریت ریسک</FormLabel>
                    <FormControl>
                      <Input placeholder="نام مسئول را وارد کنید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="وضعیت را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Risk Scoring */}
            <div className="border rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">ارزیابی ریسک</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">امتیاز: {riskScore}</span>
                  <Badge variant={getRiskLevelColor(riskLevel) as any}>{riskLevel}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>احتمال وقوع (۱-۱۰)</FormLabel>
                      <div className="space-y-4">
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>کم (۱)</span>
                          <span className="font-medium">{field.value}</span>
                          <span>زیاد (۱۰)</span>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>میزان تأثیر (۱-۱۰)</FormLabel>
                      <div className="space-y-4">
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            className="w-full"
                          />
                        </FormControl>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>کم (۱)</span>
                          <span className="font-medium">{field.value}</span>
                          <span>زیاد (۱۰)</span>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="mitigationStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>استراتژی کاهش ریسک</FormLabel>
                    <FormControl>
                      <TextInputWithVoice
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        placeholder="استراتژی کاهش ریسک را شرح دهید"
                        rows={5}
                        enableVoice={true}
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contingencyPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>برنامه اضطراری</FormLabel>
                    <FormControl>
                      <TextInputWithVoice
                        value={field.value}
                        onChange={field.onChange}
                        type="textarea"
                        placeholder="برنامه اضطراری در صورت وقوع ریسک"
                        rows={5}
                        enableVoice={true}
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                لغو
              </Button>
              <Button type="submit">
                <Plus className="w-4 h-4 ml-2" />
                {isEdit ? 'بروزرسانی ریسک' : 'ایجاد ریسک'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}