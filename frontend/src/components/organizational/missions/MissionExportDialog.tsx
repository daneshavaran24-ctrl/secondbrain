import React, { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import organizationalMissionService, { ExportData } from '@/services/organizationalMissionService';

interface MissionExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
}

const MissionExportDialog: React.FC<MissionExportDialogProps> = ({
  open,
  onOpenChange,
  organizationName
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setIsExporting(true);
      const exportData = await organizationalMissionService.exportMissionsData();
      
      if (format === 'json') {
        downloadJSON(exportData);
      } else {
        downloadCSV(exportData);
      }

      toast({
        title: 'موفقیت',
        description: `گزارش با فرمت ${format.toUpperCase()} دانلود شد`
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در تولید گزارش',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data: ExportData) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مأموریت‌ها-${organizationName}-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: ExportData) => {
    const headers = [
      'عنوان',
      'توضیحات',
      'وضعیت',
      'اولویت',
      'پیشرفت',
      'پیشرفت مورد انتظار',
      'وضعیت پیشرفت',
      'ضرب‌الاجل',
      'مسئول',
      'تاریخ ایجاد'
    ];

    const csvContent = [
      headers.join(','),
      ...data.missions.map(mission => [
        `"${mission.title}"`,
        `"${mission.description || ''}"`,
        `"${mission.status}"`,
        mission.progress || 0,
        mission.target_value || 0,
        mission.current_value || 0,
        mission.start_date || '',
        mission.end_date || '',
        new Date(mission.created_at).toLocaleDateString('fa-IR')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مأموریت‌ها-${organizationName}-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            صادرات گزارش مأموریت‌ها
          </DialogTitle>
          <DialogDescription>
            گزارش جامع از وضعیت مأموریت‌های {organizationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">فایل JSON</h4>
                  <p className="text-sm text-muted-foreground">
                    حاوی تمام اطلاعات کامل شامل آمار و جزئیات
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? 'در حال تولید گزارش...' : 'دانلود JSON'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium">فایل CSV</h4>
                  <p className="text-sm text-muted-foreground">
                    مناسب برای تحلیل در Excel یا سایر نرم‌افزارها
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? 'در حال تولید گزارش...' : 'دانلود CSV'}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 inline mr-1" />
            تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissionExportDialog;