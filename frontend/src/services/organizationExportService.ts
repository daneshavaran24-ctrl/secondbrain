import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { organizationStatsService } from './organizationStatsService';
import { organizationService } from './organizationService';
import { toast } from 'sonner';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

class OrganizationExportService {
  /**
   * Export به PDF
   */
  async exportToPDF(
    organizationId: string,
    reportType: 'stats' | 'activities' | 'full' = 'full'
  ): Promise<void> {
    try {
      toast.info('در حال تولید گزارش PDF...');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // دریافت اطلاعات سازمان
      const organization = await organizationService.getOrganizationById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // تنظیم فونت (از فونت‌های پیش‌فرض استفاده می‌کنیم)
      doc.setFont('helvetica');
      doc.setFontSize(20);
      doc.text(organization.name, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Report Date: ${new Date().toLocaleDateString('fa-IR')}`, 20, 30);

      let yPosition = 40;

      // آمار سازمان
      if (reportType === 'stats' || reportType === 'full') {
        const stats = await organizationStatsService.getOrganizationStats(organizationId);
        
        doc.setFontSize(16);
        doc.text('Statistics', 20, yPosition);
        yPosition += 10;

        doc.autoTable({
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: [
            ['Members', stats.totalMembers.toString()],
            ['Projects', stats.totalProjects.toString()],
            ['Tasks', stats.totalTasks.toString()],
            ['Meetings', stats.totalMeetings.toString()],
          ],
          theme: 'striped',
          styles: { font: 'helvetica', fontSize: 10 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // فعالیت‌های اخیر
      if (reportType === 'activities' || reportType === 'full') {
        const activities = await organizationStatsService.getRecentActivities(organizationId, 20);
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('Recent Activities', 20, yPosition);
        yPosition += 10;

        const activitiesData = activities.map(activity => [
          activity.type,
          activity.description,
          new Date(activity.timestamp).toLocaleDateString('fa-IR'),
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Type', 'Description', 'Date']],
          body: activitiesData,
          theme: 'striped',
          styles: { font: 'helvetica', fontSize: 9 },
        });
      }

      // ذخیره PDF
      const fileName = `${organization.name}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('گزارش PDF با موفقیت ایجاد شد');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('خطا در ایجاد گزارش PDF');
    }
  }

  /**
   * Export به Excel
   */
  async exportToExcel(
    organizationId: string,
    reportType: 'stats' | 'activities' | 'full' = 'full'
  ): Promise<void> {
    try {
      toast.info('در حال تولید گزارش Excel...');

      const organization = await organizationService.getOrganizationById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const workbook = XLSX.utils.book_new();

      // آمار سازمان
      if (reportType === 'stats' || reportType === 'full') {
        const stats = await organizationStatsService.getOrganizationStats(organizationId);
        
        const statsData = [
          ['معیار', 'مقدار'],
          ['اعضا', stats.totalMembers],
          ['پروژه‌ها', stats.totalProjects],
          ['وظایف', stats.totalTasks],
          ['جلسات', stats.totalMeetings],
        ];

        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'آمار');
      }

      // چارت پروژه‌ها
      if (reportType === 'full') {
        const chartData = await organizationStatsService.getProjectsChartData(organizationId);
        
        const projectsData = [
          ['وضعیت', 'تعداد'],
          ...chartData.map(item => [item.name, item.value])
        ];

        const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
        XLSX.utils.book_append_sheet(workbook, projectsSheet, 'پروژه‌ها');
      }

      // فعالیت‌های اخیر
      if (reportType === 'activities' || reportType === 'full') {
        const activities = await organizationStatsService.getRecentActivities(organizationId, 50);
        
        const activitiesData = [
          ['نوع', 'توضیحات', 'کاربر', 'تاریخ'],
          ...activities.map(activity => [
            activity.type,
            activity.description,
            activity.user || '-',
            new Date(activity.timestamp).toLocaleDateString('fa-IR')
          ])
        ];

        const activitiesSheet = XLSX.utils.aoa_to_sheet(activitiesData);
        XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'فعالیت‌ها');
      }

      // ذخیره Excel
      const fileName = `${organization.name}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('گزارش Excel با موفقیت ایجاد شد');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('خطا در ایجاد گزارش Excel');
    }
  }

  /**
   * Export اعضا به Excel
   */
  async exportMembersToExcel(organizationId: string, members: any[]): Promise<void> {
    try {
      toast.info('در حال تولید لیست اعضا...');

      const organization = await organizationService.getOrganizationById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const membersData = [
        ['ایمیل', 'نام', 'نقش', 'تاریخ پیوستن'],
        ...members.map(member => [
          member.profiles?.email || '-',
          member.profiles?.display_name || '-',
          member.role,
          new Date(member.joined_at).toLocaleDateString('fa-IR')
        ])
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(membersData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'اعضا');

      const fileName = `${organization.name}_members_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('لیست اعضا با موفقیت ایجاد شد');
    } catch (error) {
      console.error('Error exporting members:', error);
      toast.error('خطا در ایجاد لیست اعضا');
    }
  }
}

export const organizationExportService = new OrganizationExportService();
