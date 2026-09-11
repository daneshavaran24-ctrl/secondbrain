import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUserManagement } from '@/hooks/useUserManagement';
import { ROLE_NAMES } from '@/types/user-management';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  IdCard,
} from 'lucide-react';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function UserDetailsDialog({ open, onOpenChange, userId }: UserDetailsDialogProps) {
  const { useUser } = useUserManagement();
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="mr-2">در حال دریافت اطلاعات...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user || 'message' in user || 'error' in user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">کاربر یافت نشد</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const userRole = 'user_roles' in user ? (user as any).user_roles?.[0] : undefined;
  const userData = user as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            جزئیات کاربر
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* اطلاعات اصلی کاربر */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {userData.name || 'بدون نام'}
                    </h3>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {userRole && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 ml-1" />
                      {typeof userRole === 'string' ? ROLE_NAMES[userRole] : (typeof userRole === 'object' && userRole !== null && 'system_role' in userRole ? ROLE_NAMES[(userRole as any).system_role] : 'نامشخص')}
                    </Badge>
                  )}
                  <Badge variant={userData.is_active ? "default" : "destructive"}>
                    {userData.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 ml-1" />
                        فعال
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 ml-1" />
                        غیرفعال
                      </>
                    )}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اطلاعات تماس */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  اطلاعات تماس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">ایمیل</p>
                    <p className="font-medium">{userData.email || 'ایمیل موجود نیست'}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تلفن همراه</p>
                    <p className="font-medium">{userData.mobile_phone || 'تلفن همراه موجود نیست'}</p>
                  </div>
                </div>

                {userData.office_phone && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">تلفن اداری</p>
                        <p className="font-medium">{userData.office_phone}</p>
                      </div>
                    </div>
                  </>
                )}

                {userData.home_phone && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">تلفن منزل</p>
                        <p className="font-medium">{userData.home_phone}</p>
                      </div>
                    </div>
                  </>
                )}

                {userData.address && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">آدرس</p>
                        <p className="font-medium">{userData.address}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* اطلاعات اداری */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  اطلاعات اداری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.national_id && (
                  <div className="flex items-center gap-3">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">کد ملی</p>
                      <p className="font-medium">{userData.national_id}</p>
                    </div>
                  </div>
                )}

                {userData.department && (
                  <>
                    {userData.national_id && <Separator />}
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">بخش</p>
                        <p className="font-medium">{userData.department}</p>
                      </div>
                    </div>
                  </>
                )}

                {userData.position && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">سمت</p>
                        <p className="font-medium">{userData.position}</p>
                      </div>
                    </div>
                  </>
                )}

                {userRole && typeof userRole === 'object' && 'organization' in userRole && userRole.organization && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">سازمان</p>
                        <p className="font-medium">{(() => {
                          if (userRole && typeof userRole === 'object' && userRole !== null && 'organization' in userRole) {
                            const org = (userRole as any).organization;
                            return org && typeof org === 'object' && 'name' in org ? org.name : '';
                          }
                          return '';
                        })()}</p>
                      </div>
                    </div>
                  </>
                )}
                {userData.hire_date && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">تاریخ استخدام</p>
                        <p className="font-medium">
                          {userData.hire_date ? new Date(userData.hire_date).toLocaleDateString('fa-IR') : ''}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* اطلاعات سیستمی */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات سیستمی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">تاریخ ایجاد</p>
                <p className="font-medium">
                  {userData.created_at ? new Date(userData.created_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">آخرین بروزرسانی</p>
                <p className="font-medium">
                  {userData.updated_at ? new Date(userData.updated_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">وضعیت تأیید ایمیل</p>
                <p className={`font-medium ${userData.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {userData.email_verified ? 'تأیید شده' : 'تأیید نشده'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* بیوگرافی */}
          {userData.bio && (
            <Card>
              <CardHeader>
                <CardTitle>بیوگرافی</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{userData.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
