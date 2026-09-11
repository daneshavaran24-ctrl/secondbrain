import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserManagementService } from '@/services/userManagementService-simple';
import { CreateUserForm, SystemRole } from '@/types/user-management';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => UserManagementService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (userData: CreateUserForm) => UserManagementService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: Partial<CreateUserForm> }) => 
      UserManagementService.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => UserManagementService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetPassword = useMutation({
    mutationFn: (userId: string) => UserManagementService.resetPassword(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const getUsers = useQuery({
    queryKey: ['users'],
    queryFn: () => UserManagementService.getUsers(),
  });

  return {
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    users: getUsers.data || [],
    isLoading: getUsers.isLoading,
    error: getUsers.error,
  };
}

export function usePermissionCheck(permissionKey: string) {
  const { data: currentUserData } = useCurrentUser();
  
  return useQuery({
    queryKey: ['permission', permissionKey, currentUserData?.user?.id],
    queryFn: () => {
      if (!currentUserData?.user?.id) return false;
      return UserManagementService.checkPermission(currentUserData.user.id, permissionKey);
    },
    enabled: !!currentUserData?.user?.id,
  });
}
