import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubUserService } from '@/services/subUserService';
import type { CreateSubUserForm, UpdateSubUserForm } from '@/types/sub-user';
import { toast } from 'sonner';

export function useSubUsers() {
  const queryClient = useQueryClient();

  const { data: subUsers, isLoading, error } = useQuery({
    queryKey: ['sub-users'],
    queryFn: () => SubUserService.getSubUsers(),
  });

  const createSubUser = useMutation({
    mutationFn: (formData: CreateSubUserForm) => SubUserService.createSubUser(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-users'] });
      toast.success('کاربر فرعی با موفقیت ایجاد شد');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در ایجاد کاربر فرعی');
    },
  });

  const updateSubUser = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: UpdateSubUserForm }) =>
      SubUserService.updateSubUser(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-users'] });
      toast.success('کاربر فرعی با موفقیت بروزرسانی شد');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در بروزرسانی کاربر فرعی');
    },
  });

  const deleteSubUser = useMutation({
    mutationFn: (id: string) => SubUserService.deleteSubUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-users'] });
      toast.success('کاربر فرعی با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در حذف کاربر فرعی');
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      SubUserService.toggleSubUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-users'] });
      toast.success('وضعیت کاربر فرعی تغییر کرد');
    },
    onError: (error: any) => {
      toast.error(error.message || 'خطا در تغییر وضعیت');
    },
  });

  return {
    subUsers,
    isLoading,
    error,
    createSubUser,
    updateSubUser,
    deleteSubUser,
    toggleStatus,
  };
}

export function useSubUser(id: string) {
  return useQuery({
    queryKey: ['sub-user', id],
    queryFn: () => SubUserService.getSubUser(id),
    enabled: !!id,
  });
}

export function useUserType() {
  return useQuery({
    queryKey: ['user-type'],
    queryFn: () => SubUserService.getUserType(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllowedDomains() {
  return useQuery({
    queryKey: ['allowed-domains'],
    queryFn: () => SubUserService.getAllowedDomains(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanCreateSubUser() {
  return useQuery({
    queryKey: ['can-create-sub-user'],
    queryFn: () => SubUserService.canCreateSubUser(),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => SubUserService.getAuditLogs(),
  });
}
