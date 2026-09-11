/**
 * Persian/Farsi number conversion utilities
 * تبدیل اعداد انگلیسی به فارسی و برعکس
 */

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert English digits to Persian/Farsi digits
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianNumbers = (str: string | number): string => {
    let result = str.toString();
    for (let i = 0; i < englishDigits.length; i++) {
        result = result.replace(new RegExp(englishDigits[i], 'g'), persianDigits[i]);
    }
    return result;
};

/**
 * Convert Persian/Farsi digits to English digits
 * تبدیل اعداد فارسی به انگلیسی
 */
export const toEnglishNumbers = (str: string | number): string => {
    let result = str.toString();
    for (let i = 0; i < persianDigits.length; i++) {
        result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
    }
    return result;
};

/**
 * Format number with Persian separators
 * قالب‌بندی عدد با جداکننده‌های فارسی
 */
export const formatPersianNumber = (num: number | string): string => {
    const numStr = typeof num === 'number' ? num.toString() : num;
    const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '،');
    return toPersianNumbers(formatted);
};

// Legacy aliases for backward compatibility
export const toPersianDigits = toPersianNumbers;
export const toEnglishDigits = toEnglishNumbers;
