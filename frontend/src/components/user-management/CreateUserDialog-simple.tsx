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
  system_role: z.enum(['admin', 'general_manager', 'department_manager', 'user', 'secretary']).default('user'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { createUser } = useUserManagement();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      mobile_phone: '',
      password: '',
      first_name: '',
      last_name: '',
      display_name: '',
      system_role: 'user',
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      // Normalize phone number
      const normalizedPhone = data.mobile_phone.replace(/^(\+98|0)/, '+98');
      
      const userData = {
        email: data.email,
        mobile_phone: normalizedPhone,
        password: data.password,
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
        system_role: data.system_role,
      };
      
      await createUser.mutateAsync(userData);
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ایجاد کاربر جدید</DialogTitle>
          <DialogDescription>
            اطلاعات کاربر جدید را وارد کنید
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="user@example.com" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mobile Phone */}
              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره موبایل *</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="09123456789" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور *</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="حداقل 6 کاراکتر" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* System Role */}
              <FormField
                control={form.control}
                name="system_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نقش سیستم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نقش" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_NAMES).map(([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="نام" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام خانوادگی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="نام خانوادگی" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display Name */}
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام نمایشی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="نام نمایشی" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>بخش</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="بخش" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Position */}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سمت</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="سمت" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee ID */}
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد پرسنلی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="کد پرسنلی" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                لغو
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ایجاد کاربر
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
