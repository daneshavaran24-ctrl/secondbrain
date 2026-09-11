import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  usePermissionManagement, 
  useUserManagement 
} from '@/hooks/useUserManagement';
import { PERMISSION_CATEGORIES, PermissionCategory } from '@/types/user-management';
import { 
  Key, 
  Plus, 
  Trash2, 
  Shield, 
  CheckCircle, 
  XCircle,
  Filter,
  Search
} from 'lucide-react';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function UserPermissionsDialog({ open, onOpenChange, userId }: UserPermissionsDialogProps) {
  const { useUser } = useUserManagement();
  const { 
    useSystemPermissions, 
    useUserPermissions, 
    assignUserPermission, 
    removeUserPermission 
  } = usePermissionManagement();

  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState('');
  const [accessType, setAccessType] = useState<'allow' | 'deny'>('allow');
  const [reason, setReason] = useState('');

  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: systemPermissions, isLoading: permissionsLoading } = useSystemPermissions();
  const { data: userPermissions, isLoading: userPermissionsLoading } = useUserPermissions(userId);

  // فیلتر کردن دسترسی‌ها
  const filteredPermissions = systemPermissions?.filter(permission => {
    const categoryMatch = selectedCategory === 'all' || permission.category === selectedCategory;
    const searchMatch = searchTerm === '' || 
      permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permission_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && searchMatch;
  }) || [];

  const handleAssignPermission = async () => {
    if (!selectedPermission) return;

    try {
      await assignUserPermission.mutateAsync({
        userId,
        permissionId: selectedPermission,
        accessType,
        reason: reason || undefined,
      });
      
      setShowAssignDialog(false);
      setSelectedPermission('');
      setReason('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      await removeUserPermission.mutateAsync({ userId, permissionId });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getPermissionBadgeColor = (accessType: 'allow' | 'deny') => {
    return accessType === 'allow' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  if (userLoading || permissionsLoading || userPermissionsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl" dir="rtl">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            مدیریت دسترسی‌های کاربر
          </DialogTitle>
          <DialogDescription>
            دسترسی‌های ویژه این کاربر را مدیریت کنید. این دسترسی‌ها بر دسترسی‌های نقش اولویت دارند.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* اطلاعات کاربر */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اطلاعات کاربر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {(user && 'name' in user && user.name)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {(user && 'name' in user && typeof user.name === 'string' ? user.name : null) || 'بدون نام'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user && 'description' in user && typeof user.description === 'string' ? user.description : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* دسترسی‌های فعلی کاربر */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  دسترسی‌های اختصاصی ({userPermissions?.length || 0})
                </div>
                <Button 
                  onClick={() => setShowAssignDialog(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن دسترسی
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userPermissions && userPermissions.length > 0 ? (
                <div className="space-y-2">
                  {userPermissions.map((userPerm) => (
                    <div key={userPerm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getPermissionBadgeColor(userPerm.access_type)}>
                          {userPerm.access_type === 'allow' ? (
                            <>
                              <CheckCircle className="h-3 w-3 ml-1" />
                              اجازه
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 ml-1" />
                              منع
                            </>
                          )}
                        </Badge>
                        <div>
                          <p className="font-medium">{userPerm.permission?.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {userPerm.permission?.module_name}.{userPerm.permission?.permission_name}
                          </p>
                          {userPerm.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              دلیل: {userPerm.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(userPerm.created_at).toLocaleDateString('fa-IR')}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePermission(userPerm.permission_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2" />
                  <p>هیچ دسترسی اختصاصی تعریف نشده است</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* فرم افزودن دسترسی */}
          {showAssignDialog && (
            <Card>
              <CardHeader>
                <CardTitle>افزودن دسترسی جدید</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* فیلترها */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="جستجوی دسترسی..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    
                    <Select 
                      value={selectedCategory} 
                      onValueChange={(value) => setSelectedCategory(value as PermissionCategory | 'all')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب دسته‌بندی" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه دسته‌ها</SelectItem>
                        {Object.entries(PERMISSION_CATEGORIES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* انتخاب دسترسی */}
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>انتخاب</TableHead>
                          <TableHead>دسترسی</TableHead>
                          <TableHead>ماژول</TableHead>
                          <TableHead>دسته‌بندی</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPermissions.map((permission) => (
                          <TableRow 
                            key={permission.id}
                            className={selectedPermission === permission.id ? 'bg-muted' : ''}
                          >
                            <TableCell>
                              <input
                                type="radio"
                                name="permission"
                                value={permission.id}
                                checked={selectedPermission === permission.id}
                                onChange={(e) => setSelectedPermission(e.target.value)}
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{permission.display_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {permission.module_name}.{permission.permission_name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {PERMISSION_CATEGORIES[permission.category as PermissionCategory]}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* تنظیمات دسترسی */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">نوع دسترسی</label>
                      <Select value={accessType} onValueChange={(value) => setAccessType(value as 'allow' | 'deny')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allow">اجازه دادن</SelectItem>
                          <SelectItem value="deny">منع کردن</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">دلیل (اختیاری)</label>
                    <Textarea
                      placeholder="دلیل تخصیص این دسترسی را توضیح دهید..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAssignPermission}
                      disabled={!selectedPermission || assignUserPermission.isPending}
                    >
                      {assignUserPermission.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          در حال افزودن...
                        </>
                      ) : (
                        'افزودن دسترسی'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAssignDialog(false)}
                    >
                      لغو
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
