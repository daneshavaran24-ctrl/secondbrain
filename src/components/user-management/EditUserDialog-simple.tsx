import React, { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { UserProfile, SystemRole, ROLE_NAMES } from '@/types/user-management';

// Form validation schema
const editUserSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  mobile_phone: z.string()
    .min(10, 'شماره تلفن باید حداقل 10 رقم باشد')
    .regex(/^(\+98|0)?9\d{9}$/, 'فرمت شماره تلفن صحیح نیست'),
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

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfile | null;
  onSave: (userId: string, data: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
}

export function EditUserDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSave, 
  isLoading = false 
}: EditUserDialogProps) {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      mobile_phone: '',
      first_name: '',
      last_name: '',
      display_name: '',
      system_role: 'user',
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || '',
        mobile_phone: user.mobile_phone || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        national_id: user.national_id || '',
        office_phone: user.office_phone || '',
        home_phone: user.home_phone || '',
        address: user.address || '',
        employee_id: user.employee_id || '',
        department: user.department || '',
        position: user.position || '',
        system_role: 'user', // Default since we don't have role data yet
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;
    
    try {
      // Normalize phone number
      const normalizedPhone = data.mobile_phone.replace(/^(\+98|0)/, '+98');
      
      const updateData = {
        email: data.email,
        mobile_phone: normalizedPhone,
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
      };
      
      await onSave(user.user_id, updateData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ویرایش کاربر</DialogTitle>
          <DialogDescription>
            اطلاعات کاربر را ویرایش کنید
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

              {/* National ID */}
              <FormField
                control={form.control}
                name="national_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد ملی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="کد ملی" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Office Phone */}
              <FormField
                control={form.control}
                name="office_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن دفتر</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="تلفن دفتر" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="آدرس" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                لغو
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ذخیره تغییرات
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}