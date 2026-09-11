import React, { useState, useRef, useEffect } from 'react';
import PersianDate from 'persian-date';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersianDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className,
  disabled = false,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const pDate = new PersianDate(value || new Date());
    return { year: pDate.year(), month: pDate.month() };
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Persian month names
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // Days of week
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Persian number conversion
  const toPersianNumber = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatPersianDate = (date: Date | null) => {
    if (!date) return '';
    const pDate = new PersianDate(date);
    const year = toPersianNumber(pDate.year());
    const month = toPersianNumber(String(pDate.month()).padStart(2, '0'));
    const day = toPersianNumber(String(pDate.date()).padStart(2, '0'));
    return `${year}/${month}/${day}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new PersianDate().daysInMonth(year, month);
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    const firstDay = new PersianDate([year, month, 1]);
    return (firstDay.day() + 1) % 7;
  };

  const handleDateSelect = (day: number) => {
    try {
      const newPersianDate = new PersianDate([currentViewDate.year, currentViewDate.month, day]);
      const gregorianDate = newPersianDate.toDate();
      setSelectedDate(gregorianDate);
      onChange?.(gregorianDate);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating date:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentViewDate(prev => {
      if (direction === 'next') {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 };
        } else {
          return { year: prev.year, month: prev.month + 1 };
        }
      } else {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 };
        } else {
          return { year: prev.year, month: prev.month - 1 };
        }
      }
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentViewDate.year, currentViewDate.month);
    const firstDayOfWeek = getFirstDayOfWeek(currentViewDate.year, currentViewDate.month);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        new PersianDate(selectedDate).date() === day &&
        new PersianDate(selectedDate).month() === currentViewDate.month &&
        new PersianDate(selectedDate).year() === currentViewDate.year;

      const isToday = (() => {
        const today = new PersianDate();
        return today.date() === day &&
               today.month() === currentViewDate.month &&
               today.year() === currentViewDate.year;
      })();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={cn(
            "h-8 w-8 p-0 text-xs rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary/80 font-medium",
            isToday && !isSelected && "bg-accent text-accent-foreground font-medium"
          )}
        >
          {toPersianNumber(day)}
        </button>
      );
    }

    return days;
  };

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedDate ? selectedDate.toISOString() : ''} />
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-right",
          "border border-input rounded-md bg-background",
          "text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "hover:bg-accent/50 transition-colors text-sm",
          disabled && "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} 
          />
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className={cn(
          "text-right text-sm",
          selectedDate ? "text-foreground" : "text-muted-foreground"
        )}>
          {selectedDate ? formatPersianDate(selectedDate) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            "absolute top-full right-0 mt-1 z-50",
            "bg-background border border-input rounded-lg shadow-lg",
            "p-3 w-[300px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            
            <div className="text-center">
              <div className="font-medium text-foreground text-sm">
                {persianMonths[currentViewDate.month - 1]} {toPersianNumber(currentViewDate.year)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-7 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {renderCalendar()}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                onChange?.(today);
                setIsOpen(false);
                const todayPersian = new PersianDate(today);
                setCurrentViewDate({ 
                  year: todayPersian.year(), 
                  month: todayPersian.month() 
                });
              }}
              className="w-full py-2 text-xs text-primary hover:text-primary/80 hover:bg-accent rounded-md transition-colors"
            >
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
