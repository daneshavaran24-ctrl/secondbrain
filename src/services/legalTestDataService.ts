import { legalService, LegalCase, LawyerMeeting, LegalDocument, LawyerNote } from './legalService';

export class LegalTestDataService {
  async initializeLegalTestData(): Promise<void> {
    try {
      console.log('Initializing legal test data...');
      
      // Check if data already exists
      const existingCases = await legalService.getCases();
      if (existingCases.length > 0) {
        console.log('Legal test data already exists');
        return;
      }

      // Create test cases
      const testCases: Omit<LegalCase, 'id' | 'createdAt'>[] = [
        {
          title: 'پرونده قرارداد تجاری شرکت وارید',
          type: 'commercial',
          status: 'active',
          lawyer: 'دکتر احمد محمدی',
          opponent: 'شرکت تجاری آفتاب',
          court: 'دادگاه تجاری تهران',
          nextHearing: '2024-12-15',
          description: 'اختلاف در تفسیر شروط قرارداد خرید و فروش کالا بین شرکت وارید و شرکت آفتاب',
          totalCost: 25000000,
          priority: 'high',
          userId: 'default'
        },
        {
          title: 'پرونده مالکیت فکری برند مورا',
          type: 'civil',
          status: 'active',
          lawyer: 'مریم رضایی',
          opponent: 'شرکت رقیب تجاری',
          court: 'دادگاه حقوقی تهران',
          nextHearing: '2024-11-25',
          description: 'نقض حقوق مالکیت فکری و استفاده غیرمجاز از برند مورا',
          totalCost: 15000000,
          priority: 'high',
          userId: 'default'
        },
        {
          title: 'پرونده اختلاف کارگری',
          type: 'administrative',
          status: 'pending',
          lawyer: 'علی حسینی',
          opponent: 'کارگر سابق',
          court: 'دادگاه کار تهران',
          description: 'اختلاف در محاسبه حقوق و مزایای کارگر سابق',
          totalCost: 8000000,
          priority: 'medium',
          userId: 'default'
        }
      ];

      // Create cases and store their IDs
      const createdCases: LegalCase[] = [];
      for (const caseData of testCases) {
        const newCase = await legalService.createCase(caseData);
        createdCases.push(newCase);
      }

      // Create test meetings
      const testMeetings: Omit<LawyerMeeting, 'id'>[] = [
        {
          caseId: createdCases[0].id,
          lawyer: 'دکتر احمد محمدی',
          date: '2024-09-10',
          duration: 90,
          summary: 'بررسی مدارک جدید و تدوین استراتژی دفاعی برای پرونده قرارداد تجاری',
          recommendations: [
            'تهیه مدارک مالی اضافی از شرکت',
            'دریافت نظریه کارشناس رسمی دادگستری',
            'آماده‌سازی برای جلسه رسیدگی بعدی'
          ],
          cost: 2000000,
          nextActions: [
            'ارسال درخواست کارشناسی به دادگاه',
            'تنظیم لایحه تکمیلی دفاعیه'
          ],
          userId: 'default'
        },
        {
          caseId: createdCases[1].id,
          lawyer: 'مریم رضایی',
          date: '2024-09-15',
          duration: 60,
          summary: 'مشاوره در خصوص حقوق مالکیت فکری و استراتژی قانونی',
          recommendations: [
            'ثبت علامت تجاری در کلاس‌های مرتبط',
            'جمع‌آوری مدارک نقض توسط رقیب',
            'ارسال اخطاریه قانونی'
          ],
          cost: 1500000,
          nextActions: [
            'تهیه دادخواست اصلی',
            'درخواست توقیف موقت محصولات متخلف'
          ],
          userId: 'default'
        }
      ];

      for (const meetingData of testMeetings) {
        await legalService.createMeeting(meetingData);
      }

      // Create test documents
      const testDocuments: Omit<LegalDocument, 'id'>[] = [
        {
          caseId: createdCases[0].id,
          name: 'قرارداد اولیه خرید و فروش',
          type: 'contract',
          uploadDate: new Date().toISOString(),
          tags: ['قرارداد', 'خرید و فروش', 'وارید'],
          isShared: true,
          userId: 'default'
        },
        {
          caseId: createdCases[0].id,
          name: 'نظریه کارشناس مالی',
          type: 'evidence',
          uploadDate: new Date().toISOString(),
          tags: ['کارشناسی', 'ارزیابی', 'مالی'],
          isShared: false,
          userId: 'default'
        },
        {
          caseId: createdCases[1].id,
          name: 'مدارک ثبت علامت تجاری',
          type: 'evidence',
          uploadDate: new Date().toISOString(),
          tags: ['علامت تجاری', 'ثبت', 'مالکیت فکری'],
          isShared: true,
          userId: 'default'
        }
      ];

      for (const docData of testDocuments) {
        await legalService.createDocument(docData);
      }

      // Create test lawyer notes
      const testNotes: Omit<LawyerNote, 'id' | 'createdAt'>[] = [
        {
          caseId: createdCases[0].id,
          content: 'جلسه مهم با موکل - نکات کلیدی:\n\n1. شرکت طرف مقابل مدعی است که شروط تحویل کالا رعایت نشده\n2. ما مدارک کاملی از تحویل به موقع داریم\n3. لازم است کارشناس رسمی موضوع را بررسی کند\n4. احتمال صلح در جلسه بعدی وجود دارد',
          hasAudio: false,
          type: 'lawyer_notes',
          userId: 'default',
          category: 'meeting-prep',
          isStarred: true,
          status: 'pending',
          title: 'نکات جلسه مهم موکل',
          reminderDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          caseId: createdCases[1].id,
          content: 'بررسی پرونده مالکیت فکری:\n\n- شرکت رقیب بدون اجازه از لوگو و نام تجاری استفاده کرده\n- مدارک ثبت علامت تجاری ما کامل است\n- پیشنهاد ارسال اخطاریه قبل از شکایت\n- در صورت عدم پاسخ، اقدام قانونی فوری',
          hasAudio: true,
          audioUrl: 'data:audio/webm;base64,sample_audio_data',
          type: 'lawyer_notes',
          userId: 'default',
          category: 'important',
          isStarred: false,
          status: 'pending',
          title: 'پیگیری مالکیت فکری'
        }
      ];

      for (const noteData of testNotes) {
        await legalService.createLawyerNote(noteData);
      }

      console.log('Legal test data initialized successfully');
      
      // Update localStorage counts
      const legalDataStats = {
        cases: createdCases.length,
        meetings: testMeetings.length,
        documents: testDocuments.length,
        notes: testNotes.length
      };
      
      localStorage.setItem('legal_data_stats', JSON.stringify(legalDataStats));
      localStorage.setItem('legal_data_initialized', new Date().toISOString());
      
    } catch (error) {
      console.error('Error initializing legal test data:', error);
      throw error;
    }
  }

  async getLegalDataStats() {
    const cases = await legalService.getCases();
    const meetings = await legalService.getMeetings();
    const documents = await legalService.getDocuments();
    const notes = await legalService.getLawyerNotes();
    
    return {
      cases: cases.length,
      meetings: meetings.length,
      documents: documents.length,
      notes: notes.length
    };
  }

  async resetLegalData(): Promise<void> {
    localStorage.removeItem('legal_cases');
    localStorage.removeItem('legal_meetings');
    localStorage.removeItem('legal_documents');
    localStorage.removeItem('lawyer_notes');
    localStorage.removeItem('legal_data_stats');
    localStorage.removeItem('legal_data_initialized');
    
    await this.initializeLegalTestData();
  }
}

export const legalTestDataService = new LegalTestDataService();