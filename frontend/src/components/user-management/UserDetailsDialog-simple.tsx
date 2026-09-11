import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, MapPin, Building, Calendar, IdCard } from 'lucide-react';
import { UserProfile } from '@/types/user-management';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfile | null;
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'نامشخص';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            جزئیات کاربر
          </DialogTitle>
          <DialogDescription>
            مشاهده اطلاعات کامل کاربر
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Avatar and Basic Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {user.display_name?.charAt(0) || user.first_name?.charAt(0) || 'ک'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'کاربر جدید'}
                  </h3>
                  <p className="text-gray-600 mb-2">{user.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    {user.email_verified && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        ایمیل تایید شده
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                اطلاعات تماس
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">ایمیل</p>
                    <p className="font-medium" dir="ltr">{user.email}</p>
                  </div>
                </div>
                
                {user.mobile_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">موبایل</p>
                      <p className="font-medium" dir="ltr">{user.mobile_phone}</p>
                    </div>
                  </div>
                )}

                {user.office_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">تلفن دفتر</p>
                      <p className="font-medium" dir="ltr">{user.office_phone}</p>
                    </div>
                  </div>
                )}

                {user.home_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">تلفن منزل</p>
                      <p className="font-medium" dir="ltr">{user.home_phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {user.address && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">آدرس</p>
                      <p className="font-medium">{user.address}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Work Information */}
          {(user.department || user.position || user.employee_id) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  اطلاعات شغلی
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.department && (
                    <div>
                      <p className="text-sm text-gray-600">بخش</p>
                      <p className="font-medium">{user.department}</p>
                    </div>
                  )}

                  {user.position && (
                    <div>
                      <p className="text-sm text-gray-600">سمت</p>
                      <p className="font-medium">{user.position}</p>
                    </div>
                  )}

                  {user.employee_id && (
                    <div>
                      <p className="text-sm text-gray-600">کد پرسنلی</p>
                      <p className="font-medium">{user.employee_id}</p>
                    </div>
                  )}

                  {user.hire_date && (
                    <div>
                      <p className="text-sm text-gray-600">تاریخ استخدام</p>
                      <p className="font-medium">{formatDate(user.hire_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          {(user.national_id || user.birth_date) && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  اطلاعات شخصی
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.national_id && (
                    <div>
                      <p className="text-sm text-gray-600">کد ملی</p>
                      <p className="font-medium" dir="ltr">{user.national_id}</p>
                    </div>
                  )}

                  {user.birth_date && (
                    <div>
                      <p className="text-sm text-gray-600">تاریخ تولد</p>
                      <p className="font-medium">{formatDate(user.birth_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                اطلاعات سیستم
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">تاریخ عضویت</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">آخرین به‌روزرسانی</p>
                  <p className="font-medium">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {user.bio && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">درباره</h4>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}