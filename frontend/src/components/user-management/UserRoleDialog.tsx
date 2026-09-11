import React from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoleManagement, useUserManagement } from '@/hooks/useUserManagement';
import { SystemRole, ROLE_NAMES, ROLE_HIERARCHY } from '@/types/user-management';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

// Form validation schema
const roleAssignmentSchema = z.object({
  system_role: z.enum(['admin', 'general_manager', 'department_manager', 'user', 'secretary']),
});

type RoleAssignmentForm = z.infer<typeof roleAssignmentSchema>;

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function UserRoleDialog({ open, onOpenChange, userId }: UserRoleDialogProps) {
  const { changeUserRole, useUserRole } = useRoleManagement();
  const { useUser } = useUserManagement();
  
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: currentRole, isLoading: roleLoading } = useUserRole(userId);

  const form = useForm<RoleAssignmentForm>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      system_role: 'user',
    },
  });

  // تنظیم مقدار پیش‌فرض فرم
  React.useEffect(() => {
    if (currentRole) {
      form.setValue('system_role', currentRole.system_role);
    }
  }, [currentRole, form]);

  const onSubmit = async (data: RoleAssignmentForm) => {
    try {
      await changeUserRole.mutateAsync({
        userId,
        role: data.system_role,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getRoleDescription = (role: SystemRole): string => {
    const descriptions = {
      admin: 'دسترسی کامل به تمام بخش‌های سیستم، مدیریت کاربران و تنظیمات',
      general_manager: 'دسترسی به اکثر بخش‌های سیستم به جز مدیریت کامل کاربران',
      department_manager: 'دسترسی محدود به بخش‌های مربوط به مدیریت بخش',
      secretary: 'دسترسی به تقویم، جلسات و واگذاری وظایف',
      user: 'دسترسی پایه به امکانات عمومی سیستم',
    };
    return descriptions[role];
  };

  const getRoleColor = (role: SystemRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      general_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      department_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      secretary: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      user: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[role] || colors.user;
  };

  if (userLoading || roleLoading) {
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
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            مدیریت نقش کاربر
          </DialogTitle>
          <DialogDescription>
            نقش سیستمی کاربر را تغییر دهید. این تغییر بر دسترسی‌های کاربر تأثیر خواهد گذاشت.
          </DialogDescription>
        </DialogHeader>

        {/* اطلاعات کاربر */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اطلاعات کاربر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                {user && 'name' in user ? user.name?.[0]?.toUpperCase() : '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {user && 'name' in user ? String(user.name || 'بدون نام') : 'بدون نام'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user && 'description' in user ? String(user.description || '') : ''}
                </p>
              </div>
              {currentRole && (
                <Badge className={getRoleColor(currentRole.system_role)}>
                  {ROLE_NAMES[currentRole.system_role]}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="system_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نقش سیستمی جدید</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب نقش" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ROLE_NAMES).map(([role, name]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center justify-between w-full">
                            <span>{name}</span>
                            <Badge 
                              variant="outline" 
                              className={`mr-2 ${getRoleColor(role as SystemRole)}`}
                            >
                              سطح {ROLE_HIERARCHY[role as SystemRole]}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getRoleDescription(field.value as SystemRole)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* هشدار تغییر نقش */}
            {form.watch('system_role') !== currentRole?.system_role && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">
                      تغییر نقش کاربر
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      با تغییر نقش، دسترسی‌های کاربر بلافاصله تغییر خواهد کرد. این تغییر در لاگ سیستم ثبت می‌شود.
                    </p>
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      <span className="font-medium">نقش قبلی:</span> {currentRole ? ROLE_NAMES[currentRole.system_role] : 'نامشخص'}
                      <br />
                      <span className="font-medium">نقش جدید:</span> {ROLE_NAMES[form.watch('system_role') as SystemRole]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={changeUserRole.isPending}
              >
                لغو
              </Button>
              <Button 
                type="submit" 
                disabled={changeUserRole.isPending || form.watch('system_role') === currentRole?.system_role}
              >
                {changeUserRole.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال تغییر...
                  </>
                ) : (
                  'تغییر نقش'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
