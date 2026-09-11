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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Loader2 } from 'lucide-react';

// Form validation schema
const updateUserSchema = z.object({
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
  is_active: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function EditUserDialog({ open, onOpenChange, userId }: EditUserDialogProps) {
  const { updateUser, useUser } = useUserManagement();
  const { data: user, isLoading } = useUser(userId);

  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      display_name: '',
      national_id: '',
      office_phone: '',
      home_phone: '',
      address: '',
      employee_id: '',
      department: '',
      position: '',
      is_active: true,
    },
  });

  // پر کردن فرم با اطلاعات فعلی کاربر
  useEffect(() => {
    if (user) {
      const userData = user as any;
      form.reset({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        display_name: userData.display_name || '',
        national_id: userData.national_id || '',
        office_phone: userData.office_phone || '',
        home_phone: userData.home_phone || '',
        address: userData.address || '',
        employee_id: userData.employee_id || '',
        department: userData.department || '',
        position: userData.position || '',
        is_active: userData.is_active ?? true,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: UpdateUserForm) => {
    try {
      await updateUser.mutateAsync({ userId, userData: data });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="mr-2">در حال دریافت اطلاعات...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ویرایش کاربر</DialogTitle>
          <DialogDescription>
            اطلاعات کاربر را ویرایش کنید. توجه: ایمیل و شماره تلفن قابل تغییر نیستند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* اطلاعات غیرقابل تغییر */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">اطلاعات ثابت:</h3>
              <div>
                <span className="font-medium">ایمیل:</span> {(user as any)?.email}
              </div>
              <div>
                <span className="font-medium">شماره تلفن:</span> {(user as any)?.mobile_phone}
              </div>
            </div>

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

            {/* اطلاعات اداری */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* اطلاعات تماس */}
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

            {/* آدرس */}
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
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* وضعیت فعال/غیرفعال */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">وضعیت کاربر</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      آیا این کاربر فعال باشد؟
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={updateUser.isPending}
              >
                لغو
              </Button>
              <Button 
                type="submit" 
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال بروزرسانی...
                  </>
                ) : (
                  'بروزرسانی'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
