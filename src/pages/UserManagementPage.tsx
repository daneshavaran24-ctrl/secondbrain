import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Shield,
  Key,
  Eye
} from 'lucide-react';
import { useUserManagement, useCurrentUser } from '@/hooks/useUserManagement';
import { ROLE_NAMES, SystemRole } from '@/types/user-management';
import CreateUserDialog from '@/components/user-management/CreateUserDialog';
import EditUserDialog from '@/components/user-management/EditUserDialog';
import UserDetailsDialog from '@/components/user-management/UserDetailsDialog';
import UserRoleDialog from '@/components/user-management/UserRoleDialog';
import UserPermissionsDialog from '@/components/user-management/UserPermissionsDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

export default function UserManagementPage() {
  const { toast } = useToast();
  const { hasPermission } = useCurrentUser();
  const { useUsers, toggleUserStatus, deleteUser } = useUserManagement();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<SystemRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<boolean | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Dialogs state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Query filters
  const filters = {
    search: searchTerm || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    is_active: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 50,
  };

  const { data: users, isLoading, error } = useUsers(filters);

  // Permission checks
  const [canCreateUsers, setCanCreateUsers] = React.useState(false);
  const [canEditUsers, setCanEditUsers] = React.useState(false);
  const [canDeleteUsers, setCanDeleteUsers] = React.useState(false);
  const [canManageRoles, setCanManageRoles] = React.useState(false);
  const [canManagePermissions, setCanManagePermissions] = React.useState(false);

  React.useEffect(() => {
    const checkPermissions = async () => {
      const [create, edit, deleteP, roles, permissions] = await Promise.all([
        hasPermission('users', 'create'),
        hasPermission('users', 'edit'),
        hasPermission('users', 'delete'),
        hasPermission('users', 'manage_roles'),
        hasPermission('users', 'manage_permissions'),
      ]);
      
      setCanCreateUsers(create);
      setCanEditUsers(edit);
      setCanDeleteUsers(deleteP);
      setCanManageRoles(roles);
      setCanManagePermissions(permissions);
    };

    checkPermissions();
  }, [hasPermission]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus.mutateAsync({ userId, isActive: !currentStatus });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    } catch (error) {
      // Error handling is done in the hook
    }
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

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              خطا در دریافت اطلاعات کاربران: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">مدیریت کاربران</h1>
            <p className="text-muted-foreground">مدیریت کاربران، نقش‌ها و دسترسی‌ها</p>
          </div>
        </div>
        
        {canCreateUsers && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            ایجاد کاربر جدید
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>فیلترها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی نام، ایمیل یا شماره تلفن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as SystemRole | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نقش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه نقش‌ها</SelectItem>
                {Object.entries(ROLE_NAMES).map(([role, name]) => (
                  <SelectItem key={role} value={role}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={statusFilter === 'all' ? 'all' : statusFilter.toString()} 
              onValueChange={(value) => setStatusFilter(value === 'all' ? 'all' : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="true">فعال</SelectItem>
                <SelectItem value="false">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست کاربران ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">در حال دریافت کاربران...</p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>شماره تلفن</TableHead>
                    <TableHead>نقش</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.display_name} 
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              {(user.display_name || user.first_name || user.email)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'بدون نام'}
                            </div>
                            {user.employee_id && (
                              <div className="text-sm text-muted-foreground">
                                کد: {user.employee_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile_phone}</TableCell>
                      
                      <TableCell>
                        {user.user_roles?.[0] && (
                          <Badge className={getRoleColor(user.user_roles[0].system_role)}>
                            {ROLE_NAMES[user.user_roles[0].system_role]}
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(user.is_active)}>
                          {user.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user.user_id);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              مشاهده جزئیات
                            </DropdownMenuItem>
                            
                            {canEditUsers && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user.user_id);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4 ml-2" />
                                ویرایش
                              </DropdownMenuItem>
                            )}
                            
                            {canManageRoles && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user.user_id);
                                  setShowRoleDialog(true);
                                }}
                              >
                                <Shield className="h-4 w-4 ml-2" />
                                مدیریت نقش
                              </DropdownMenuItem>
                            )}
                            
                            {canManagePermissions && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user.user_id);
                                  setShowPermissionsDialog(true);
                                }}
                              >
                                <Key className="h-4 w-4 ml-2" />
                                مدیریت دسترسی‌ها
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 ml-2" />
                                  غیرفعال کردن
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 ml-2" />
                                  فعال کردن
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            {canDeleteUsers && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user.user_id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">هیچ کاربری یافت نشد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateUserDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      )}

      {selectedUser && showEditDialog && (
        <EditUserDialog 
          open={showEditDialog} 
          onOpenChange={setShowEditDialog}
          userId={selectedUser}
        />
      )}

      {selectedUser && showDetailsDialog && (
        <UserDetailsDialog 
          open={showDetailsDialog} 
          onOpenChange={setShowDetailsDialog}
          userId={selectedUser}
        />
      )}

      {selectedUser && showRoleDialog && (
        <UserRoleDialog 
          open={showRoleDialog} 
          onOpenChange={setShowRoleDialog}
          userId={selectedUser}
        />
      )}

      {selectedUser && showPermissionsDialog && (
        <UserPermissionsDialog 
          open={showPermissionsDialog} 
          onOpenChange={setShowPermissionsDialog}
          userId={selectedUser}
        />
      )}

      {selectedUser && showDeleteConfirm && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="حذف کاربر"
          description="آیا از حذف این کاربر اطمینان دارید؟ این عمل قابل بازگشت نیست."
          confirmText="حذف"
          cancelText="لغو"
          onConfirm={() => handleDeleteUser(selectedUser)}
          variant="destructive"
        />
      )}
    </div>
  );
}
