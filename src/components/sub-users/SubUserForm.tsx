import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DOMAIN_CONFIGS, PERMISSION_LABELS } from "@/types/sub-user";
import type { DomainType, PermissionType } from "@/types/sub-user";

const subUserSchema = z.object({
  name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  email: z.string().email("ایمیل نامعتبر است"),
  password: z.string().min(8, "رمز عبور باید حداقل 8 کاراکتر باشد"),
  expires_at: z.string().optional(),
});

type SubUserFormData = z.infer<typeof subUserSchema>;

interface SubUserFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    permissions: Array<{ domain: DomainType; permissions: PermissionType[] }>;
    expires_at?: string;
  }) => void;
  isPending?: boolean;
}

export function SubUserForm({ onSubmit, isPending }: SubUserFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<DomainType, PermissionType[]>
  >({} as Record<DomainType, PermissionType[]>);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubUserFormData>({
    resolver: zodResolver(subUserSchema),
  });

  const handlePermissionToggle = (domain: DomainType, permission: PermissionType) => {
    setSelectedPermissions((prev) => {
      const currentPerms = prev[domain] || [];
      const hasPermission = currentPerms.includes(permission);

      if (hasPermission) {
        // حذف permission
        const newPerms = currentPerms.filter((p) => p !== permission);
        if (newPerms.length === 0) {
          const { [domain]: _, ...rest } = prev;
          return rest as Record<DomainType, PermissionType[]>;
        }
        return { ...prev, [domain]: newPerms };
      } else {
        // اضافه کردن permission
        return { ...prev, [domain]: [...currentPerms, permission] };
      }
    });
  };

  const handleFormSubmit = (data: SubUserFormData) => {
    const permissions = Object.entries(selectedPermissions).map(([domain, perms]) => ({
      domain: domain as DomainType,
      permissions: perms,
    }));

    if (permissions.length === 0) {
      alert('لطفاً حداقل یک دسترسی انتخاب کنید');
      return;
    }

    onSubmit({
      name: data.name,
      email: data.email,
      password: data.password,
      expires_at: data.expires_at,
      permissions,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات کاربر</CardTitle>
          <CardDescription>اطلاعات پایه کاربر فرعی را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="نام کاربر فرعی"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="حداقل 8 کاراکتر"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">تاریخ انقضا (اختیاری)</Label>
            <Input
              id="expires_at"
              type="date"
              {...register("expires_at")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>دسترسی‌ها</CardTitle>
          <CardDescription>
            حوزه‌ها و سطح دسترسی کاربر فرعی را انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {DOMAIN_CONFIGS.map((domain) => (
              <div key={domain.id} className="space-y-3 p-4 border rounded-lg">
                <div className="font-medium">{domain.name}</div>
                <p className="text-sm text-muted-foreground">{domain.description}</p>
                <div className="flex gap-4">
                  {(['read', 'write', 'delete'] as PermissionType[]).map((perm) => (
                    <div key={perm} className="flex items-center gap-2">
                      <Checkbox
                        id={`${domain.id}-${perm}`}
                        checked={selectedPermissions[domain.id]?.includes(perm) || false}
                        onCheckedChange={() => handlePermissionToggle(domain.id, perm)}
                      />
                      <Label
                        htmlFor={`${domain.id}-${perm}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {PERMISSION_LABELS[perm]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'در حال ایجاد...' : 'ایجاد کاربر فرعی'}
        </Button>
      </div>
    </form>
  );
}
