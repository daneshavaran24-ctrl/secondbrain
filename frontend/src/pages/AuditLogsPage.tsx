import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuditLogs } from "@/hooks/useSubUsers";
import { format } from "date-fns-jalali";
import { Shield, Clock, User, Activity } from "lucide-react";

export default function AuditLogsPage() {
  const { data: auditLogs, isLoading } = useAuditLogs();

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create')) return 'default';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('update') || action.includes('activate')) return 'secondary';
    return 'outline';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'create_sub_user': 'ایجاد کاربر فرعی',
      'update_sub_user': 'ویرایش کاربر فرعی',
      'delete_sub_user': 'حذف کاربر فرعی',
      'activate_sub_user': 'فعال‌سازی کاربر',
      'deactivate_sub_user': 'غیرفعال‌سازی کاربر',
      'login': 'ورود',
      'logout': 'خروج',
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return <div className="container max-w-6xl mx-auto p-6 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">لاگ‌های امنیتی</h1>
          <p className="text-muted-foreground">
            پیگیری تمام عملیات کاربران و تغییرات سیستم
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            گزارش فعالیت‌ها
          </CardTitle>
          <CardDescription>
            تاریخچه کامل عملیات انجام شده توسط کاربران
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              هنوز فعالیتی ثبت نشده است
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <User className="h-3 w-3" />
                          {log.actor_type === 'owner' ? 'مالک' : 
                           log.actor_type === 'sub_user' ? 'کاربر فرعی' : 'ادمین'}
                        </Badge>
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <div className="font-mono text-xs bg-muted p-2 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        </div>
                      )}
                      
                      {log.ip_address && (
                        <div className="text-xs text-muted-foreground">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <div className="text-left">
                        <div>{format(new Date(log.created_at), 'yyyy/MM/dd')}</div>
                        <div className="text-xs">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
