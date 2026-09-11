import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  Settings, 
  Lock, 
  Unlock,
  CheckCircle,
  XCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import { SystemRole, ROLE_NAMES } from '@/types/user-management';
import { SYSTEM_MODULES } from '@/utils/roleAccess';
import { useToast } from '@/hooks/use-toast';

interface PermissionManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  selectedRole?: SystemRole;
}

interface ModulePermission {
  moduleId: string;
  moduleName: string;
  hasAccess: boolean;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage: boolean;
  };
}

interface RolePermissions {
  [key: string]: ModulePermission[];
}

// مجوزات پیش‌فرض برای هر نقش
const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: SYSTEM_MODULES.map(module => ({
    moduleId: module.id,
    moduleName: module.displayName,
    hasAccess: true,
    actions: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      manage: true,
    }
  })),
  general_manager: SYSTEM_MODULES.filter(m => m.category !== 'admin').map(module => ({
    moduleId: module.id,
    moduleName: module.displayName,
    hasAccess: true,
    actions: {
      view: true,
      create: true,
      edit: true,
      delete: module.category !== 'core',
      manage: false,
    }
  })),
  department_manager: SYSTEM_MODULES.filter(m => 
    m.category === 'core' || m.category === 'collaboration' || m.category === 'planning'
  ).map(module => ({
    moduleId: module.id,
    moduleName: module.displayName,
    hasAccess: true,
    actions: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      manage: false,
    }
  })),
  user: SYSTEM_MODULES.filter(m => 
    m.category === 'core' || m.category === 'collaboration'
  ).map(module => ({
    moduleId: module.id,
    moduleName: module.displayName,
    hasAccess: true,
    actions: {
      view: true,
      create: module.id !== 'dashboard',
      edit: module.id !== 'dashboard',
      delete: false,
      manage: false,
    }
  })),
  secretary: SYSTEM_MODULES.filter(m => 
    ['dashboard', 'calendar', 'meetings', 'tasks'].includes(m.id)
  ).map(module => ({
    moduleId: module.id,
    moduleName: module.displayName,
    hasAccess: true,
    actions: {
      view: true,
      create: module.id === 'meetings' || module.id === 'calendar',
      edit: module.id === 'meetings' || module.id === 'calendar',
      delete: false,
      manage: false,
    }
  })),
};

export default function PermissionManagement({
  open,
  onOpenChange,
  selectedUserId,
  selectedRole,
}: PermissionManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('role-permissions');
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<SystemRole>('user');
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      setSelectedRoleForEdit(selectedRole);
      setActiveTab('role-permissions');
    } else if (selectedUserId) {
      setActiveTab('user-permissions');
    }
  }, [selectedRole, selectedUserId]);

  const handleModuleAccessChange = (
    role: SystemRole,
    moduleId: string,
    hasAccess: boolean
  ) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: prev[role].map(module =>
        module.moduleId === moduleId
          ? { ...module, hasAccess }
          : module
      )
    }));
    setHasChanges(true);
  };

  const handleActionChange = (
    role: SystemRole,
    moduleId: string,
    action: keyof ModulePermission['actions'],
    enabled: boolean
  ) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: prev[role].map(module =>
        module.moduleId === moduleId
          ? {
              ...module,
              actions: {
                ...module.actions,
                [action]: enabled
              }
            }
          : module
      )
    }));
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    try {
      // اینجا باید API call برای ذخیره دسترسی‌ها انجام شود
      console.log('Saving permissions:', rolePermissions);
      
      toast({
        title: "موفق",
        description: "دسترسی‌ها با موفقیت ذخیره شد",
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ذخیره دسترسی‌ها",
        variant: "destructive",
      });
    }
  };

  const handleResetPermissions = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setHasChanges(false);
    toast({
      title: "بازنشانی",
      description: "دسترسی‌ها به حالت پیش‌فرض بازگردانده شد",
    });
  };

  const ActionIcon = ({ enabled }: { enabled: boolean }) => (
    enabled ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            مدیریت دسترسی‌ها
          </DialogTitle>
          <DialogDescription>
            تنظیم سطح دسترسی نقش‌ها و کاربران به بخش‌های مختلف سیستم
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="role-permissions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              دسترسی نقش‌ها
            </TabsTrigger>
            <TabsTrigger value="user-permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              دسترسی کاربران
            </TabsTrigger>
          </TabsList>

          <TabsContent value="role-permissions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRoleForEdit}
                  onValueChange={(value) => setSelectedRoleForEdit(value as SystemRole)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_NAMES).map(([role, name]) => (
                      <SelectItem key={role} value={role}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline">
                  {rolePermissions[selectedRoleForEdit]?.length || 0} ماژول
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPermissions}
                  disabled={!hasChanges}
                >
                  <RotateCcw className="h-4 w-4 ml-2" />
                  بازنشانی
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePermissions}
                  disabled={!hasChanges}
                >
                  <Save className="h-4 w-4 ml-2" />
                  ذخیره تغییرات
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {rolePermissions[selectedRoleForEdit]?.map((module, index) => (
                <Card key={module.moduleId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={module.hasAccess}
                            onCheckedChange={(checked) =>
                              handleModuleAccessChange(selectedRoleForEdit, module.moduleId, checked)
                            }
                          />
                          {module.hasAccess ? (
                            <Unlock className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <CardTitle className="text-base">{module.moduleName}</CardTitle>
                      </div>
                      <Badge variant={module.hasAccess ? "default" : "secondary"}>
                        {module.hasAccess ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                  </CardHeader>

                  {module.hasAccess && (
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-5 gap-4">
                        {Object.entries(module.actions).map(([action, enabled]) => (
                          <div key={action} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">
                              {action === 'view' && 'مشاهده'}
                              {action === 'create' && 'ایجاد'}
                              {action === 'edit' && 'ویرایش'}
                              {action === 'delete' && 'حذف'}
                              {action === 'manage' && 'مدیریت'}
                            </span>
                            <div className="flex items-center gap-2">
                              <ActionIcon enabled={enabled} />
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) =>
                                  handleActionChange(selectedRoleForEdit, module.moduleId, action as keyof ModulePermission['actions'], checked)
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="user-permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>دسترسی‌های اختصاصی کاربر</CardTitle>
                <DialogDescription>
                  دسترسی‌های اختصاصی که بر دسترسی‌های نقش اولویت دارند
                </DialogDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  این بخش در نسخه بعدی پیاده‌سازی خواهد شد
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
