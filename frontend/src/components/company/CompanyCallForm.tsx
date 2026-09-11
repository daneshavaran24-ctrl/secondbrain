import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyCall } from '@/services/companyCallsService';
import { supabase } from '@/integrations/supabase/client';

interface CompanyCallFormProps {
  companyId: string;
  call?: CompanyCall | null;
  onSave: (data: Partial<CompanyCall>) => void;
  onCancel: () => void;
}

export const CompanyCallForm = ({ companyId, call, onSave, onCancel }: CompanyCallFormProps) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      title: call?.title || '',
      call_type: call?.call_type || 'phone',
      direction: call?.direction || 'outbound',
      contact_id: call?.contact_id || '',
      contact_name: call?.contact_name || '',
      contact_phone: call?.contact_phone || '',
      contact_organization: call?.contact_organization || '',
      call_date: call?.call_date ? new Date(call.call_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      duration: call?.duration || 0,
      scheduled_date: call?.scheduled_date ? new Date(call.scheduled_date).toISOString().slice(0, 16) : '',
      status: call?.status || 'completed',
      outcome: call?.outcome || '',
      priority: call?.priority || 'medium',
      notes: call?.notes || '',
      summary: call?.summary || '',
      category: call?.category || '',
      follow_up_date: call?.follow_up_date ? new Date(call.follow_up_date).toISOString().slice(0, 16) : '',
    },
  });

  const selectedContactId = watch('contact_id');

  useEffect(() => {
    loadContacts();
  }, [companyId]);

  useEffect(() => {
    if (selectedContactId) {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (contact) {
        setValue('contact_name', contact.name);
        setValue('contact_phone', contact.phone || '');
        setValue('contact_organization', contact.organization || '');
      }
    }
  }, [selectedContactId, contacts]);

  const loadContacts = async () => {
    const { data } = await supabase
      .from('company_contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    setContacts(data || []);
  };

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">عنوان تماس *</Label>
        <Input id="title" {...register('title')} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="call_type">نوع تماس</Label>
          <Select onValueChange={(value) => setValue('call_type', value as any)} defaultValue={watch('call_type')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">تلفنی</SelectItem>
              <SelectItem value="video">ویدیویی</SelectItem>
              <SelectItem value="online_meeting">جلسه آنلاین</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="direction">جهت تماس</Label>
          <Select onValueChange={(value) => setValue('direction', value as any)} defaultValue={watch('direction')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outbound">خروجی</SelectItem>
              <SelectItem value="inbound">ورودی</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="contact_id">مخاطب</Label>
        <Select onValueChange={(value) => setValue('contact_id', value)} defaultValue={watch('contact_id')}>
          <SelectTrigger>
            <SelectValue placeholder="انتخاب مخاطب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">بدون مخاطب</SelectItem>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedContactId && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact_name">نام شخص</Label>
            <Input id="contact_name" {...register('contact_name')} />
          </div>
          <div>
            <Label htmlFor="contact_phone">شماره تماس</Label>
            <Input id="contact_phone" {...register('contact_phone')} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="call_date">تاریخ و ساعت تماس</Label>
          <Input id="call_date" type="datetime-local" {...register('call_date')} />
        </div>

        <div>
          <Label htmlFor="duration">مدت زمان (دقیقه)</Label>
          <Input id="duration" type="number" {...register('duration')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">وضعیت</Label>
          <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={watch('status')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">برنامه‌ریزی شده</SelectItem>
              <SelectItem value="in_progress">در حال انجام</SelectItem>
              <SelectItem value="completed">انجام شده</SelectItem>
              <SelectItem value="cancelled">لغو شده</SelectItem>
              <SelectItem value="missed">از دست رفته</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">اولویت</Label>
          <Select onValueChange={(value) => setValue('priority', value as any)} defaultValue={watch('priority')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">کم</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">بالا</SelectItem>
              <SelectItem value="urgent">فوری</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">دسته‌بندی</Label>
          <Select onValueChange={(value) => setValue('category', value)} defaultValue={watch('category')}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب دسته" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">بدون دسته</SelectItem>
              <SelectItem value="sales">فروش</SelectItem>
              <SelectItem value="support">پشتیبانی</SelectItem>
              <SelectItem value="follow_up">پیگیری</SelectItem>
              <SelectItem value="negotiation">مذاکره</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="outcome">نتیجه تماس</Label>
        <Input id="outcome" {...register('outcome')} placeholder="موفق، نیاز به پیگیری، ..." />
      </div>

      <div>
        <Label htmlFor="summary">خلاصه تماس</Label>
        <Textarea id="summary" {...register('summary')} rows={3} />
      </div>

      <div>
        <Label htmlFor="notes">یادداشت‌ها</Label>
        <Textarea id="notes" {...register('notes')} rows={3} />
      </div>

      <div>
        <Label htmlFor="follow_up_date">تاریخ پیگیری</Label>
        <Input id="follow_up_date" type="datetime-local" {...register('follow_up_date')} />
      </div>

      {watch('status') === 'scheduled' && (
        <div>
          <Label htmlFor="scheduled_date">تاریخ برنامه‌ریزی</Label>
          <Input id="scheduled_date" type="datetime-local" {...register('scheduled_date')} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit">
          {call ? 'بروزرسانی' : 'ثبت تماس'}
        </Button>
      </div>
    </form>
  );
};
