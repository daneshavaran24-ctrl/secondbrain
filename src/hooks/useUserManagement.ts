import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import UserManagementService from '@/services/userManagementService';
import type { 
  UserProfile, 
  CreateUserForm, 
  UpdateUserForm, 
  SystemRole,
  UserRole 
} from '@/types/user-management';

// ===== User Management Hook =====
export function useUserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دریافت لیست کاربران
  const useUsers = (filters?: {
    search?: string;
    role?: SystemRole;
    organization_id?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    return useQuery({
      queryKey: ['users', filters],
      queryFn: () => UserManagementService.getUsers(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // دریافت اطلاعات یک کاربر
  const useUser = (userId: string) => {
    return useQuery({
      queryKey: ['user', userId],
      queryFn: () => UserManagementService.getUserById(userId),
      enabled: !!userId,
    });
  };

  // ایجاد کاربر جدید
  const createUser = useMutation({
    mutationFn: (userData: CreateUserForm) => UserManagementService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'موفق',
        description: 'کاربر جدید با موفقیت ایجاد شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ایجاد کاربر',
        variant: 'destructive',
      });
    },
  });

  // بروزرسانی کاربر
  const updateUser = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserForm }) =>
      UserManagementService.updateUser(userId, userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      toast({
        title: 'موفق',
        description: 'اطلاعات کاربر بروزرسانی شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بروزرسانی کاربر',
        variant: 'destructive',
      });
    },
  });

  // تغییر وضعیت کاربر
  const toggleUserStatus = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      UserManagementService.toggleUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'موفق',
        description: 'وضعیت کاربر تغییر کرد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تغییر وضعیت کاربر',
        variant: 'destructive',
      });
    },
  });

  // حذف کاربر
  const deleteUser = useMutation({
    mutationFn: (userId: string) => UserManagementService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'موفق',
        description: 'کاربر حذف شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف کاربر',
        variant: 'destructive',
      });
    },
  });

  return {
    useUsers,
    useUser,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
}

// ===== Role Management Hook =====
export function useRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دریافت نقش کاربر
  const useUserRole = (userId: string) => {
    return useQuery({
      queryKey: ['userRole', userId],
      queryFn: () => UserManagementService.getUserRole(userId),
      enabled: !!userId,
    });
  };

  // تغییر نقش کاربر
  const changeUserRole = useMutation({
    mutationFn: ({ userId, role, customRoleId }: { 
      userId: string; 
      role: SystemRole; 
      customRoleId?: string 
    }) => UserManagementService.changeUserRole(userId, role, customRoleId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userRole', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'موفق',
        description: 'نقش کاربر تغییر کرد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تغییر نقش کاربر',
        variant: 'destructive',
      });
    },
  });

  return {
    useUserRole,
    changeUserRole,
  };
}

// ===== Permission Management Hook =====
export function usePermissionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دریافت تمام دسترسی‌های سیستم
  const useSystemPermissions = (category?: string) => {
    return useQuery({
      queryKey: ['systemPermissions', category],
      queryFn: () => UserManagementService.getSystemPermissions(category),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // دریافت دسترسی‌های مستقیم کاربر
  const useUserPermissions = (userId: string) => {
    return useQuery({
      queryKey: ['userPermissions', userId],
      queryFn: () => UserManagementService.getUserPermissions(userId),
      enabled: !!userId,
    });
  };

  // تخصیص دسترسی به کاربر
  const assignUserPermission = useMutation({
    mutationFn: ({ 
      userId, 
      permissionId, 
      accessType, 
      reason, 
      validUntil 
    }: {
      userId: string;
      permissionId: string;
      accessType: 'allow' | 'deny';
      reason?: string;
      validUntil?: string;
    }) => UserManagementService.assignUserPermission(userId, permissionId, accessType, reason, validUntil),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', variables.userId] });
      toast({
        title: 'موفق',
        description: 'دسترسی تخصیص داده شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در تخصیص دسترسی',
        variant: 'destructive',
      });
    },
  });

  // حذف دسترسی کاربر
  const removeUserPermission = useMutation({
    mutationFn: ({ userId, permissionId }: { userId: string; permissionId: string }) =>
      UserManagementService.removeUserPermission(userId, permissionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', variables.userId] });
      toast({
        title: 'موفق',
        description: 'دسترسی حذف شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در حذف دسترسی',
        variant: 'destructive',
      });
    },
  });

  return {
    useSystemPermissions,
    useUserPermissions,
    assignUserPermission,
    removeUserPermission,
  };
}

// ===== Current User Hook =====
export function useCurrentUser() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // دریافت اطلاعات کاربر فعلی
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => UserManagementService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });

  // دریافت نقش کاربر فعلی
  const { data: currentRole, isLoading: roleLoading } = useQuery({
    queryKey: ['currentUserRole'],
    queryFn: () => UserManagementService.getCurrentUserRole(),
    staleTime: 5 * 60 * 1000,
  });

  // بررسی دسترسی
  const hasPermission = async (module: string, action: string): Promise<boolean> => {
    const key = `${module}.${action}`;
    
    if (permissions[key] !== undefined) {
      return permissions[key];
    }

    try {
      const result = await UserManagementService.hasPermission(module, action);
      setPermissions(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  // بررسی نقش
  const hasRole = async (role: SystemRole): Promise<boolean> => {
    const key = `role.${role}`;
    
    if (permissions[key] !== undefined) {
      return permissions[key];
    }

    try {
      const result = await UserManagementService.hasRole(role);
      setPermissions(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  };

  // تمیز کردن cache دسترسی‌ها
  const clearPermissionCache = () => {
    setPermissions({});
  };

  return {
    currentUser,
    currentRole,
    isLoading: userLoading || roleLoading,
    hasPermission,
    hasRole,
    clearPermissionCache,
  };
}

// ===== Password Management Hook =====
export function usePasswordManagement() {
  const { toast } = useToast();

  // ریست رمز عبور توسط ادمین
  const resetUserPassword = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      UserManagementService.resetUserPassword(userId, newPassword),
    onSuccess: () => {
      toast({
        title: 'موفق',
        description: 'رمز عبور ریست شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ریست رمز عبور',
        variant: 'destructive',
      });
    },
  });

  // ارسال لینک ریست رمز عبور
  const sendPasswordResetEmail = useMutation({
    mutationFn: (email: string) => UserManagementService.sendPasswordResetEmail(email),
    onSuccess: () => {
      toast({
        title: 'موفق',
        description: 'لینک ریست رمز عبور ارسال شد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ارسال ایمیل',
        variant: 'destructive',
      });
    },
  });

  return {
    resetUserPassword,
    sendPasswordResetEmail,
  };
}

// ===== Audit Log Hook =====
export function useAuditLog() {
  const useUserAuditLog = (userId?: string, limit = 50, offset = 0) => {
    return useQuery({
      queryKey: ['auditLog', userId, limit, offset],
      queryFn: () => UserManagementService.getUserAuditLog(userId, limit, offset),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  return {
    useUserAuditLog,
  };
}
