declare module 'persian-date' {
  class PersianDate {
    constructor(date?: Date | number[] | string);
    
    year(): number;
    year(year: number): PersianDate;
    
    month(): number;
    month(month: number): PersianDate;
    
    date(): number;
    date(date: number): PersianDate;
    
    day(): number;
    
    toDate(): Date;
    
    static daysInMonth(year: number, month: number): number;
    daysInMonth(year: number, month: number): number;
    
    format(format: string): string;
    
    toString(): string;
    valueOf(): number;
  }
  
  export = PersianDate;
}
