import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { organizationalPolicyService, type ExportData } from '@/services/organizationalPolicyService';

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  onDataImported?: () => void;
}

export function ExportImportDialog({
  open,
  onOpenChange,
  organizationName,
  onDataImported
}: ExportImportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const exportToJSON = async () => {
    setExporting(true);
    try {
      const data = await organizationalPolicyService.exportData(organizationName);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organizational-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('داده‌ها با موفقیت صادر شد');
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast.error('خطا در صادرات داده‌ها');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const data = await organizationalPolicyService.exportData(organizationName);
      
      // Convert to CSV format
      const csvContent = generateCSV(data);
      
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organizational-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('فایل CSV با موفقیت صادر شد');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('خطا در صادرات CSV');
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (data: ExportData): string => {
    let csv = '';
    
    // Missions section
    if (data.missions.length > 0) {
      csv += '=== مأموریت‌ها ===\n';
      csv += 'عنوان,توضیحات,وضعیت,پیشرفت,تاریخ شروع,تاریخ پایان,تاریخ ایجاد\n';
      data.missions.forEach(mission => {
        csv += `"${mission.title}","${mission.description || ''}","${mission.status}",${mission.progress || 0},"${mission.start_date || ''}","${mission.end_date || ''}","${mission.created_at}"\n`;
      });
      csv += '\n';
    }
    
    // Policies section
    if (data.policies.length > 0) {
      csv += '=== سیاست‌ها ===\n';
      csv += 'عنوان,توضیحات,نوع,وضعیت,تاریخ اجرا,تاریخ بازبینی,تاریخ ایجاد\n';
      data.policies.forEach(policy => {
        csv += `"${policy.title}","${policy.description || ''}","${policy.policy_type || ''}","${policy.status}","${policy.effective_date || ''}","${policy.review_date || ''}","${policy.created_at}"\n`;
      });
      csv += '\n';
    }
    
    // KPIs section
    if (data.kpis.length > 0) {
      csv += '=== شاخص‌های عملکرد ===\n';
      csv += 'عنوان,توضیحات,هدف,مقدار فعلی,واحد,تاریخ ایجاد\n';
      data.kpis.forEach(kpi => {
        csv += `"${kpi.title}","${kpi.description || ''}",${kpi.target_value},${kpi.current_value},"${kpi.unit}","${kpi.created_at}"\n`;
      });
      csv += '\n';
    }
    
    return csv;
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      if (file.type === 'application/json') {
        await importFromJSON(file);
      } else {
        toast.error('فقط فایل‌های JSON پشتیبانی می‌شوند');
        return;
      }
      
      onDataImported?.();
      toast.success('داده‌ها با موفقیت وارد شدند');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('خطا در وارد کردن داده‌ها');
    } finally {
      setImporting(false);
    }
  };

  const importFromJSON = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as ExportData;
          
          // Validate data structure
          if (!data.missions && !data.policies && !data.kpis && !data.approvalWorkflows) {
            throw new Error('فرمت فایل نامعتبر است');
          }
          
          // Import each type of data
          let importCount = 0;
          
          if (data.missions) {
            for (const mission of data.missions) {
              try {
                await organizationalPolicyService.createMission({
                  title: mission.title,
                  description: mission.description,
                  status: mission.status,
                  progress: mission.progress,
                  start_date: mission.start_date,
                  end_date: mission.end_date,
                  target_value: mission.target_value,
                  current_value: mission.current_value,
                  unit: mission.unit,
                  policy_id: mission.policy_id
                });
                importCount++;
              } catch (error) {
                console.error('Error importing mission:', error);
              }
            }
          }
          
          if (data.policies) {
            for (const policy of data.policies) {
              try {
                await organizationalPolicyService.createPolicy({
                  title: policy.title,
                  description: policy.description,
                  policy_type: policy.policy_type,
                  status: policy.status,
                  effective_date: policy.effective_date,
                  review_date: policy.review_date
                });
                importCount++;
              } catch (error) {
                console.error('Error importing policy:', error);
              }
            }
          }
          
          if (data.kpis) {
            for (const kpi of data.kpis) {
              try {
                await organizationalPolicyService.createKPI({
                  title: kpi.title,
                  description: kpi.description,
                  target_value: kpi.target_value,
                  current_value: kpi.current_value,
                  unit: kpi.unit,
                  user_id: kpi.user_id
                });
                importCount++;
              } catch (error) {
                console.error('Error importing KPI:', error);
              }
            }
          }
          
          if (data.approvalWorkflows) {
            for (const workflow of data.approvalWorkflows) {
              try {
                await organizationalPolicyService.createApprovalWorkflow({
                  title: workflow.title,
                  description: workflow.description,
                  workflow_type: workflow.workflow_type,
                  status: workflow.status,
                  user_id: workflow.user_id
                });
                importCount++;
              } catch (error) {
                console.error('Error importing approval workflow:', error);
              }
            }
          }
          
          resolve(`${importCount} آیتم وارد شد`);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
      reader.readAsText(file);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-right">صادرات و وارد کردن داده‌ها</DialogTitle>
          <DialogDescription className="text-right">
            داده‌های سازمانی خود را صادر یا وارد کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse text-right">
                <Download className="w-5 h-5" />
                <span>صادرات داده‌ها</span>
              </CardTitle>
              <CardDescription className="text-right">
                تمام داده‌های سازمانی را در فرمت‌های مختلف دانلود کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={exportToJSON}
                  disabled={exporting}
                  className="h-20 flex-col space-y-2"
                >
                  {exporting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                  <span>JSON فایل</span>
                  <span className="text-xs text-muted-foreground">
                    برای پشتیبان‌گیری کامل
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={exporting}
                  className="h-20 flex-col space-y-2"
                >
                  {exporting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                  <span>CSV فایل</span>
                  <span className="text-xs text-muted-foreground">
                    برای اکسل و گزارش
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse text-right">
                <Upload className="w-5 h-5" />
                <span>وارد کردن داده‌ها</span>
              </CardTitle>
              <CardDescription className="text-right">
                داده‌های قبلی خود را از فایل JSON وارد کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-right">
                  <strong>توجه:</strong> وارد کردن داده‌ها ممکن است با داده‌های موجود تداخل داشته باشد.
                  پیشنهاد می‌شود قبل از وارد کردن، از داده‌های فعلی پشتیبان‌گیری کنید.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="import-file" className="text-right">
                  انتخاب فایل JSON
                </Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  disabled={importing}
                />
              </div>

              {importing && (
                <div className="flex items-center space-x-2 space-x-reverse justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال وارد کردن...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}