import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns-jalali";
import { Clock, Activity } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
}

const ACTION_LABELS: Record<string, string> = {
  login: 'ورود',
  logout: 'خروج',
  password_changed: 'تغییر رمز عبور',
  profile_updated: 'به‌روزرسانی پروفایل',
  sub_user_created: 'ایجاد کاربر فرعی',
  sub_user_updated: 'به‌روزرسانی کاربر فرعی',
  sub_user_deleted: 'حذف کاربر فرعی'
};

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-green-500/10 text-green-500 border-green-500/20',
  logout: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  password_changed: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  profile_updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  sub_user_created: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  sub_user_updated: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  sub_user_deleted: 'bg-red-500/10 text-red-500 border-red-500/20'
};

export function ActivityLogSection() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadActivityLogs();
    }
  }, [user]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auth_audit')
        .select('*')
        .eq('actor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">در حال بارگذاری...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          تاریخچه فعالیت
        </CardTitle>
        <CardDescription>
          آخرین 20 فعالیت شما در سیستم
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هیچ فعالیتی ثبت نشده است
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={ACTION_COLORS[log.action] || 'bg-gray-500/10 text-gray-500'}
                    >
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'yyyy/MM/dd - HH:mm:ss')}
                    </span>
                  </div>
                  
                  {log.ip_address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      IP: {log.ip_address}
                    </p>
                  )}
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
