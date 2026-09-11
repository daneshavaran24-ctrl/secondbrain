import { supabaseKnowledgeService } from '@/services/supabaseKnowledgeService';

// Seed a concise, meaningful set of knowledge samples across PARA and types
export async function seedKnowledgeSamples() {
  const samples = [
    // Projects
    { title: 'طرح بهبود خدمت مشتری وارید', content: 'اهداف: کاهش زمان پاسخگویی، ارتقای شاخص رضایت. گام‌های کلیدی و KPI ها تعریف شده‌اند.', category: 'Projects', type: 'document', tags: ['Varid','خدمات','KPI'] },
    { title: 'برنامه مهاجرت فنی وب‌سایت', content: 'مهاجرت از سیستم قدیمی به Vite + React. چک‌لیست تست و انتشار.', category: 'Projects', type: 'text', tags: ['React','Vite','DevOps'] },

    // Areas
    { title: 'حوزه: بازاریابی محتوایی', content: 'تقویم محتوا، کانال‌ها، دستورالعمل برندینگ، شاخص‌های کلیدی.', category: 'Areas', type: 'document', tags: ['بازاریابی','برندینگ'] },
    { title: 'حوزه: مدیریت مالی شخصی', content: 'روش بودجه‌بندی 50/30/20، ابزارهای پیگیری هزینه‌ها.', category: 'Areas', type: 'text', tags: ['مالی','بودجه'] },

    // Resources
    { title: 'لیست منابع: هوش مصنوعی عملی', content: 'کتاب‌ها، دوره‌ها و مقالات منتخب برای یادگیری عملی AI.', category: 'Resources', type: 'link', tags: ['AI','یادگیری'] , link: 'https://example.com/ai-resources'},
    { title: 'الگوی صورتجلسه مؤثر', content: 'قالب استاندارد صورتجلسه به همراه نکات خلاصه‌سازی.', category: 'Resources', type: 'document', tags: ['جلسات','قالب'] },

    // Archives
    { title: 'گزارش قدیمی عملکرد 1401', content: 'نسخه آرشیو جهت مراجعه آینده.', category: 'Archives', type: 'pdf', tags: ['گزارش','آرشیو'] },
    { title: 'یادداشت‌های رویداد فناورانه 1400', content: 'خلاصه نکات و ارتباطات مهم.', category: 'Archives', type: 'text', tags: ['رویداد','شبکه‌سازی'] },

    // Mixed types
    { title: 'چک‌لیست انتشار محصول', content: 'PRD، تست‌های رگرسیون، مانیتورینگ، آماده‌سازی پشتیبانی.', category: 'Projects', type: 'document', tags: ['Product','QA'] },
    { title: 'راهنمای PARA به زبان ساده', content: 'Projects, Areas, Resources, Archives — چرا و چگونه.', category: 'Resources', type: 'text', tags: ['PARA','سازماندهی'] },
    { title: 'پیوندهای منتخب اتاق بازرگانی', content: 'لینک‌های مفید برای پیگیری روندها و مقررات.', category: 'Resources', type: 'link', tags: ['Chamber','مقررات'], link: 'https://example.com/links' },
    { title: 'الگوی ایمیل واگذاری وظیفه', content: 'Subject: واگذاری وظیفه {عنوان}\nبدنه: شرح، مهلت، پیوست‌ها، انتظار تایید.', category: 'Resources', type: 'document', tags: ['واگذاری','ایمیل'] },
    { title: 'یادداشت جلسه فرانگاران', content: 'مصوبات کلیدی و ریسک‌ها.', category: 'Projects', type: 'text', tags: ['Frangaran','جلسه'] },
    { title: 'راهنمای مصاحبه استخدام', content: 'سوالات ساختاریافته و معیارهای ارزیابی.', category: 'Areas', type: 'document', tags: ['HR','مصاحبه'] },
  ];

  let created = 0;
  for (const s of samples) {
    try {
      await supabaseKnowledgeService.storeKnowledge(s.content, s.type as any, {
        title: s.title,
        category: s.category as any,
        tags: s.tags,
        metadata: { seeded: true, url: (s as any).link }
      });
      created++;
    } catch (e) {
      console.error('Seed item failed', s.title, e);
    }
  }
  return created;
}
