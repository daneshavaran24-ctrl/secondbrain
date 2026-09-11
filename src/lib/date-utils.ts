export const persianWeekdaysShort = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export const jalaliMonthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
] as const;

export function toPersianDigits(input: string | number) {
  const s = String(input);
  const map: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
  };
  return s.replace(/[0-9]/g, (d) => map[d] || d);
}

export function isSameDate(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function isIranFriday(date: Date) {
  // In JS Date, 5 corresponds to Friday
  return date.getDay() === 5;
}

// date-fns-jalali helpers
import { startOfMonth, startOfWeek, addDays, getMonth, getYear } from "date-fns-jalali";
import PersianDate from "persian-date";

export function getJalaliMonthGrid(anchor: Date) {
  const monthStart = startOfMonth(anchor);
  // weekStartsOn: 6 -> Saturday
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

export function inCurrentJalaliMonth(date: Date, anchor: Date) {
  return getMonth(date) === getMonth(anchor) && getYear(date) === getYear(anchor);
}

export function formatDayNumbers(date: Date) {
  const j = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(date);
  const g = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', { day: 'numeric' }).format(date);
  const h = new Intl.DateTimeFormat('fa-IR-u-ca-islamic', { day: 'numeric' }).format(date);
  return { j, g, h };
}

export function formatFullDates(date: Date) {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return {
    jalali: new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts).format(date),
    gregorian: new Intl.DateTimeFormat('fa-IR-u-ca-gregory', opts).format(date),
    hijri: new Intl.DateTimeFormat('fa-IR-u-ca-islamic', opts).format(date),
  };
}

export function formatJalaliDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

export function getDaysUntilDue(dueDateString: string): number {
  const dueDate = new Date(dueDateString);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatJalali(date: Date, format: string = 'YYYY/MM/DD'): string {
  const pDate = new PersianDate(date);
  
  switch (format) {
    case 'YYYY/MM/DD':
      return pDate.format('YYYY/MM/DD');
    case 'DD':
      return pDate.format('DD');
    case 'YYYY/MM':
      return pDate.format('YYYY/MM');
    case 'MM/DD':
      return pDate.format('MM/DD');
    default:
      return pDate.format('YYYY/MM/DD');
  }
}

export function parseJalaliToDate(jalaliString: string): Date {
  // Parse format: "1403/08/27" or "1403-08-27"
  const normalizedString = jalaliString.replace(/-/g, '/');
  const pDate = new PersianDate(normalizedString);
  return pDate.toDate();
}

export function convertGregorianToJalali(gregorianDate: Date | string): string {
  if (typeof gregorianDate === 'string') {
    if (!gregorianDate) return '';
    const date = new Date(gregorianDate);
    return formatJalali(date, 'YYYY/MM/DD');
  }
  return formatJalali(gregorianDate, 'YYYY/MM/DD');
}

export function convertJalaliToGregorian(jalaliString: string): string {
  if (!jalaliString) return '';
  const date = parseJalaliToDate(jalaliString);
  // Return in YYYY-MM-DD format for input[type="date"]
  return date.toISOString().split('T')[0];
}

/**
 * Get current hour in Tehran timezone (Asia/Tehran)
 * تهیه ساعت فعلی بر اساس زمان تهران
 */
export function getTehranHour(): number {
  const tehranTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    hour: 'numeric',
    hour12: false
  }).format(new Date());
  
  return parseInt(tehranTime, 10);
}

/**
 * Get current date/time in Tehran timezone
 * تهیه تاریخ و زمان فعلی بر اساس زمان تهران
 */
export function getTehranTime(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(new Date());
  const dateParts: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });
  
  return new Date(
    `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`
  );
}
