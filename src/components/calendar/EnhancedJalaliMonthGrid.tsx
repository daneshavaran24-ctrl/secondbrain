import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { persianWeekdaysShort, getJalaliMonthGrid, inCurrentJalaliMonth, formatDayNumbers, isIranFriday } from "@/lib/date-utils";
import { DayCell } from "./DayCell";
import { HourlyDayView } from "./HourlyDayView";
import { ChevronLeft, ChevronRight, Calendar, Grid, List, Plus, Clock } from "lucide-react";
import { toPersianNumbers } from "@/utils/persian-numbers";
import { formatJalali } from "@/lib/date-utils";

export interface CalendarEvent {
  id: string;
  title: string;
  start_date: Date;
  end_date?: Date;
  color?: string;
  type?: string;
  domain?: string;
  priority?: 'low' | 'medium' | 'high';
  all_day?: boolean;
  description?: string;
  location?: string;
}

export interface EnhancedJalaliMonthGridProps {
  currentDate: Date;
  onSelectDate: (d: Date) => void;
  getEventsForDate: (d: Date) => CalendarEvent[];
  getEventColor: (e: CalendarEvent) => string;
  showHijri?: boolean;
  showGregorian?: boolean;
  showEventBars?: boolean;
  highlightFridays?: boolean;
  onDateChange?: (date: Date) => void;
  onNewEvent?: (date: Date) => void;
  viewMode?: 'month' | 'week' | 'day' | 'hourly';
  onViewModeChange?: (mode: 'month' | 'week' | 'day' | 'hourly') => void;
  className?: string;
}

export const EnhancedJalaliMonthGrid: React.FC<EnhancedJalaliMonthGridProps> = ({
  currentDate,
  onSelectDate,
  getEventsForDate,
  getEventColor,
  showHijri = false,
  showGregorian = false,
  showEventBars = true,
  highlightFridays = true,
  onDateChange,
  onNewEvent,
  viewMode = 'month',
  onViewModeChange,
  className,
}) => {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const days = React.useMemo(() => getJalaliMonthGrid(currentDate), [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const year = parseInt(formatJalali(currentDate, 'YYYY'));
    const month = parseInt(formatJalali(currentDate, 'MM'));
    
    let newYear = year;
    let newMonth = month;
    
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
      const newDate = new Date(currentDate);
      newDate.setFullYear(newYear);
      newDate.setMonth(newMonth - 1);
      onDateChange?.(newDate);
    } catch (error) {
      console.error('Error navigating month:', error);
    }
  };

  const goToToday = () => {
    onDateChange?.(new Date());
  };

  const handleEventDrop = (event: CalendarEvent, targetDate: Date) => {
    // Handle event drag and drop logic here
    console.log('Event dropped:', event, 'on date:', targetDate);
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 6); // Start from Saturday
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day, idx) => {
            const events = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isFriday = isIranFriday(day);
            
            return (
              <div 
                key={idx} 
                className={cn(
                  "p-3 border rounded-lg min-h-[120px] cursor-pointer transition-colors",
                  "hover:bg-accent/50",
                  isToday && "bg-primary/10 border-primary",
                  isFriday && highlightFridays && "bg-accent/30"
                )}
                onClick={() => onSelectDate(day)}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-muted-foreground">
                    {persianWeekdaysShort[idx]}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday && "text-primary"
                  )}>
                    {toPersianNumbers(formatJalali(day, 'DD'))}
                  </div>
                </div>
                
                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded truncate",
                        getEventColor(event)
                      )}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{toPersianNumbers((events.length - 3).toString())} بیشتر
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHourlyView = () => {
    const events = getEventsForDate(currentDate).map(e => ({
      ...e,
      start_date: e.start_date instanceof Date ? e.start_date : new Date(e.start_date),
      end_date: e.end_date ? (e.end_date instanceof Date ? e.end_date : new Date(e.end_date)) : undefined
    }));
    
    return (
      <HourlyDayView
        currentDate={currentDate}
        events={events}
        onEventClick={(event) => onSelectDate(event.start_date)}
        onTimeSlotClick={(hour) => {
          const date = new Date(currentDate);
          date.setHours(hour, 0, 0, 0);
          onNewEvent?.(date);
        }}
        onNewEvent={onNewEvent}
      />
    );
  };

  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="space-y-4">
        {/* Day header */}
        <div className="text-center p-4 border rounded-lg bg-card">
          <div className="text-lg font-semibold">
            {formatJalali(currentDate, 'YYYY/MM/DD')}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(currentDate)}
          </div>
          {isToday && (
            <Badge variant="secondary" className="mt-2">امروز</Badge>
          )}
        </div>

        {/* Events list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">رویدادهای روز</h3>
            <Button
              size="sm"
              onClick={() => onNewEvent?.(currentDate)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              رویداد جدید
            </Button>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ رویدادی برای این روز ثبت نشده است
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 border rounded-lg",
                    getEventColor(event)
                  )}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.start_date && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.start_date).toLocaleTimeString('fa-IR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full select-none space-y-4", className)}>
      {/* Header with navigation and view controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="text-lg font-semibold">
            {formatJalali(currentDate, 'YYYY/MM')}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="mr-2"
          >
            امروز
          </Button>
        </div>

        {/* View mode controls */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange?.('month')}
            className="gap-2"
          >
            <Grid className="h-4 w-4" />
            ماه
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange?.('week')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            هفته
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange?.('day')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            روز
          </Button>
          <Button
            variant={viewMode === 'hourly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange?.('hourly')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            ساعتی
          </Button>
        </div>
      </div>

      {/* Calendar content based on view mode */}
      {viewMode === 'month' && (
        <>
          {/* Weekdays header */}
          <div className="grid grid-cols-7 items-center gap-1 text-center text-xs text-muted-foreground mb-2">
            {persianWeekdaysShort.map((d, idx) => (
              <div key={idx} className="py-2 font-medium">{d}</div>
            ))}
          </div>
          
          {/* Month grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
              const events = getEventsForDate(date);
              return (
                <DayCell
                  key={idx}
                  date={date}
                  anchorDate={currentDate}
                  events={events}
                  onSelect={onSelectDate}
                  showHijri={showHijri}
                  showGregorian={showGregorian}
                  showEventBars={showEventBars}
                  highlightFridays={highlightFridays}
                  getEventColor={getEventColor}
                />
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'hourly' && renderHourlyView()}
    </div>
  );
};