import { MeetingResolution } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ResolutionReportGeneratorProps {
  resolutions: MeetingResolution[];
}

export const ResolutionReportGenerator = ({ resolutions }: ResolutionReportGeneratorProps) => {
  const [reportType, setReportType] = useState<string>('all');
  const { toast } = useToast();

  const getFilteredResolutions = () => {
    switch (reportType) {
      case 'by_status':
        return resolutions.reduce((acc, r) => {
          if (!acc[r.status]) acc[r.status] = [];
          acc[r.status].push(r);
          return acc;
        }, {} as Record<string, MeetingResolution[]>);
      case 'overdue':
        return resolutions.filter(r => 
          r.due_date && 
          new Date(r.due_date) < new Date() && 
          r.status !== 'completed'
        );
      case 'completed':
        return resolutions.filter(r => r.status === 'completed');
      default:
        return resolutions;
    }
  };

  const exportToCSV = () => {
    const filtered = getFilteredResolutions();
    const data = Array.isArray(filtered) ? filtered : Object.values(filtered).flat();

    const headers = ['عنوان', 'شرح', 'وضعیت', 'اولویت', 'مسئول', 'مهلت', 'پیشرفت'];
    const rows = data.map(r => [
      r.title,
      r.description,
      r.status,
      r.priority,
      r.responsible_parties?.[0]?.user_name || r.responsible_party,
      r.due_date || '-',
      `${r.progress || 0}%`
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resolutions-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'موفقیت',
      description: 'گزارش CSV دانلود شد'
    });
  };

  const exportToJSON = () => {
    const filtered = getFilteredResolutions();
    const json = JSON.stringify(filtered, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resolutions-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'موفقیت',
      description: 'گزارش JSON دانلود شد'
    });
  };

  const exportToText = () => {
    const filtered = getFilteredResolutions();
    const data = Array.isArray(filtered) ? filtered : Object.values(filtered).flat();

    let text = `گزارش مصوبات جلسات\n`;
    text += `تاریخ تهیه: ${new Date().toLocaleDateString('fa-IR')}\n`;
    text += `تعداد مصوبات: ${data.length}\n`;
    text += `${'='.repeat(50)}\n\n`;

    data.forEach((r, index) => {
      text += `${index + 1}. ${r.title}\n`;
      text += `   وضعیت: ${r.status}\n`;
      text += `   اولویت: ${r.priority}\n`;
      text += `   مسئول: ${r.responsible_parties?.[0]?.user_name || r.responsible_party}\n`;
      if (r.due_date) text += `   مهلت: ${new Date(r.due_date).toLocaleDateString('fa-IR')}\n`;
      text += `   پیشرفت: ${r.progress || 0}%\n`;
      if (r.description) text += `   شرح: ${r.description}\n`;
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resolutions-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'موفقیت',
      description: 'گزارش متنی دانلود شد'
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">گزارش‌گیری و خروجی</h3>
          
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه مصوبات</SelectItem>
              <SelectItem value="by_status">بر اساس وضعیت</SelectItem>
              <SelectItem value="overdue">عقب‌افتاده‌ها</SelectItem>
              <SelectItem value="completed">تکمیل شده‌ها</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            خروجی CSV
          </Button>
          <Button onClick={exportToText} variant="outline">
            <FileText className="h-4 w-4 ml-2" />
            خروجی متنی
          </Button>
          <Button onClick={exportToJSON} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            خروجی JSON
          </Button>
        </div>
      </div>
    </Card>
  );
};