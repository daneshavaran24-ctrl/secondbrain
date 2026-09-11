import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, Plus, Search, Users, Shield, Settings, Eye, Edit2, Trash2, 
  LayoutGrid, List, MoreHorizontal, AlertTriangle, KeyRound, Copy 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateUserDialog } from '@/components/user-management/CreateUserDialog-simple';
import { EditUserDialog } from '@/components/user-management/EditUserDialog-simple';
import { UserDetailsDialog } from '@/components/user-management/UserDetailsDialog-simple';
import PermissionManagement from '@/components/user-management/PermissionManagement';
import { useUserManagement } from '@/hooks/useUserManagement-simple';
import { UserProfile, SystemRole } from '@/types/user-management';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'table';

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<SystemRole | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const { users, isLoading, error, updateUser, deleteUser, resetPassword } = useUserManagement();

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile_phone?.includes(searchTerm)
  );

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: UserProfile) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleManagePermissions = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedUserRole(undefined); // برای مدیریت دسترسی کاربر خاص
    setPermissionDialogOpen(true);
  };

  const handleManageRolePermissions = (role: SystemRole) => {
    setSelectedUser(null);
    setSelectedUserRole(role);
    setPermissionDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.user_id);
      toast.success('کاربر با موفقیت حذف شد');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'خطا در حذف کاربر');
    }
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const result = await resetPassword.mutateAsync(selectedUser.user_id);
      
      const copyPassword = () => {
        navigator.clipboard.writeText(result.temporaryPassword);
        toast.success('رمز عبور کپی شد');
      };

      // نمایش پیام با امکان کپی
      toast.success(
        <div className="flex flex-col gap-2">
          <div className="font-bold">رمز عبور بازنشانی شد!</div>
          <div>کاربر: <strong>{selectedUser.display_name}</strong></div>
          <div className="flex items-center gap-2">
            <span>رمز موقت:</span>
            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
              <span className="font-mono text-lg">{result.temporaryPassword}</span>
              <Button
                size="sm"
                variant="ghost" 
                onClick={copyPassword}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-orange-600">لطفا این رمز را به کاربر اطلاع دهید</div>
        </div>,
        {
          duration: 20000,
        }
      );
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || 'خطا در بازنشانی رمز عبور');
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<UserProfile>) => {
    try {
      await updateUser.mutateAsync({ userId, userData });
      toast.success('اطلاعات کاربر با موفقیت به‌روزرسانی شد');
    } catch (error: any) {
      toast.error(error.message || 'خطا در به‌روزرسانی کاربر');
      throw error;
    }
  };

  // Admin check must be done via database role lookup, not hardcoded ID
  const isAdminUser = (user: UserProfile) => {
    // This is a placeholder - actual admin check should query user_roles table
    // Never use hardcoded IDs for security-sensitive checks
    return false; // Disable hardcoded admin check - use proper role system
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredUsers.map((user) => (
        <Card key={user.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.display_name || 'کاربر جدید'}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">{user.mobile_phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {user.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                  {isAdminUser(user) && (
                    <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                      ادمین اصلی
                    </Badge>
                  )}
                </div>
              </div>
              
              {user.department && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">بخش:</span> {user.department}
                </div>
              )}
              
              {user.position && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">سمت:</span> {user.position}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-gray-500">
                  عضو از: {new Date(user.created_at).toLocaleDateString('fa-IR')}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleViewUser(user)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  {!isAdminUser(user) && (
                    <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTableView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>کاربر</TableHead>
          <TableHead>ایمیل</TableHead>
          <TableHead>موبایل</TableHead>
          <TableHead>بخش</TableHead>
          <TableHead>وضعیت</TableHead>
          <TableHead>تاریخ عضویت</TableHead>
          <TableHead className="text-left">عملیات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.display_name?.charAt(0) || user.first_name?.charAt(0) || 'ک'}
                </div>
                <div>
                  <p className="font-medium">{user.display_name || 'کاربر جدید'}</p>
                  <p className="text-sm text-gray-500">{user.first_name} {user.last_name}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="font-mono text-sm">{user.email}</TableCell>
            <TableCell className="font-mono text-sm">{user.mobile_phone}</TableCell>
            <TableCell>{user.department || '-'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'فعال' : 'غیرفعال'}
                </Badge>
                {isAdminUser(user) && (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    ادمین اصلی
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{new Date(user.created_at).toLocaleDateString('fa-IR')}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                    <Eye className="h-4 w-4 ml-2" />
                    مشاهده جزئیات
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Edit2 className="h-4 w-4 ml-2" />
                    ویرایش
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                    <Shield className="h-4 w-4 ml-2" />
                    مدیریت دسترسی
                  </DropdownMenuItem>
                  {!isAdminUser(user) && (
                    <DropdownMenuItem 
                      onClick={() => handleResetPassword(user)}
                      className="text-orange-600"
                    >
                      <KeyRound className="h-4 w-4 ml-2" />
                      بازنشانی رمز عبور
                    </DropdownMenuItem>
                  )}
                  {!isAdminUser(user) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            مدیریت کاربران
          </h1>
          <p className="text-gray-600 mt-2">
            مدیریت کاربران سیستم، نقش‌ها و مجوزات
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => handleManageRolePermissions('admin')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            مدیریت دسترسی نقش‌ها
          </Button>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            کاربر جدید
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو بر اساس نام، ایمیل یا شماره تماس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            لیست کاربران
            <Badge variant="secondary" className="mr-2">
              {filteredUsers.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            مدیریت اطلاعات و دسترسی‌های کاربران
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">در حال بارگذاری کاربران...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-semibold">خطا در بارگذاری اطلاعات</p>
                <p className="text-sm mt-2">ممکن است دیتابیس هنوز آماده نباشد</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? 'کاربری یافت نشد' : 'هنوز کاربری وجود ندارد'}
              </p>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'جستجوی خود را تغییر دهید یا فیلترها را بررسی کنید'
                  : 'برای شروع، اولین کاربر را ایجاد کنید'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-2">
                  <Plus className="h-4 w-4 ml-2" />
                  ایجاد اولین کاربر
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            renderGridView()
          ) : (
            renderTableView()
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSave={handleUpdateUser}
        isLoading={updateUser.isPending}
      />

      <UserDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        user={selectedUser}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              تایید حذف کاربر
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف کاربر <strong>{selectedUser?.display_name}</strong> اطمینان دارید؟
              این عمل قابل برگشت نیست و تمام اطلاعات کاربر پاک خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              حذف کاربر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-600" />
              بازنشانی رمز عبور
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از بازنشانی رمز عبور کاربر <strong>{selectedUser?.display_name}</strong> اطمینان دارید؟
              <br />
              رمز عبور موقت جدید تولید شده و در پیغام موفقیت نمایش داده خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetPassword}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              بازنشانی رمز عبور
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PermissionManagement
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
        selectedUserId={selectedUser?.id}
        selectedRole={selectedUserRole}
      />
    </div>
  );
}
