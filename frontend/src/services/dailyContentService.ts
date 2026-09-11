// Daily Content Service - آیات قرآن و جملات انگیزشی روزانه
// Service for managing daily Quranic verses and motivational quotes

export interface QuranVerse {
  id: string;
  arabic: string;
  persian: string;
  surah: string;
  verse: number;
  tafsir?: string;
}

export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category: 'success' | 'health' | 'knowledge' | 'leadership' | 'spirituality';
}

export interface DailyContent {
  date: string;
  verse: QuranVerse;
  quote: MotivationalQuote;
}

export interface DailyContentSettings {
  showVerse: boolean;
  showQuote: boolean;
  autoRotate: boolean;
  rotationInterval: number; // in hours
}

// مجموعه آیات قرآن کریم با ترجمه فارسی
const quranVerses: QuranVerse[] = [
  {
    id: "1",
    arabic: "وَفِي أَنفُسِكُمْ ۚ أَفَلَا تُبْصِرُونَ",
    persian: "و در وجود خودتان (نیز نشانه‌هایی است)، آیا نمی‌بینید؟",
    surah: "الذاریات",
    verse: 21,
    tafsir: "انسان باید به درون خود نگاه کند تا حقایق را بیابد"
  },
  {
    id: "2",
    arabic: "وَمَن یَتَّقِ اللَّهَ یَجْعَل لَّهُ مَخْرَجًا",
    persian: "و هر کس از خدا بترسد، خداوند برای او راه نجاتی قرار می‌دهد",
    surah: "الطلاق",
    verse: 2,
    tafsir: "تقوا راه حل تمام مشکلات است"
  },
  {
    id: "3",
    arabic: "إِنَّ مَعَ الْعُسْرِ یُسْرًا",
    persian: "همانا با سختی، آسانی است",
    surah: "الشرح",
    verse: 6,
    tafsir: "پس از هر مشکلی، راه حل و آرامش می‌آید"
  },
  {
    id: "4",
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    persian: "و بگو: پروردگارا، بر علم من بیفزای",
    surah: "طه",
    verse: 114,
    tafsir: "دعای طلب علم و دانش از خداوند"
  },
  {
    id: "5",
    arabic: "وَمَن جَاهَدَ فَإِنَّمَا یُجَاهِدُ لِنَفْسِهِ",
    persian: "و کسی که کوشش کند، تنها برای خودش کوشش می‌کند",
    surah: "العنکبوت",
    verse: 6,
    tafsir: "تلاش و کوشش در راه خیر، به نفع خود انسان است"
  },
  {
    id: "6",
    arabic: "وَلَا تَیْأَسُوا مِن رَّوْحِ اللَّهِ",
    persian: "و از رحمت خدا مایوس نشوید",
    surah: "یوسف",
    verse: 87,
    tafsir: "همیشه به رحمت و کمک خداوند امید داشته باشید"
  },
  {
    id: "7",
    arabic: "وَبَشِّرِ الصَّابِرِينَ",
    persian: "و صبر کنندگان را بشارت ده",
    surah: "البقره",
    verse: 155,
    tafsir: "صبر و استقامت رمز موفقیت است"
  },
  {
    id: "8",
    arabic: "لَا یُکَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    persian: "خداوند بر هیچ کس جز به اندازه توانش تکلیف نمی‌کند",
    surah: "البقره",
    verse: 286,
    tafsir: "خداوند فقط آنچه را که ما توان انجامش را داریم از ما می‌خواهد"
  }
];

// مجموعه جملات انگیزشی فارسی
const motivationalQuotes: MotivationalQuote[] = [
  {
    id: "1",
    text: "موفقیت نتیجه آمادگی، سخت کوشی و یادگیری از شکست است.",
    author: "کولین پاول",
    category: "success"
  },
  {
    id: "2",
    text: "بزرگ‌ترین انقلاب زمان ما، کشف این حقیقت است که انسان می‌تواند با تغییر نگرش ذهنی‌اش، زندگی‌اش را تغییر دهد.",
    author: "ویلیام جیمز",
    category: "leadership"
  },
  {
    id: "3",
    text: "سلامتی ثروت واقعی است، نه طلا و نقره.",
    author: "مهاتما گاندی",
    category: "health"
  },
  {
    id: "4",
    text: "دانش قدرت است، اما دانش با عمل تبدیل به حکمت می‌شود.",
    author: "فرانسیس بیکن",
    category: "knowledge"
  },
  {
    id: "5",
    text: "رهبری واقعی این نیست که دیگران را مجبور به پیروی کنید، بلکه آنها را ترغیب به رشد کنید.",
    author: "جان کوینسی آدامز",
    category: "leadership"
  },
  {
    id: "6",
    text: "بهترین زمان برای کاشتن درخت بیست سال پیش بود. دومین بهترین زمان الان است.",
    author: "ضرب المثل چینی",
    category: "success"
  },
  {
    id: "7",
    text: "آرامش درونی به معنای فقدان استرس نیست، بلکه توانایی حفظ آرامش در وسط طوفان است.",
    author: "مجهول",
    category: "spirituality"
  },
  {
    id: "8",
    text: "هر روز که می‌گذرد فرصتی جدید برای یادگیری و رشد است.",
    author: "اپرا وینفری",
    category: "knowledge"
  }
];

class DailyContentService {
  private static instance: DailyContentService;

  private constructor() {}

  static getInstance(): DailyContentService {
    if (!DailyContentService.instance) {
      DailyContentService.instance = new DailyContentService();
    }
    return DailyContentService.instance;
  }

  // دریافت محتوای روزانه بر اساس تاریخ
  getDailyContent(date: Date = new Date()): DailyContent {
    const dayOfYear = this.getDayOfYear(date);
    
    const verseIndex = dayOfYear % quranVerses.length;
    const quoteIndex = (dayOfYear + 1) % motivationalQuotes.length;

    return {
      date: date.toISOString().split('T')[0],
      verse: quranVerses[verseIndex],
      quote: motivationalQuotes[quoteIndex]
    };
  }

  // دریافت آیه تصادفی
  getRandomVerse(): QuranVerse {
    const randomIndex = Math.floor(Math.random() * quranVerses.length);
    return quranVerses[randomIndex];
  }

  // دریافت جمله انگیزشی تصادفی
  getRandomQuote(): MotivationalQuote {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  }

  // دریافت محتوا بر اساس دسته‌بندی
  getQuotesByCategory(category: MotivationalQuote['category']): MotivationalQuote[] {
    return motivationalQuotes.filter(quote => quote.category === category);
  }

  // ذخیره محتوای مورد علاقه
  saveFavorite(type: 'verse' | 'quote', id: string): void {
    const favorites = this.getFavorites();
    if (!favorites[type].includes(id)) {
      favorites[type].push(id);
      localStorage.setItem('dailyContentFavorites', JSON.stringify(favorites));
    }
  }

  // حذف از علاقه‌مندی‌ها
  removeFavorite(type: 'verse' | 'quote', id: string): void {
    const favorites = this.getFavorites();
    favorites[type] = favorites[type].filter(fId => fId !== id);
    localStorage.setItem('dailyContentFavorites', JSON.stringify(favorites));
  }

  // دریافت محتوای مورد علاقه
  getFavorites(): { verse: string[], quote: string[] } {
    const saved = localStorage.getItem('dailyContentFavorites');
    return saved ? JSON.parse(saved) : { verse: [], quote: [] };
  }

  // دریافت تنظیمات
  getSettings(): DailyContentSettings {
    const saved = localStorage.getItem('dailyContentSettings');
    return saved ? JSON.parse(saved) : {
      showVerse: true,
      showQuote: true,
      autoRotate: false,
      rotationInterval: 6
    };
  }

  // ذخیره تنظیمات
  saveSettings(settings: DailyContentSettings): void {
    localStorage.setItem('dailyContentSettings', JSON.stringify(settings));
  }

  // محاسبه روز سال (1-365/366)
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // بررسی اینکه آیا محتوا مورد علاقه است یا نه
  isFavorite(type: 'verse' | 'quote', id: string): boolean {
    const favorites = this.getFavorites();
    return favorites[type].includes(id);
  }

  // اشتراک‌گذاری محتوا
  shareContent(type: 'verse' | 'quote', content: QuranVerse | MotivationalQuote): string {
    if (type === 'verse') {
      const verse = content as QuranVerse;
      return `"${verse.persian}"\n${verse.arabic}\n- سوره ${verse.surah}، آیه ${verse.verse}`;
    } else {
      const quote = content as MotivationalQuote;
      return `"${quote.text}"\n- ${quote.author}`;
    }
  }
}

export const dailyContentService = DailyContentService.getInstance();