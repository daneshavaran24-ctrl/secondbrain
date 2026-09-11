import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatJalali, parseJalaliToDate, jalaliMonthNames } from "@/lib/date-utils";
import { toPersianNumbers } from "@/utils/persian-numbers";

interface EnhancedPersianDatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  showTime?: boolean;
  range?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const EnhancedPersianDatePicker: React.FC<EnhancedPersianDatePickerProps> = ({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className,
  disabled = false,
  name,
  showTime = false,
  range = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseJalaliToDate(value) : null
  );
  const [currentViewDate, setCurrentViewDate] = useState<Date>(
    selectedDate || new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>("12:00");

  const formatPersianDate = (date: Date | null): string => {
    if (!date) return "";
    const jalaliStr = formatJalali(date, 'YYYY/MM/DD');
    return showTime ? `${jalaliStr} ${selectedTime}` : jalaliStr;
  };

  const getDaysInMonth = (year: number, month: number): number => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapYear(year) ? 30 : 29;
  };

  const isLeapYear = (year: number): boolean => {
    return ((year % 33) * 8 + (Math.floor((year % 33) / 4))) % 30 < 8;
  };

  const getFirstDayOfWeek = (year: number, month: number): number => {
    const firstDay = new Date(year - 621, month - 1, 1);
    return (firstDay.getDay() + 1) % 7;
  };

  const handleDateSelect = (day: number): void => {
    const pYear = parseInt(formatJalali(currentViewDate, 'YYYY'));
    const pMonth = parseInt(formatJalali(currentViewDate, 'MM'));
    
    try {
      const selectedJalali = `${pYear}/${pMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
      const newDate = parseJalaliToDate(selectedJalali);
      
      setSelectedDate(newDate);
      const formattedValue = showTime ? `${selectedJalali} ${selectedTime}` : selectedJalali;
      onChange?.(formattedValue);
      
      if (!showTime) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error selecting date:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next'): void => {
    const pYear = parseInt(formatJalali(currentViewDate, 'YYYY'));
    const pMonth = parseInt(formatJalali(currentViewDate, 'MM'));
    
    let newYear = pYear;
    let newMonth = pMonth;
    
    if (direction === 'next') {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    } else {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    }
    
    try {
      const newJalali = `${newYear}/${newMonth.toString().padStart(2, '0')}/01`;
      const newDate = parseJalaliToDate(newJalali);
      setCurrentViewDate(newDate);
    } catch (error) {
      console.error('Error navigating month:', error);
    }
  };

  const renderCalendar = (): JSX.Element => {
    const pYear = parseInt(formatJalali(currentViewDate, 'YYYY'));
    const pMonth = parseInt(formatJalali(currentViewDate, 'MM'));
    const daysInMonth = getDaysInMonth(pYear, pMonth);
    const firstDayOfWeek = getFirstDayOfWeek(pYear, pMonth);

    const days: JSX.Element[] = [];
    const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    // Header with weekdays
    weekDays.forEach((day, index) => {
      days.push(
        <div key={`weekday-${index}`} className="text-center text-xs font-medium text-muted-foreground p-2">
          {day}
        </div>
      );
    });

    // Empty cells for days before month start
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        parseInt(formatJalali(selectedDate, 'YYYY')) === pYear &&
        parseInt(formatJalali(selectedDate, 'MM')) === pMonth &&
        parseInt(formatJalali(selectedDate, 'DD')) === day;

      const isToday = new Date().toDateString() === 
        parseJalaliToDate(`${pYear}/${pMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`).toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={cn(
            "p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isSelected && "bg-primary text-primary-foreground",
            isToday && !isSelected && "bg-accent font-semibold",
            "min-h-[32px] min-w-[32px] flex items-center justify-center"
          )}
        >
          {toPersianNumbers(day.toString())}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    );
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const jalaliStr = formatJalali(selectedDate, 'YYYY/MM/DD');
      onChange?.(showTime ? `${jalaliStr} ${time}` : jalaliStr);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-right font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Calendar className="ml-2 h-4 w-4" />
          {selectedDate ? formatPersianDate(selectedDate) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-1 h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="text-sm font-medium">
              {jalaliMonthNames[parseInt(formatJalali(currentViewDate, 'MM')) - 1]} {toPersianNumbers(formatJalali(currentViewDate, 'YYYY'))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          {renderCalendar()}

          {/* Time picker */}
          {showTime && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                زمان
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedTime.split(':')[0]} 
                  onChange={(e) => handleTimeChange(`${e.target.value}:${selectedTime.split(':')[1]}`)}
                  className="flex-1 text-sm border rounded px-2 py-1"
                >
                  {Array.from({length: 24}, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {toPersianNumbers(i.toString().padStart(2, '0'))}
                    </option>
                  ))}
                </select>
                <select 
                  value={selectedTime.split(':')[1]} 
                  onChange={(e) => handleTimeChange(`${selectedTime.split(':')[0]}:${e.target.value}`)}
                  className="flex-1 text-sm border rounded px-2 py-1"
                >
                  {Array.from({length: 60}, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {toPersianNumbers(i.toString().padStart(2, '0'))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Today button */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setCurrentViewDate(today);
                const jalaliToday = formatJalali(today, 'YYYY/MM/DD');
                const formattedValue = showTime ? `${jalaliToday} ${selectedTime}` : jalaliToday;
                onChange?.(formattedValue);
                if (!showTime) setIsOpen(false);
              }}
              className="w-full"
            >
              امروز
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};