// Category management service for custom categories
export class CategoryService {
  private storageKey = 'custom_categories';

  // Get custom categories for a specific domain
  getCustomCategories(domain: 'professional' | 'organizational' | 'cultural'): string[] {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_${domain}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`Error loading custom categories for ${domain}:`, error);
      return [];
    }
  }

  // Add a new custom category
  addCustomCategory(domain: 'professional' | 'organizational' | 'cultural', category: string): void {
    const normalizedCategory = category.trim();
    if (!normalizedCategory) return;

    const categories = this.getCustomCategories(domain);
    if (!categories.includes(normalizedCategory)) {
      categories.push(normalizedCategory);
      this.saveCustomCategories(domain, categories);
    }
  }

  // Remove a custom category
  removeCustomCategory(domain: 'professional' | 'organizational' | 'cultural', category: string): void {
    const categories = this.getCustomCategories(domain);
    const filteredCategories = categories.filter(c => c !== category);
    this.saveCustomCategories(domain, filteredCategories);
  }

  // Get suggested categories based on existing usage
  getSuggestedCategories(domain: 'professional' | 'organizational' | 'cultural', query: string = ''): string[] {
    const categories = this.getCustomCategories(domain);
    if (!query) return categories;

    const lowerQuery = query.toLowerCase();
    return categories.filter(category => 
      category.toLowerCase().includes(lowerQuery)
    );
  }

  // Default professional categories
  getDefaultProfessionalCategories(): string[] {
    return [
      'پروژه‌ها',
      'مذاکرات تجاری',
      'مالی و حسابداری',
      'منابع انسانی',
      'بازاریابی و فروش',
      'تحقیق و توسعه',
      'مدیریت کیفیت',
      'امور قانونی',
      'فناوری اطلاعات',
      'روابط عمومی'
    ];
  }

  // Default organizational categories
  getDefaultOrganizationalCategories(): string[] {
    return [
      'استراتژی سازمانی',
      'عملیات و فرآیندها',
      'امور مالی',
      'منابع انسانی',
      'مدیریت ریسک',
      'کنترل کیفیت',
      'روابط خارجی',
      'حاکمیت شرکتی',
      'نوآوری و تغییر',
      'مسئولیت اجتماعی'
    ];
  }

  // Default cultural categories
  getDefaultCulturalCategories(): string[] {
    return [
      'ادبیات',
      'علمی',
      'فلسفه',
      'تاریخ',
      'مذهبی',
      'خودسازی',
      'رمان',
      'شعر',
      'درام',
      'کمدی',
      'علمی تخیلی',
      'مستند',
      'اکشن',
      'ترسناک',
      'عاشقانه',
      'انیمیشن',
      'تحقیقاتی',
      'خبری',
      'تحلیلی',
      'آموزشی',
      'تخصصی',
      'عمومی',
      'سرگرمی',
      'روانشناسی',
      'تکنولوژی'
    ];
  }

  // Initialize default categories if none exist
  initializeDefaultCategories(domain: 'professional' | 'organizational' | 'cultural'): void {
    const existing = this.getCustomCategories(domain);
    if (existing.length === 0) {
      const defaults = domain === 'professional' 
        ? this.getDefaultProfessionalCategories()
        : domain === 'organizational'
        ? this.getDefaultOrganizationalCategories()
        : this.getDefaultCulturalCategories();
      
      this.saveCustomCategories(domain, defaults);
    }
  }

  private saveCustomCategories(domain: 'professional' | 'organizational' | 'cultural', categories: string[]): void {
    try {
      localStorage.setItem(`${this.storageKey}_${domain}`, JSON.stringify(categories));
    } catch (error) {
      console.error(`Error saving custom categories for ${domain}:`, error);
    }
  }
}

export const categoryService = new CategoryService();