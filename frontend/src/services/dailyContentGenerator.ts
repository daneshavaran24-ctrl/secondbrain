import { DailyContent, QuranVerse, MotivationalQuote } from '@/types';

export function generateDailyContent(): DailyContent {
  const quranVerses: QuranVerse[] = [
    {
      id: '1',
      arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
      persian: 'و هر کس از خدا بترسد، خداوند برای او راه خروجی قرار می‌دهد',
      surah: 'طلاق',
      verse: 2,
      tafsir: 'این آیه در مورد اهمیت تقوا و اعتماد به خداوند است',
    },
    {
      id: '2',
      arabic: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ',
      persian: 'و چه بسا چیزی را خوش نداشته باشید در حالی که آن برای شما بهتر است',
      surah: 'بقره',
      verse: 216,
    },
    {
      id: '3',
      arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      persian: 'بی‌گمان با سختی آسانی است',
      surah: 'انشراح',
      verse: 6,
    }
  ];

  const motivationalQuotes: MotivationalQuote[] = [
    {
      id: '1',
      text: 'موفقیت مجموع تلاش‌های کوچک است که هر روز تکرار می‌شود.',
      author: 'رابرت کولیر',
      category: 'success'
    },
    {
      id: '2',
      text: 'علم بهترین سرمایه است؛ زیرا نه دزدیده می‌شود و نه از بین می‌رود.',
      author: 'حضرت علی (ع)',
      category: 'knowledge'
    },
    {
      id: '3',
      text: 'بهترین زمان برای کاشتن درخت ۲۰ سال پیش بوده است. دومین بهترین زمان، همین الان است.',
      author: 'ضرب‌المثل چینی',
      category: 'success'
    },
    {
      id: '4',
      text: 'کیفیت زندگی‌تان بر اساس کیفیت سؤالاتی که از خودتان می‌پرسید تعین می‌شود.',
      author: 'تونی رابینز',
      category: 'leadership'
    },
    {
      id: '5',
      text: 'هدف از زندگی این نیست که خوشحال باشیم، بلکه این است که مفید، صالح، دلسوز و تفاوت آفرین باشیم.',
      author: 'رالف والدو امرسون',
      category: 'spirituality'
    }
  ];

  // انتخاب تصادفی آیه و جمله انگیزشی
  const todayVerse = quranVerses[Math.floor(Math.random() * quranVerses.length)];
  const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const dailyContent: DailyContent = {
    date: new Date().toISOString(),
    verse: todayVerse,
    quote: todayQuote
  };

  return dailyContent;
}

export function getWeeklyContent(): DailyContent[] {
  const weeklyContent: DailyContent[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const content = generateDailyContent();
    content.date = date.toISOString();
    weeklyContent.push(content);
  }
  
  return weeklyContent;
}

// تولید محتوای ویژه برای مناسبت‌ها
export function generateSpecialOccasionContent(occasion: string): DailyContent {
  const specialQuotes: { [key: string]: MotivationalQuote } = {
    'نوروز': {
      id: 'special-1',
      text: 'سال نو، فرصتی است برای شروعی تازه و رها شدن از گذشته',
      author: 'سعدی شیرازی',
      category: 'spirituality'
    },
    'شب یلدا': {
      id: 'special-2',
      text: 'در طولانی‌ترین شب سال، نور امید در دل‌ها روشن می‌شود',
      author: 'حافظ شیرازی',
      category: 'spirituality'
    }
  };

  const baseContent = generateDailyContent();
  
  if (specialQuotes[occasion]) {
    baseContent.quote = specialQuotes[occasion];
  }
  
  return baseContent;
}