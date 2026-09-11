import { toast } from '@/hooks/use-toast';

export interface Risk {
  id: number;
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  riskLevel: string;
  status: string;
  responsiblePerson: string;
  lastReviewDate: string;
  nextReviewDate: string;
  mitigationStrategy: string;
  contingencyPlan: string;
  createdAt: string;
  updatedAt: string;
  organizationName: string;
}

export interface RiskFormData {
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  responsiblePerson: string;
  mitigationStrategy: string;
  contingencyPlan: string;
  status: string;
}

const STORAGE_KEY = 'risk-assessments';

class RiskAssessmentService {
  private cache: Map<string, Risk[]> = new Map();

  calculateRiskLevel(probability: number, impact: number): string {
    const score = probability * impact;
    if (score >= 70) return 'بحرانی';
    if (score >= 40) return 'بالا';
    if (score >= 20) return 'متوسط';
    return 'پایین';
  }

  calculateRiskScore(probability: number, impact: number): number {
    return probability * impact;
  }

  private generateNextReviewDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // 3 months from now
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    // Simple Persian date format (this could be enhanced with a proper Persian calendar library)
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  private getCurrentDate(): string {
    return this.formatDate(new Date());
  }

  private getStorageData(): Record<string, Risk[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return {};
    }
  }

  private saveStorageData(data: Record<string, Risk[]>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: 'خطا در ذخیره‌سازی',
        description: 'داده‌ها در حافظه محلی ذخیره نشد',
        variant: 'destructive'
      });
    }
  }

  getRisks(organizationName: string): Risk[] {
    // Check cache first
    if (this.cache.has(organizationName)) {
      return this.cache.get(organizationName)!;
    }

    const allData = this.getStorageData();
    const risks = allData[organizationName] || this.getDefaultRisks(organizationName);
    
    // Update cache
    this.cache.set(organizationName, risks);
    
    return risks;
  }

  addRisk(organizationName: string, formData: RiskFormData): Risk {
    const allData = this.getStorageData();
    const organizationRisks = allData[organizationName] || [];
    
    const newRisk: Risk = {
      id: Date.now(), // Simple ID generation
      ...formData,
      riskLevel: this.calculateRiskLevel(formData.probability, formData.impact),
      lastReviewDate: this.getCurrentDate(),
      nextReviewDate: this.generateNextReviewDate(),
      createdAt: this.getCurrentDate(),
      updatedAt: this.getCurrentDate(),
      organizationName,
    };

    const updatedRisks = [...organizationRisks, newRisk];
    allData[organizationName] = updatedRisks;
    
    // Update cache and storage
    this.cache.set(organizationName, updatedRisks);
    this.saveStorageData(allData);
    
    toast({
      title: 'ریسک اضافه شد',
      description: `ریسک "${formData.title}" با موفقیت اضافه شد`,
    });

    return newRisk;
  }

  updateRisk(organizationName: string, riskId: number, formData: RiskFormData): Risk | null {
    const allData = this.getStorageData();
    const organizationRisks = allData[organizationName] || [];
    
    const riskIndex = organizationRisks.findIndex(risk => risk.id === riskId);
    if (riskIndex === -1) {
      toast({
        title: 'خطا',
        description: 'ریسک مورد نظر یافت نشد',
        variant: 'destructive'
      });
      return null;
    }

    const updatedRisk: Risk = {
      ...organizationRisks[riskIndex],
      ...formData,
      riskLevel: this.calculateRiskLevel(formData.probability, formData.impact),
      updatedAt: this.getCurrentDate(),
    };

    organizationRisks[riskIndex] = updatedRisk;
    allData[organizationName] = organizationRisks;
    
    // Update cache and storage
    this.cache.set(organizationName, organizationRisks);
    this.saveStorageData(allData);
    
    toast({
      title: 'ریسک بروزرسانی شد',
      description: `ریسک "${formData.title}" با موفقیت بروزرسانی شد`,
    });

    return updatedRisk;
  }

  deleteRisk(organizationName: string, riskId: number): boolean {
    const allData = this.getStorageData();
    const organizationRisks = allData[organizationName] || [];
    
    const riskIndex = organizationRisks.findIndex(risk => risk.id === riskId);
    if (riskIndex === -1) {
      toast({
        title: 'خطا',
        description: 'ریسک مورد نظر یافت نشد',
        variant: 'destructive'
      });
      return false;
    }

    const deletedRisk = organizationRisks[riskIndex];
    organizationRisks.splice(riskIndex, 1);
    allData[organizationName] = organizationRisks;
    
    // Update cache and storage
    this.cache.set(organizationName, organizationRisks);
    this.saveStorageData(allData);
    
    toast({
      title: 'ریسک حذف شد',
      description: `ریسک "${deletedRisk.title}" با موفقیت حذف شد`,
    });

    return true;
  }

  getRiskStatistics(organizationName: string) {
    const risks = this.getRisks(organizationName);
    
    const stats = {
      total: risks.length,
      critical: risks.filter(r => r.riskLevel === 'بحرانی').length,
      high: risks.filter(r => r.riskLevel === 'بالا').length,
      medium: risks.filter(r => r.riskLevel === 'متوسط').length,
      low: risks.filter(r => r.riskLevel === 'پایین').length,
      controlled: risks.filter(r => r.status === 'کنترل شده').length,
    };

    return [
      { title: 'کل ریسک‌ها', value: stats.total, color: 'text-primary' },
      { title: 'بحرانی', value: stats.critical, color: 'text-destructive' },
      { title: 'بالا', value: stats.high, color: 'text-orange-600' },
      { title: 'تحت کنترل', value: stats.controlled, color: 'text-emerald-600' }
    ];
  }

  getUpcomingReviews(organizationName: string): Risk[] {
    const risks = this.getRisks(organizationName);
    const currentDate = new Date();
    
    return risks.filter(risk => {
      // Simple date comparison (this could be enhanced with proper date parsing)
      const reviewDate = new Date(risk.nextReviewDate.replace(/\//g, '-'));
      const daysUntilReview = Math.ceil((reviewDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
      return daysUntilReview <= 30 && daysUntilReview >= 0; // Next 30 days
    });
  }

  private getDefaultRisks(organizationName: string): Risk[] {
    return [];
  }

  // Clear cache when switching organizations
  clearCache(): void {
    this.cache.clear();
  }
}

export const riskAssessmentService = new RiskAssessmentService();