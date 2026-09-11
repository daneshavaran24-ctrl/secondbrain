import { PersonalTask, Project, ProjectMember, Meeting, KnowledgeItem, SecretaryRequest, SecretaryNotification, TrendItem, HealthMetrics } from '@/types';
import { legalTestDataService } from './legalTestDataService';

class TestDataService {
  private static instance: TestDataService;

  static getInstance(): TestDataService {
    if (!TestDataService.instance) {
      TestDataService.instance = new TestDataService();
    }
    return TestDataService.instance;
  }

  async initializeAllTestData(): Promise<void> {
    // console.log removed for production: شروع ایجاد داده‌های تستی...

    try {
      // Initialize Legal test data
      await legalTestDataService.initializeLegalTestData();
      console.log('✓ Legal test data initialized');
      
    } catch (error) {
      console.error('Error initializing legal test data:', error);
    }

    // Clear existing data
    this.clearAllData();

    // Generate test data
    await this.generatePersonalTasks();
    await this.generateProjects();
    await this.generateMeetings();
    await this.generateKnowledgeItems();
    await this.generateSecretaryData();
    await this.generateHealthData();
    await this.generateTrendsData();

    // console.log removed for production: تمام داده‌های تستی با موفقیت ایجاد شدند
  }

  private clearAllData(): void {
    const keys = [
      'personalTasks',
      'projects',
      'projectTasks',
      'projectMembers',
      'meetings',
      'knowledgeItems',
      'secretaryRequests',
      'secretaryNotifications',
      'healthMetrics',
      'trends'
    ];

    keys.forEach(key => localStorage.removeItem(key));
  }

  private async generatePersonalTasks(): Promise<void> {
    const tasks: PersonalTask[] = [
      // وظایف کاری
      {
        id: '1',
        title: 'تهیه گزارش عملکرد ماهانه واریده',
        description: 'جمع‌آوری و تحلیل داده‌های عملکرد ماهانه بخش‌های مختلف شرکت واریده',
        status: 'in_progress',
        priority: 'high',
        mainCategory: 'personal_life',
        subCategory: 'work',
        category: 'work',
        estimated_hours: 8,
        actual_hours: 5,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['گزارش', 'واریده', 'عملکرد'],
        notes: 'نیاز به هماهنگی با مدیران بخش‌های مختلف',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        progress: 65
      },
      {
        id: '2',
        title: 'بررسی پیشنهادات فرانگاران',
        description: 'مطالعه و تحلیل پیشنهادات جدید ارائه شده توسط تیم فرانگاران',
        status: 'todo',
        priority: 'medium',
        mainCategory: 'personal_life',
        subCategory: 'work',
        category: 'work',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['فرانگاران', 'پیشنهاد', 'بررسی'],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        progress: 0
      },
      {
        id: '3',
        title: 'جلسه هیئت مدیره انجمن',
        description: 'شرکت در جلسه هیئت مدیره انجمن و ارائه گزارش فعالیت‌ها',
        status: 'completed',
        priority: 'high',
        mainCategory: 'personal_life',
        subCategory: 'work',
        category: 'work',
        estimated_hours: 3,
        actual_hours: 4,
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['انجمن', 'هیئت مدیره', 'گزارش'],
        notes: 'جلسه با موفقیت برگزار شد و گزارش تأیید شد',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 100
      },
      {
        id: '4',
        title: 'آماده‌سازی ارائه برای اتاق بازرگانی',
        description: 'تهیه اسلایدها و محتوای ارائه برای نشست اتاق بازرگانی',
        status: 'in_progress',
        priority: 'high',
        mainCategory: 'personal_life',
        subCategory: 'work',
        category: 'work',
        estimated_hours: 6,
        actual_hours: 3,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['اتاق بازرگانی', 'ارائه', 'اسلاید'],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        progress: 50
      },

      // وظایف شخصی
      {
        id: '5',
        title: 'خرید هدیه تولد همسر',
        description: 'انتخاب و خرید هدیه مناسب برای تولد همسر',
        status: 'todo',
        priority: 'medium',
        mainCategory: 'personal_life',
        subCategory: 'personal',
        category: 'personal',
        estimated_hours: 2,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['تولد', 'هدیه', 'خانواده'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 0
      },
      {
        id: '6',
        title: 'تعمیر خودرو',
        description: 'بردن خودرو برای سرویس دوره‌ای و تعمیرات ضروری',
        status: 'in_progress',
        priority: 'medium',
        mainCategory: 'personal_life',
        subCategory: 'personal',
        category: 'personal',
        estimated_hours: 3,
        actual_hours: 1,
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['خودرو', 'تعمیر', 'سرویس'],
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        progress: 30
      },

      // وظایف سلامت
      {
        id: '7',
        title: 'ورزش صبحگاهی',
        description: 'انجام تمرینات ورزشی روزانه برای حفظ سلامت جسمانی',
        status: 'completed',
        priority: 'medium',
        mainCategory: 'personal_life',
        subCategory: 'health',
        category: 'health',
        estimated_hours: 1,
        actual_hours: 1,
        due_date: new Date().toISOString(),
        tags: ['ورزش', 'سلامت', 'روزانه'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 100
      },
      {
        id: '8',
        title: 'معاینه پزشک عمومی',
        description: 'مراجعه برای معاینه دوره‌ای و چک‌آپ سلامت',
        status: 'todo',
        priority: 'medium',
        mainCategory: 'personal_life',
        subCategory: 'health',
        category: 'health',
        estimated_hours: 2,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['پزشک', 'معاینه', 'چک‌آپ'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 0
      },

      // وظایف یادگیری
      {
        id: '9',
        title: 'مطالعه کتاب مدیریت زمان',
        description: 'خواندن و مطالعه کتاب "مدیریت زمان مؤثر" برای بهبود بهره‌وری',
        status: 'in_progress',
        priority: 'low',
        mainCategory: 'personal_development',
        subCategory: 'learning',
        category: 'learning',
        estimated_hours: 15,
        actual_hours: 7,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['مطالعه', 'کتاب', 'مدیریت زمان'],
        notes: 'تا کنون 5 فصل خوانده شده',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        progress: 47
      },
      {
        id: '10',
        title: 'دوره آنلاین React پیشرفته',
        description: 'ادامه دوره آموزشی React برای یادگیری تکنیک‌های پیشرفته',
        status: 'in_progress',
        priority: 'medium',
        mainCategory: 'personal_development',
        subCategory: 'learning',
        category: 'learning',
        estimated_hours: 25,
        actual_hours: 12,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['برنامه‌نویسی', 'React', 'دوره آنلاین'],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        progress: 48
      },

      // وظایف مالی
      {
        id: '11',
        title: 'بررسی صورت‌حساب بانکی',
        description: 'کنترل و بررسی تراکنش‌های مالی ماهانه',
        status: 'todo',
        priority: 'medium',
        mainCategory: 'personal_life',
        subCategory: 'finance',
        category: 'finance',
        estimated_hours: 1,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['بانک', 'حساب', 'بررسی'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 0
      },

      // وظایف خانوادگی
      {
        id: '12',
        title: 'برنامه‌ریزی سفر تعطیلات',
        description: 'تحقیق و برنامه‌ریزی برای سفر خانوادگی تعطیلات نوروز',
        status: 'todo',
        priority: 'low',
        mainCategory: 'personal_life',
        subCategory: 'family',
        category: 'family',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['سفر', 'تعطیلات', 'خانواده'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 0
      },

      // وظایف معنوی
      {
        id: '13',
        title: 'مطالعه قرآن روزانه',
        description: 'تلاوت و تدبر در آیات قرآن کریم به صورت روزانه',
        status: 'in_progress',
        priority: 'medium',
        mainCategory: 'personal_development',
        subCategory: 'spiritual_development',
        category: 'spiritual_development',
        estimated_hours: 1,
        actual_hours: 0.5,
        due_date: new Date().toISOString(),
        tags: ['قرآن', 'تلاوت', 'معنویت'],
        notes: 'امروز سوره مبارکه یس مطالعه شد',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        progress: 50
      }
    ];

    localStorage.setItem('personalTasks', JSON.stringify(tasks));
    // console.log removed for production: personal tasks created
  }

  private async generateProjects(): Promise<void> {
    const projects: Project[] = [
      {
        id: 'proj-1',
        name: 'توسعه سیستم Mora',
        description: 'ایجاد سیستم جامع مدیریت دانش شخصی با قابلیت‌های هوش مصنوعی',
        goal: 'ارائه ابزاری کامل برای مدیریت دانش، وظایف، و بهره‌وری شخصی',
        status: 'active',
        managerId: 'member-1',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        teamMembers: ['member-1', 'member-2', 'member-3', 'member-4'],
        progress: 68,
        budget: 250000000,
        tags: ['هوش مصنوعی', 'مدیریت دانش', 'React'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj-2',
        name: 'بهینه‌سازی فرآیندهای واریده',
        description: 'بررسی و بهینه‌سازی فرآیندهای عملیاتی شرکت واریده',
        goal: 'کاهش 30% زمان انجام فرآیندها و افزایش کیفیت خدمات',
        status: 'active',
        managerId: 'member-2',
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        teamMembers: ['member-2', 'member-5', 'member-6'],
        progress: 45,
        budget: 150000000,
        tags: ['بهینه‌سازی', 'فرآیند', 'واریده'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const projectMembers: ProjectMember[] = [
      {
        id: 'member-1',
        name: 'علی احمدی',
        email: 'ali.ahmadi@example.com',
        role: 'مدیر پروژه',
        avatar: '/placeholder.svg',
        skills: ['مدیریت پروژه', 'Scrum', 'برنامه‌ریزی'],
        availability: 90
      },
      {
        id: 'member-2',
        name: 'فاطمه کریمی',
        email: 'fateme.karimi@example.com',
        role: 'توسعه‌دهنده ارشد',
        avatar: '/placeholder.svg',
        skills: ['React', 'TypeScript', 'Node.js'],
        availability: 85
      }
    ];

    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('projectMembers', JSON.stringify(projectMembers));
    // console.log removed for production: projects and members created
  }

  private async generateMeetings(): Promise<void> {
    const meetings: Meeting[] = [
      {
        id: 'meet-1',
        title: 'جلسه بررسی پیشرفت پروژه BrainForge',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        organization: 'Varid',
        participants: [
          { id: '1', name: 'علی احمدی', role: 'مدیر پروژه', speaking_time: 45, attention_score: 0.8 },
          { id: '2', name: 'فاطمه کریمی', role: 'توسعه‌دهنده ارشد', speaking_time: 30, attention_score: 0.9 }
        ],
        action_items: [],
        duration: 90,
        minutes_status: 'draft',
        attachments: [],
        resolutions: []
      }
    ];

    localStorage.setItem('meetings', JSON.stringify(meetings));
    // console.log removed for production: meetings created
  }

  private async generateKnowledgeItems(): Promise<void> {
    const knowledgeItems: KnowledgeItem[] = [
      {
        id: 'know-1',
        title: 'راهنمای اجرای متدولوژی PARA',
        content: 'روش PARA شامل چهار دسته اصلی است: Projects، Areas، Resources، Archives',
        type: 'document',
        category: 'Projects',
        tags: ['PARA', 'سازماندهی', 'مدیریت دانش'],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    localStorage.setItem('knowledgeItems', JSON.stringify(knowledgeItems));
    // console.log removed for production: knowledge items created
  }

  private async generateSecretaryData(): Promise<void> {
    const secretaryRequests: SecretaryRequest[] = [
      {
        id: 'req-1',
        secretary_id: 'sec-1',
        type: 'meeting_create',
        data: {
          meeting: {
            title: 'جلسه با مدیرعامل',
            date: '2024-01-15',
            time: '10:00',
            organization: 'Varid'
          }
        },
        status: 'pending',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        doctor_notified: false
      }
    ];

    const secretaryNotifications: SecretaryNotification[] = [
      {
        id: 'notif-1',
        type: 'new_request',
        title: 'وظیفه جدید محول شده',
        message: 'وظیفه "تهیه گزارش ماهانه" به شما محول شده است',
        read: false,
        secretary_request_id: 'req-1',
        doctor_id: 'doc-1',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    localStorage.setItem('secretaryRequests', JSON.stringify(secretaryRequests));
    localStorage.setItem('secretaryNotifications', JSON.stringify(secretaryNotifications));
    // console.log removed for production: secretary requests and notifications created
  }

  private async generateHealthData(): Promise<void> {
    const healthMetrics: HealthMetrics = {
      id: 'health-1',
      date: new Date().toISOString(),
      heart_rate: 72,
      stress_level: 3,
      energy_level: 7,
      sleep_quality: 8,
      predicted_fatigue: 2
    };

    localStorage.setItem('healthMetrics', JSON.stringify(healthMetrics));
    // console.log removed for production: health data created
  }

  private async generateTrendsData(): Promise<void> {
    const trends: TrendItem[] = [
      {
        id: 'trend-1',
        title: 'آینده هوش مصنوعی در ایران',
        source: 'تکنولوژی امروز',
        url: 'https://example.com/ai-future-iran',
        content: 'بررسی روندهای توسعه فناوری هوش مصنوعی در کشور',
        relevance_score: 0.95,
        keywords: ['هوش مصنوعی', 'فناوری', 'ایران'],
        date: new Date().toISOString(),
        type: 'article'
      }
    ];

    localStorage.setItem('trends', JSON.stringify(trends));
    // console.log removed for production: trends created
  }

  async getDataSummary(): Promise<string> {
    const summary = `
📊 خلاصه داده‌های تستی ایجاد شده:

🎯 وظایف شخصی: ${JSON.parse(localStorage.getItem('personalTasks') || '[]').length} وظیفه
📁 پروژه‌ها: ${JSON.parse(localStorage.getItem('projects') || '[]').length} پروژه
👥 اعضای تیم: ${JSON.parse(localStorage.getItem('projectMembers') || '[]').length} نفر
🤝 جلسات: ${JSON.parse(localStorage.getItem('meetings') || '[]').length} جلسه
📚 آیتم‌های دانش: ${JSON.parse(localStorage.getItem('knowledgeItems') || '[]').length} آیتم
📝 درخواست‌های منشی: ${JSON.parse(localStorage.getItem('secretaryRequests') || '[]').length} درخواست
🔔 اعلان‌ها: ${JSON.parse(localStorage.getItem('secretaryNotifications') || '[]').length} اعلان
💪 داده‌های سلامت: آماده
📈 ترندها: ${JSON.parse(localStorage.getItem('trends') || '[]').length} آیتم

✅ تمام ماژول‌های سیستم با داده‌های واقعی و متنوع پر شده‌اند!
    `;

    return summary;
  }
}

export const testDataService = TestDataService.getInstance();