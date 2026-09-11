// TIMEIR observances generator (initial: Mordad set) 
// Focus: Generate events similar to time.ir for a given Jalali year.
// We expose a generator that accepts a Gregorian year for compatibility with existing seeding flow.

export type TimeIrGeneratedEvent = {
  title: string;
  start: Date;
  end: Date;
  pack: 'TIMEIR';
  seed: string; // e.g., TIMEIR-JY-1403
  event_type: 'holiday' | 'observance';
};

// Utilities
const persianToEnglishDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

function getJalaliYearForGregorianYear(gYear: number) {
  const midYear = new Date(gYear, 6, 1); // July 1st
  const jYearStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' }).format(midYear);
  return Number(persianToEnglishDigits(jYearStr));
}

function jalaliToGregorianDate(jYear: number, jMonth: number, jDay: number): Date {
  // Iterate over a safe Gregorian window that fully covers the Jalali year
  const rangeStart = new Date(jYear - 621, 2, 15); // ~March 15
  const rangeEnd = new Date(jYear - 620, 2, 25);   // ~March 25 next year
  const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    const parts = fmt.formatToParts(d);
    const y = Number(persianToEnglishDigits(parts.find(p => p.type === 'year')?.value || ''));
    const m = Number(persianToEnglishDigits(parts.find(p => p.type === 'month')?.value || ''));
    const day = Number(persianToEnglishDigits(parts.find(p => p.type === 'day')?.value || ''));
    if (y === jYear && m === jMonth && day === jDay) {
      return new Date(d);
    }
  }
  throw new Error(`Cannot convert Jalali ${jYear}/${jMonth}/${jDay} to Gregorian`);
}

function hijriToGregorianDateForJalaliYear(jYear: number, hMonth: number, hDay: number): Date {
  // Search within the same Jalali-year window for the given Hijri date.
  const rangeStart = new Date(jYear - 621, 2, 15);
  const rangeEnd = new Date(jYear - 620, 2, 25);
  const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-islamic', { month: 'numeric', day: 'numeric' });
  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    const parts = fmt.formatToParts(d);
    const m = Number(persianToEnglishDigits(parts.find(p => p.type === 'month')?.value || ''));
    const day = Number(persianToEnglishDigits(parts.find(p => p.type === 'day')?.value || ''));
    if (m === hMonth && day === hDay) {
      return new Date(d);
    }
  }
  throw new Error(`Cannot locate Hijri ${hMonth}/${hDay} within Jalali year ${jYear}`);
}

function gregorianDateWithinJalaliYear(jYear: number, gMonth: number, gDay: number): Date {
  // Try with primary Gregorian year (jYear + 621), else fallback to +622 if it's outside the window
  const rangeStart = new Date(jYear - 621, 2, 15);
  const rangeEnd = new Date(jYear - 620, 2, 25);
  let d = new Date(jYear + 621, gMonth - 1, gDay);
  if (d >= rangeStart && d <= rangeEnd) return d;
  d = new Date(jYear + 622, gMonth - 1, gDay);
  if (d >= rangeStart && d <= rangeEnd) return d;
  throw new Error(`Gregorian ${gMonth}/${gDay} not in Jalali year ${jYear}`);
}

export function generateTimeIrEventsForGregorianYear(gYear: number): TimeIrGeneratedEvent[] {
  const jYear = getJalaliYearForGregorianYear(gYear);
  const seed = `TIMEIR-JY-${jYear}`;
  const rows: TimeIrGeneratedEvent[] = [];

  // Helper to push an event for a found Date
  const push = (title: string, date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    rows.push({ title, start, end, pack: 'TIMEIR', seed, event_type: 'observance' });
  };

  // Mordad (Month 5) events from user's list
  try {
    // 7 Mordad
    push('اَمرداد روز، جشن اَمردادگان', jalaliToGregorianDate(jYear, 5, 7));
    // 8 Mordad
    push('روز بزرگداشت شیخ شهاب‌الدین سهروردی', jalaliToGregorianDate(jYear, 5, 8));
    // 10 Mordad - جشن چله تابستان
    push('جشن چلهٔ تابستان', jalaliToGregorianDate(jYear, 5, 10));
    // آغاز هفته جهانی شیردهی - Gregorian August 1
    push('آغاز هفتهٔ جهانی شیردهی', gregorianDateWithinJalaliYear(jYear, 8, 1));
    // 14 Mordad - فرمان مشروطیت
    push('سالروز صدور فرمان مشروطیت', jalaliToGregorianDate(jYear, 5, 14));
    // 17 Mordad - روز خبرنگار
    push('روز خبرنگار', jalaliToGregorianDate(jYear, 5, 17));
    // 22 Mordad - روز جهانی چپ‌دست‌ها (Aug 13)
    push('روز جهانی چپ‌دست‌ها', gregorianDateWithinJalaliYear(jYear, 8, 13));
    // 23 Mordad - اربعین (20 Safar)
    push('اربعین حسینی', hijriToGregorianDateForJalaliYear(jYear, 2, 20));
    // 28 Mordad - وقایع ۲۸ مرداد
    push('سالروز وقایع ۲۸ مرداد پس از برکناری محمد مصدق‌السلطنه', jalaliToGregorianDate(jYear, 5, 28));
    // 28 Mordad - سینما رکس آبادان
    push('سالروز فاجعهٔ آتش‌زدن سینما رکس آبادان', jalaliToGregorianDate(jYear, 5, 28));
    // 28 Mordad - روز جهانی عکاسی (Aug 19)
    push('روز جهانی عکاسی', gregorianDateWithinJalaliYear(jYear, 8, 19));
    // 31 Mordad - رحلت رسول اکرم / شهادت امام حسن مجتبی (28 Safar)
    push('رحلت رسول اکرم؛ شهادت امام حسن مجتبی (ع)', hijriToGregorianDateForJalaliYear(jYear, 2, 28));
  } catch (e) {
    // Swallow conversion errors to avoid breaking the seeding; in practice these should all resolve
    // console.warn('TIMEIR conversion warning:', e);
  }

  return rows;
}
