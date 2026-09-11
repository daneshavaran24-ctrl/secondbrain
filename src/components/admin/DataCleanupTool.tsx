import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Trash2, 
  Shield, 
  Database, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cleanupService } from '@/services/cleanupService';
import { useToast } from '@/hooks/use-toast';
import { PersianNumber } from "@/components/ui/persian-number";

interface CleanupStats {
  localStorageItems: number;
  supabaseRecords: {
    userProfiles: number;
    organizations: number;
    ideas: number;
    calendarEvents: number;
    knowledgeBase: number;
    gratitudeEntries: number;
    aiChatSessions: number;
    aiChatMessages: number;
    legalCases: number;
    legalDocuments: number;
    legalMeetings: number;
    
    organizationalMissions: number;
    organizationalPolicies: number;
    organizationalKpis: number;
    organizationClaims: number;
    delegationTasks: number;
    missionProgressLogs: number;
  };
}

export function DataCleanupTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [lastCleanupResult, setLastCleanupResult] = useState<any>(null);
  const { toast } = useToast();

  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname.includes('127.0.0.1');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      const statsData = await cleanupService.getCleanupStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "خطا در بارگذاری آمار",
        description: "مشکلی در دریافت آمار داده‌ها رخ داد",
        variant: "destructive"
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  const getTotalSupabaseRecords = () => {
    if (!stats) return 0;
    return Object.values(stats.supabaseRecords).reduce((sum, count) => sum + count, 0);
  };

  const hasTestData = () => {
    if (!stats) return false;
    return stats.localStorageItems > 0 || getTotalSupabaseRecords() > 0;
  };

  const handleCleanupClick = () => {
    if (!isDevelopment) {
      toast({
        title: "غیرفعال در Production",
        description: "پاکسازی فقط در محیط توسعه امکان‌پذیر است",
        variant: "destructive"
      });
      return;
    }
    setConfirmationStep(1);
  };

  const handleConfirmCleanup = async () => {
    if (confirmationStep < 3) {
      setConfirmationStep(confirmationStep + 1);
      return;
    }

    setIsLoading(true);
    setConfirmationStep(0);

    try {
      const result = await cleanupService.performFullCleanup();
      setLastCleanupResult(result);
      
      if (result.success) {
        toast({
          title: "✅ پاکسازی موفقیت‌آمیز",
          description: "تمام داده‌های تستی حذف شدند",
        });
        
        // Reload stats after successful cleanup
        setTimeout(loadStats, 1000);
      } else {
        toast({
          title: "⚠️ پاکسازی با خطا",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "❌ خطا در پاکسازی",
        description: "مشکلی در فرآیند پاکسازی رخ داد",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfirmationMessage = () => {
    switch (confirmationStep) {
      case 1: return "آیا مطمئن هستید که می‌خواهید تمام داده‌های تستی را حذف کنید؟";
      case 2: return "این عمل غیرقابل بازگشت است! آیا ادامه می‌دهید؟";
      case 3: return "برای تأیید نهایی، بر روی دکمه کلیک کنید";
      default: return "";
    }
  };

  if (!isDevelopment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            محافظت Production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ابزار پاکسازی فقط در محیط توسعه در دسترس است
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            پاکسازی داده‌های تستی
          </CardTitle>
          <CardDescription>
            حذف کامل داده‌های تستی از localStorage و دیتابیس Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Environment Warning */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>محیط توسعه تشخیص داده شد</strong> - این ابزار فقط در development فعال است
            </AlertDescription>
          </Alert>

          {/* Stats Loading */}
          {isStatsLoading ? (
            <div className="flex items-center gap-2 p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>در حال بارگذاری آمار...</span>
            </div>
          ) : (
            <>
              {/* localStorage Stats */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <h3 className="font-medium">localStorage</h3>
                </div>
                <Badge variant={stats?.localStorageItems ? "destructive" : "secondary"}>
                  <PersianNumber>{stats?.localStorageItems || 0}</PersianNumber> آیتم تستی
                </Badge>
              </div>

              {/* Supabase Stats */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <h3 className="font-medium">Supabase Database</h3>
                </div>
                
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(stats.supabaseRecords).map(([table, count]) => (
                      count > 0 && (
                        <Badge key={table} variant="secondary" className="justify-between">
                          <span className="text-xs">{table}</span>
                          <PersianNumber>{count}</PersianNumber>
                        </Badge>
                      )
                    ))}
                  </div>
                )}
                
                <Badge variant={getTotalSupabaseRecords() > 0 ? "destructive" : "secondary"}>
                  مجموع: <PersianNumber>{getTotalSupabaseRecords()}</PersianNumber> رکورد
                </Badge>
              </div>

              {/* Confirmation Steps */}
              {confirmationStep > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {getConfirmationMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCleanupClick}
                  disabled={!hasTestData() || isLoading || confirmationStep > 0}
                  variant={hasTestData() ? "destructive" : "secondary"}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      در حال پاکسازی...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {hasTestData() ? 'شروع پاکسازی' : 'داده تستی موجود نیست'}
                    </>
                  )}
                </Button>

                {confirmationStep > 0 && (
                  <>
                    <Button
                      onClick={handleConfirmCleanup}
                      variant="destructive"
                      disabled={isLoading}
                    >
                      {confirmationStep === 3 ? 'تأیید نهایی' : 'ادامه'}
                    </Button>
                    <Button
                      onClick={() => setConfirmationStep(0)}
                      variant="outline"
                      disabled={isLoading}
                    >
                      انصراف
                    </Button>
                  </>
                )}

                <Button
                  onClick={loadStats}
                  variant="outline"
                  disabled={isLoading}
                >
                  بروزرسانی
                </Button>
              </div>
            </>
          )}

          {/* Last Cleanup Result */}
          {lastCleanupResult && (
            <Alert>
              {lastCleanupResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>نتیجه:</strong> {lastCleanupResult.message}</div>
                  {lastCleanupResult.details.localStorage && (
                    <div>
                      <strong>localStorage:</strong> {lastCleanupResult.details.localStorage.removed} آیتم حذف شد
                    </div>
                  )}
                  {lastCleanupResult.details.supabase && (
                    <div>
                      <strong>Supabase:</strong> {Object.keys(lastCleanupResult.details.supabase.tables).length} جدول پاکسازی شد
                    </div>
                  )}
                  {lastCleanupResult.details.backupKey && (
                    <div className="text-sm text-muted-foreground">
                      Backup key: {lastCleanupResult.details.backupKey}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}