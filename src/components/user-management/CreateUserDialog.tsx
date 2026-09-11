import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUserManagement } from '@/hooks/useUserManagement-simple';
import { SystemRole, ROLE_NAMES } from '@/types/user-management';
import { Loader2 } from 'lucide-react';

// Form validation schema
const createUserSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  mobile_phone: z.string()
    .min(10, 'شماره تلفن باید حداقل 10 رقم باشد')
    .regex(/^(\+98|0)?9\d{9}$/, 'فرمت شماره تلفن صحیح نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  national_id: z.string().optional(),
  office_phone: z.string().optional(),
  home_phone: z.string().optional(),
  address: z.string().optional(),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  hire_date: z.string().optional(),
  birth_date: z.string().optional(),
  bio: z.string().optional(),
  notes: z.string().optional(),
  organization_id: z.string().optional(),
  system_role: z.enum(['admin', 'general_manager', 'department_manager', 'user', 'secretary']).default('user'),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { createUser } = useUserManagement();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      system_role: 'user',
      mobile_phone: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: CreateUserForm) => {
    try {
      // نرمالایز کردن شماره تلفن
      const normalizedPhone = data.mobile_phone.replace(/^(\+98|0)/, '+98');
      
        const userData = {
          email: data.email!,
          mobile_phone: data.mobile_phone!,
          password: data.password!,
          first_name: data.first_name,
          last_name: data.last_name,
          display_name: data.display_name,
          national_id: data.national_id,
          office_phone: data.office_phone,
          home_phone: data.home_phone,
          address: data.address,
          employee_id: data.employee_id,
          department: data.department,
          position: data.position,
          hire_date: data.hire_date,
          birth_date: data.birth_date,
          bio: data.bio,
          notes: data.notes,
          system_role: data.system_role || 'user' as const,
        };
      
      await createUser.mutateAsync(userData);
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ایجاد کاربر جدید</DialogTitle>
          <DialogDescription>
            اطلاعات کاربر جدید را وارد کنید. فیلدهای ایمیل، شماره تلفن و رمز عبور اجباری هستند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* اطلاعات اساسی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="example@domain.com" 
                        type="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن همراه *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="09123456789" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رمز عبور *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="حداقل 6 کاراکتر"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* اطلاعات شخصی */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام</FormLabel>
                    <FormControl>
                      <Input placeholder="نام" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام خانوادگی</FormLabel>
                    <FormControl>
                      <Input placeholder="نام خانوادگی" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام نمایشی</FormLabel>
                    <FormControl>
                      <Input placeholder="نام نمایشی" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* نقش کاربر */}
            <FormField
              control={form.control}
              name="system_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نقش سیستمی *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب نقش" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ROLE_NAMES).map(([role, name]) => (
                        <SelectItem key={role} value={role}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* اطلاعات پیشرفته */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mb-4"
              >
                {showAdvanced ? 'مخفی کردن' : 'نمایش'} اطلاعات تکمیلی
              </Button>

              {showAdvanced && (
                <div className="space-y-4 border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="national_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کد ملی</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="employee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کد پرسنلی</FormLabel>
                          <FormControl>
                            <Input placeholder="EMP001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>بخش</FormLabel>
                          <FormControl>
                            <Input placeholder="IT، مالی، منابع انسانی" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سمت</FormLabel>
                          <FormControl>
                            <Input placeholder="مدیر، کارشناس، متخصص" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="office_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تلفن اداری</FormLabel>
                          <FormControl>
                            <Input placeholder="021-12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="home_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تلفن منزل</FormLabel>
                          <FormControl>
                            <Input placeholder="021-12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>آدرس</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="آدرس کامل"
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createUser.isPending}
              >
                لغو
              </Button>
              <Button 
                type="submit" 
                disabled={createUser.isPending}
              >
                {createUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  'ایجاد کاربر'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
