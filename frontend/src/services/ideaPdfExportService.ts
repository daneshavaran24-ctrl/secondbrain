// Professional PDF Export Service for Ideas
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { drawBarChart, drawPieChart, drawProgressBar } from '@/utils/pdfCharts';

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface IdeaData {
  id?: string;
  title: string;
  description: string;
  domain: string;
  stage?: string;
  priority: string;
  feasibility_score?: number;
  impact_score?: number;
  created_at?: string;
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    overallAssessment?: string;
    priorityActions?: string[];
  };
  idea_risks?: Array<{
    risk_description: string;
    severity: string;
    mitigation_strategy?: string;
  }>;
  idea_milestones?: Array<{
    title: string;
    description?: string;
    target_date?: string;
    status: string;
  }>;
}

export interface PdfExportOptions {
  template: 'executive' | 'detailed' | 'comparison';
  includeLogo?: boolean;
  includeSWOT?: boolean;
  includeRisks?: boolean;
  includeCharts?: boolean;
  language?: 'fa' | 'en';
}

export class IdeaPdfExportService {
  private static readonly FONT_SIZE_TITLE = 20;
  private static readonly FONT_SIZE_HEADING = 16;
  private static readonly FONT_SIZE_SUBHEADING = 12;
  private static readonly FONT_SIZE_BODY = 10;
  private static readonly MARGIN = 20;
  private static readonly PRIMARY_COLOR = '#3b82f6';
  private static readonly SUCCESS_COLOR = '#10b981';
  private static readonly WARNING_COLOR = '#f59e0b';
  private static readonly DANGER_COLOR = '#ef4444';

  /**
   * Export a single idea to PDF
   */
  static async exportSingleIdea(
    idea: IdeaData,
    options: PdfExportOptions = { template: 'detailed' }
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add cover page
    this.addCoverPage(doc, idea.title, options);

    // Add executive summary
    doc.addPage();
    this.addExecutiveSummary(doc, idea);

    // Add idea details
    doc.addPage();
    this.addIdeaDetails(doc, idea);

    // Add SWOT analysis if available
    if (options.includeSWOT !== false && idea.swotAnalysis) {
      doc.addPage();
      this.addSWOTAnalysis(doc, idea.swotAnalysis);
    }

    // Add risks if available
    if (options.includeRisks !== false && idea.idea_risks && idea.idea_risks.length > 0) {
      doc.addPage();
      this.addRisksSection(doc, idea.idea_risks);
    }

    // Add milestones if available
    if (idea.idea_milestones && idea.idea_milestones.length > 0) {
      doc.addPage();
      this.addMilestonesSection(doc, idea.idea_milestones);
    }

    // Add footer to all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      this.addFooter(doc, i, pageCount);
    }

    // Save PDF
    const fileName = `${idea.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  /**
   * Export multiple ideas to PDF
   */
  static async exportMultipleIdeas(
    ideas: IdeaData[],
    options: PdfExportOptions = { template: 'executive' }
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add cover page
    this.addCoverPage(doc, `گزارش ${ideas.length} ایده`, options);

    // Add summary page
    doc.addPage();
    this.addMultipleIdeasSummary(doc, ideas);

    // Add each idea
    ideas.forEach((idea, index) => {
      if (index > 0) doc.addPage();
      this.addIdeaDetails(doc, idea);

      if (options.template === 'detailed') {
        if (idea.swotAnalysis) {
          doc.addPage();
          this.addSWOTAnalysis(doc, idea.swotAnalysis);
        }
      }
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      this.addFooter(doc, i, pageCount);
    }

    // Save
    doc.save(`Ideas_Report_${new Date().getTime()}.pdf`);
  }

  /**
   * Add cover page
   */
  private static addCoverPage(doc: jsPDF, title: string, options: PdfExportOptions): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background gradient effect (using rectangles)
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, pageHeight / 3, 'F');

    // Logo placeholder (if enabled)
    if (options.includeLogo !== false) {
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('💡', pageWidth / 2, 40, { align: 'center' });
    }

    // Title
    doc.setFontSize(this.FONT_SIZE_TITLE);
    doc.setTextColor(255, 255, 255);
    doc.text('گزارش تحلیل ایده', pageWidth / 2, 70, { align: 'center' });

    // Idea title
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.setTextColor(40, 40, 40);
    doc.text(title, pageWidth / 2, pageHeight / 2, { align: 'center', maxWidth: pageWidth - 40 });

    // Date
    doc.setFontSize(this.FONT_SIZE_BODY);
    doc.setTextColor(100, 100, 100);
    const date = new Date().toLocaleDateString('fa-IR');
    doc.text(`تاریخ تهیه: ${date}`, pageWidth / 2, pageHeight - 40, { align: 'center' });

    // Prepared by
    doc.text('تهیه شده توسط: سیستم مدیریت ایده', pageWidth / 2, pageHeight - 30, { align: 'center' });
  }

  /**
   * Add executive summary
   */
  private static addExecutiveSummary(doc: jsPDF, idea: IdeaData): void {
    let yPos = this.MARGIN;

    // Heading
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.setTextColor(40, 40, 40);
    doc.text('خلاصه اجرایی', this.MARGIN, yPos);
    yPos += 15;

    // Idea info
    doc.setFontSize(this.FONT_SIZE_BODY);
    doc.setTextColor(60, 60, 60);

    const info = [
      `حوزه: ${this.translateDomain(idea.domain)}`,
      `مرحله: ${this.translateStage(idea.stage)}`,
      `اولویت: ${this.translatePriority(idea.priority)}`,
    ];

    if (idea.feasibility_score) {
      info.push(`امکان‌سنجی: ${idea.feasibility_score}/10`);
    }
    if (idea.impact_score) {
      info.push(`تاثیر: ${idea.impact_score}/10`);
    }

    info.forEach(line => {
      doc.text(line, this.MARGIN, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Description
    doc.setFontSize(this.FONT_SIZE_SUBHEADING);
    doc.text('توضیحات:', this.MARGIN, yPos);
    yPos += 8;

    doc.setFontSize(this.FONT_SIZE_BODY);
    const splitDescription = doc.splitTextToSize(idea.description, 170);
    doc.text(splitDescription, this.MARGIN, yPos);
    yPos += splitDescription.length * 6 + 15;

    // Progress bars if scores available
    if (idea.feasibility_score) {
      doc.setFontSize(this.FONT_SIZE_BODY);
      doc.text('امکان‌سنجی:', this.MARGIN, yPos);
      yPos += 8;
      drawProgressBar(doc, this.MARGIN, yPos, 170, 8, idea.feasibility_score * 10, this.SUCCESS_COLOR);
      yPos += 15;
    }

    if (idea.impact_score) {
      doc.text('تاثیر:', this.MARGIN, yPos);
      yPos += 8;
      drawProgressBar(doc, this.MARGIN, yPos, 170, 8, idea.impact_score * 10, this.PRIMARY_COLOR);
    }
  }

  /**
   * Add idea details
   */
  private static addIdeaDetails(doc: jsPDF, idea: IdeaData): void {
    let yPos = this.MARGIN;

    // Title
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.setTextColor(40, 40, 40);
    doc.text(idea.title, this.MARGIN, yPos);
    yPos += 12;

    // Metadata table
    const metadata = [
      ['حوزه', this.translateDomain(idea.domain)],
      ['مرحله', this.translateStage(idea.stage)],
      ['اولویت', this.translatePriority(idea.priority)],
      ['تاریخ ایجاد', new Date(idea.created_at).toLocaleDateString('fa-IR')],
    ];

    doc.autoTable({
      startY: yPos,
      head: [['ویژگی', 'مقدار']],
      body: metadata,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: this.MARGIN, right: this.MARGIN },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Description
    doc.setFontSize(this.FONT_SIZE_SUBHEADING);
    doc.text('توضیحات تفصیلی:', this.MARGIN, yPos);
    yPos += 8;

    doc.setFontSize(this.FONT_SIZE_BODY);
    const splitDesc = doc.splitTextToSize(idea.description, 170);
    doc.text(splitDesc, this.MARGIN, yPos);
  }

  /**
   * Add SWOT analysis
   */
  private static addSWOTAnalysis(doc: jsPDF, swot: IdeaData['swotAnalysis']): void {
    if (!swot) return;

    let yPos = this.MARGIN;

    // Title
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.setTextColor(40, 40, 40);
    doc.text('تحلیل SWOT', this.MARGIN, yPos);
    yPos += 12;

    // SWOT Table
    const swotData = [
      ...swot.strengths.map(s => ['نقاط قوت', s]),
      ...swot.weaknesses.map(w => ['نقاط ضعف', w]),
      ...swot.opportunities.map(o => ['فرصت‌ها', o]),
      ...swot.threats.map(t => ['تهدیدها', t]),
    ];

    doc.autoTable({
      startY: yPos,
      head: [['بخش', 'توضیحات']],
      body: swotData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: this.MARGIN, right: this.MARGIN },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Overall assessment
    if (swot.overallAssessment) {
      doc.setFontSize(this.FONT_SIZE_SUBHEADING);
      doc.text('ارزیابی کلی:', this.MARGIN, yPos);
      yPos += 8;

      doc.setFontSize(this.FONT_SIZE_BODY);
      const splitAssessment = doc.splitTextToSize(swot.overallAssessment, 170);
      doc.text(splitAssessment, this.MARGIN, yPos);
    }
  }

  /**
   * Add risks section
   */
  private static addRisksSection(doc: jsPDF, risks: IdeaData['idea_risks']): void {
    if (!risks || risks.length === 0) return;

    let yPos = this.MARGIN;

    // Title
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.text('ریسک‌ها', this.MARGIN, yPos);
    yPos += 12;

    const riskData = risks.map(risk => [
      risk.risk_description,
      this.translateSeverity(risk.severity),
      risk.mitigation_strategy || '-',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['ریسک', 'شدت', 'راهکار کاهش']],
      body: riskData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: this.MARGIN, right: this.MARGIN },
      styles: { fontSize: 9 },
    });
  }

  /**
   * Add milestones section
   */
  private static addMilestonesSection(doc: jsPDF, milestones: IdeaData['idea_milestones']): void {
    if (!milestones || milestones.length === 0) return;

    let yPos = this.MARGIN;

    // Title
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.text('نقاط عطف', this.MARGIN, yPos);
    yPos += 12;

    const milestoneData = milestones.map(m => [
      m.title,
      m.description || '-',
      m.target_date ? new Date(m.target_date).toLocaleDateString('fa-IR') : '-',
      this.translateStatus(m.status),
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['عنوان', 'توضیحات', 'تاریخ هدف', 'وضعیت']],
      body: milestoneData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: this.MARGIN, right: this.MARGIN },
      styles: { fontSize: 9 },
    });
  }

  /**
   * Add multiple ideas summary
   */
  private static addMultipleIdeasSummary(doc: jsPDF, ideas: IdeaData[]): void {
    let yPos = this.MARGIN;

    // Title
    doc.setFontSize(this.FONT_SIZE_HEADING);
    doc.text('خلاصه ایده‌ها', this.MARGIN, yPos);
    yPos += 15;

    // Stats
    doc.setFontSize(this.FONT_SIZE_BODY);
    doc.text(`تعداد کل ایده‌ها: ${ideas.length}`, this.MARGIN, yPos);
    yPos += 10;

    // Distribution by priority
    const priorityCount = {
      high: ideas.filter(i => i.priority === 'high').length,
      medium: ideas.filter(i => i.priority === 'medium').length,
      low: ideas.filter(i => i.priority === 'low').length,
    };

    doc.text('توزیع بر اساس اولویت:', this.MARGIN, yPos);
    yPos += 8;
    Object.entries(priorityCount).forEach(([priority, count]) => {
      doc.text(`  • ${this.translatePriority(priority)}: ${count}`, this.MARGIN + 5, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Ideas list table
    const ideasData = ideas.map(idea => [
      idea.title,
      this.translateDomain(idea.domain),
      this.translateStage(idea.stage),
      this.translatePriority(idea.priority),
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['عنوان', 'حوزه', 'مرحله', 'اولویت']],
      body: ideasData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: this.MARGIN, right: this.MARGIN },
      styles: { fontSize: 9 },
    });
  }

  /**
   * Add footer to page
   */
  private static addFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `صفحه ${pageNumber} از ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Translation helpers
  private static translateDomain(domain: string): string {
    const map: Record<string, string> = {
      personal: 'شخصی',
      professional: 'حرفه‌ای',
      organizational: 'سازمانی',
    };
    return map[domain] || domain;
  }

  private static translateStage(stage: string): string {
    const map: Record<string, string> = {
      idea: 'ایده',
      research: 'تحقیق',
      planning: 'برنامه‌ریزی',
      development: 'توسعه',
      testing: 'تست',
      launch: 'راه‌اندازی',
      growth: 'رشد',
      mature: 'بالغ',
    };
    return map[stage] || stage;
  }

  private static translatePriority(priority: string): string {
    const map: Record<string, string> = {
      high: 'بالا',
      medium: 'متوسط',
      low: 'پایین',
    };
    return map[priority] || priority;
  }

  private static translateSeverity(severity: string): string {
    const map: Record<string, string> = {
      critical: 'بحرانی',
      high: 'بالا',
      medium: 'متوسط',
      low: 'پایین',
    };
    return map[severity] || severity;
  }

  private static translateStatus(status: string): string {
    const map: Record<string, string> = {
      completed: 'تکمیل شده',
      in_progress: 'در حال انجام',
      pending: 'در انتظار',
      cancelled: 'لغو شده',
    };
    return map[status] || status;
  }
}
