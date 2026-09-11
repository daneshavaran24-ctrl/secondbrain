import React, { useState, useEffect } from 'react';
import { RefreshCw, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuoteData {
  type: 'Quran' | 'Hadith';
  arabic: string;
  persian: string;
  reference: string;
}

const gratitudeQuotes: QuoteData[] = [
  // Quranic Verses
  {
    type: 'Quran',
    arabic: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ ۖ وَلَئِنْ كَفَرْتُمْ إِنَّ عَذَابِي لَشَدِيدٌ',
    persian: 'و هنگامی که پروردگارتان اعلام کرد که اگر واقعاً سپاسگزاری کنید، نعمت شما را افزون خواهم کرد و اگر ناسپاسی نمایید، قطعاً عذاب من سخت خواهد بود.',
    reference: 'سوره ابراهیم، آیه ۷'
  },
  {
    type: 'Quran',
    arabic: 'وَلَقَدْ آتَيْنَا لُقْمَانَ الْحِكْمَةَ أَنِ اشْكُرْ لِلَّهِ ۚ وَمَنْ يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ ۖ وَمَنْ كَفَرَ فَإِنَّ اللَّهَ غَنِيٌّ حَمِيدٌ',
    persian: 'و ما به لقمان حکمت عطا کردیم که خدا را شکر کن، و هر کس شکر حق گوید به نفع خود اوست و هر که ناسپاسی کند، خدا بی‌نیاز و ستوده است.',
    reference: 'سوره لقمان، آیه ۱۲'
  },
  {
    type: 'Quran',
    arabic: 'فَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا وَاشْكُرُوا نِعْمَتَ اللَّهِ إِنْ كُنْتُمْ إِيَّاهُ تَعْبُدُونَ',
    persian: 'از نعمت‌هایی که خدا روزی شما کرده است، حلال و پاکیزه بخورید، و نعمت خدا را سپاس گزارید، اگر تنها خدا را می‌پرستید.',
    reference: 'سوره نحل، آیه ۱۱۴'
  },
  {
    type: 'Quran',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    persian: 'پس مرا یاد کنید تا شما را یاد کنم و شکر مرا به جای آورید و نعمت‌های مرا کفران نکنید.',
    reference: 'سوره بقره، آیه ۱۵۲'
  },
  {
    type: 'Quran',
    arabic: 'وَإِنْ تَشْكُرُوا يَرْضَهُ لَكُمْ',
    persian: 'و اگر سپاس گزارید آن را برای شما می‌پسندد.',
    reference: 'سوره زمر، آیه ۷'
  },
  {
    type: 'Quran',
    arabic: 'فَابْتَغُوا عِنْدَ اللَّهِ الرِّزْقَ وَاعْبُدُوهُ وَاشْكُرُوا لَهُ ۖ إِلَيْهِ تُرْجَعُونَ',
    persian: 'روزی را نزد خدا بجویید و او را بپرستید و شکر او را به جای آورید، به سوی او بازگردانده می‌شوید.',
    reference: 'سوره عنکبوت، آیه ۱۷'
  },
  {
    type: 'Quran',
    arabic: 'مَا يَفْعَلُ اللَّهُ بِعَذَابِكُمْ إِنْ شَكَرْتُمْ وَآمَنْتُمْ ۚ وَكَانَ اللَّهُ شَاكِرًا عَلِيمًا',
    persian: 'اگر سپاس گزارید و ایمان آورید، خدا را با عذاب شما چه کار؟ و خدا همواره سپاس‌پذیر و داناست.',
    reference: 'سوره نساء، آیه ۱۴۷'
  },
  {
    type: 'Quran',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُلُوا مِنْ طَيِّبَاتِ مَا رَزَقْنَاكُمْ وَاشْكُرُوا لِلَّهِ إِنْ كُنْتُمْ إِيَّاهُ تَعْبُدُونَ',
    persian: 'ای کسانی که ایمان آورده‌اید، از چیزهای پاکیزه‌ای که روزی شما کرده‌ایم بخورید و خدا را شکر کنید، اگر فقط او را می‌پرستید.',
    reference: 'سوره بقره، آیه ۱۷۲'
  },
  {
    type: 'Quran',
    arabic: 'كُلُوا مِنْ رِزْقِ رَبِّكُمْ وَاشْكُرُوا لَهُ ۚ بَلْدَةٌ طَيِّبَةٌ وَرَبٌّ غَفُورٌ',
    persian: 'از روزی پروردگارتان بخورید و او را سپاس گزارید. شهری پاکیزه و پروردگاری آمرزنده.',
    reference: 'سوره سبأ، آیه ۱۵'
  },
  {
    type: 'Quran',
    arabic: 'وَاشْكُرُوا نِعْمَتَ اللَّهِ عَلَيْكُمْ',
    persian: 'و نعمت خدا را بر خود شکر کنید.',
    reference: 'سوره مائده، آیه ۱۰۳'
  },
  
  // Hadith
  {
    type: 'Hadith',
    arabic: 'أَوَّلُ مَا يَجِبُ عَلَيْكُمْ لِلَّهِ سُبْحَانَهُ الشُّكْرُ عَلَى آلَائِهِ وَ طَلَبُ مَرْضَاتِهِ',
    persian: 'نخستین چیزی که بر شما در قبال خدای سبحان واجب است، سپاسگزاری از نعمت‌های او و فراهم آوردن موجبات خشنودی اوست.',
    reference: 'امیرالمؤمنین علی (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'إِنَّ اللَّهَ يُحِبُّ كُلَّ قَلْبٍ حَزِينٍ وَ يُحِبُّ كُلَّ عَبْدٍ شَكُورٍ',
    persian: 'همانا خداوند مهربان دوست دارد هر قلب حزین و غمگینی را و نیز هر بنده شکرگذاری را دوست دارد.',
    reference: 'امام صادق (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'الْعَفَافُ زِينَةُ الْفَقْرِ وَ الشُّكْرُ زِينَةُ الْغِنَى',
    persian: 'خویشتن‌داری، زینت فقر است و سپاسگزاری زینت غنا و توانگری.',
    reference: 'امام علی (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'فَمَنْ لَمْ يَشْكُرْ وَالِدَيْهِ لَمْ يَشْكُرِ اللَّهَ',
    persian: 'کسی که از پدر و مادرش سپاسگزاری نکند، از خدا سپاسگزاری نکرده است.',
    reference: 'امام رضا (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'مَنْ أَنْعَمَ اللَّهُ عَلَيْهِ بِنِعْمَةٍ فَعَرَفَهَا بِقَلْبِهِ فَقَدْ أَدَّى شُكْرَهَا',
    persian: 'کسی که خداوند به او نعمتی دهد و آن را با قلبش بشناسد، شکر آن را ادا کرده است.',
    reference: 'امام صادق (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'الشُّكْرُ يَزِيدُ فِي النِّعَمِ',
    persian: 'شکرگزاری نعمت‌ها را افزایش می‌دهد.',
    reference: 'پیامبر اکرم (ص)'
  },
  {
    type: 'Hadith',
    arabic: 'شُكْرُكَ لِنِعْمَةٍ مَاضِيَةٍ يُوجِبُ نِعْمَةً مُسْتَقْبَلَةً',
    persian: 'شکر تو بر نعمت گذشته، زمینه‌ساز نعمت آینده است.',
    reference: 'امام حسین (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'كَمَالُ الشُّكْرِ قَوْلُ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    persian: 'کامل‌ترین شکر، گفتن "الحمدلله رب العالمین" است.',
    reference: 'امام باقر (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'إِذَا أَنْعَمَ اللَّهُ عَلَى عَبْدٍ نِعْمَةً فَشَكَرَهَا قَبْلَ أَنْ يُظْهِرَهَا بِلِسَانِهِ فَقَدْ أَدَّى شُكْرَهَا',
    persian: 'چون خداوند به بنده‌ای نعمتی دهد و بنده در دل شکر آن نعمت را بگزارد، پیش از آنکه سپاسگزاری از آن را به زبان آورد، مستوجب افزایش آن نعمت گردد.',
    reference: 'امام صادق (ع)'
  },
  {
    type: 'Hadith',
    arabic: 'مَنْ شَكَرَ اللَّهَ عَلَى نِعْمَةٍ زَادَهُ اللَّهُ فِيهَا',
    persian: 'کسی که خدا را بر نعمتی شکر کند، خداوند آن نعمت را برایش افزایش دهد.',
    reference: 'امام علی (ع)'
  }
];

const GratitudeQuoteDisplay: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<QuoteData>(gratitudeQuotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * gratitudeQuotes.length);
    return gratitudeQuotes[randomIndex];
  };

  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentQuote(getRandomQuote());
      setIsAnimating(false);
    }, 200);
  };

  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, []);

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-sm">
      <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {currentQuote.type === 'Quran' ? '📖 قرآن کریم' : '💫 حدیث شریف'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshQuote}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isAnimating}
          >
            <RefreshCw className={`h-4 w-4 ${isAnimating ? 'animate-spin' : ''}`} />
            <span className="mr-1 text-xs">تازه‌سازی</span>
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Arabic Text */}
          <div className="text-right">
            <p 
              className="text-lg leading-relaxed text-foreground font-arabic"
              style={{ fontFamily: 'Amiri, Scheherazade New, serif' }}
            >
              {currentQuote.arabic}
            </p>
          </div>
          
          {/* Persian Translation */}
          <div className="text-right">
            <p className="text-app-readable text-muted-foreground leading-relaxed italic">
              {currentQuote.persian}
            </p>
          </div>
          
          {/* Reference */}
          <div className="text-left">
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
              {currentQuote.reference}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GratitudeQuoteDisplay;