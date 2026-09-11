/**
 * HourlyDayView - نمای ساعت‌بندی شده روز (مشابه Google Calendar)
 * نمایش رویدادها در time slots از ۶ صبح تا ۱۲ شب
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { toPersianNumbers } from '@/utils/persian-numbers';
import { formatJalali } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start_date: Date;
  end_date?: Date;
  color?: string;
  type?: string;
  description?: string;
  location?: string;
  all_day?: boolean;
}

interface HourlyDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (hour: number) => void;
  onNewEvent?: (date: Date) => void;
  className?: string;
}

export function HourlyDayView({ 
  currentDate, 
  events, 
  onEventClick, 
  onTimeSlotClick,
  onNewEvent,
  className 
}: HourlyDayViewProps) {
  // Hours from 6:00 AM to 11:00 PM (23:00)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const isToday = currentDate.toDateString() === new Date().toDateString();
  const currentHour = new Date().getHours();
  
  // Get events for a specific hour
  const getEventsAtHour = (hour: number): CalendarEvent[] => {
    return events.filter(e => {
      if (!e.start_date) return false;
      const eventDate = new Date(e.start_date);
      // Make sure it's the same day
      if (eventDate.toDateString() !== currentDate.toDateString()) return false;
      const eventHour = eventDate.getHours();
      return eventHour === hour;
    });
  };

  // Get all-day events
  const allDayEvents = events.filter(e => e.all_day);
  
  // Format hour for display
  const formatHour = (hour: number): string => {
    return toPersianNumbers(hour.toString().padStart(2, '0')) + ':۰۰';
  };

  // Get weekday in Persian
  const getPersianWeekday = (): string => {
    return new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(currentDate);
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
      {/* Day Header */}
      <div className="text-center p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between mb-2">
          <div className="text-right">
            <div className="text-lg font-semibold">
              {getPersianWeekday()}
            </div>
            <div className="text-sm text-muted-foreground">
              {toPersianNumbers(formatJalali(currentDate, 'DD MMMM YYYY'))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isToday && (
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                امروز
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNewEvent?.(currentDate)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              رویداد جدید
            </Button>
          </div>
        </div>
        
        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-muted-foreground text-right mb-1">تمام روز:</div>
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={cn(
                  "px-3 py-1 rounded text-sm cursor-pointer",
                  "border-r-4 transition-all hover:shadow-md"
                )}
                style={{
                  backgroundColor: `${event.color || '#3b82f6'}15`,
                  borderRightColor: event.color || '#3b82f6',
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Hourly Grid */}
      <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
        {hours.map(hour => {
          const eventsAtHour = getEventsAtHour(hour);
          const isCurrentHour = isToday && hour === currentHour;
          
          return (
            <div 
              key={hour}
              className={cn(
                "flex min-h-[60px] hover:bg-accent/30 cursor-pointer transition-colors",
                isCurrentHour && "bg-primary/5 relative"
              )}
              onClick={() => onTimeSlotClick?.(hour)}
            >
              {/* Current time indicator */}
              {isCurrentHour && (
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary z-10">
                  <div className="absolute right-0 -top-1.5 w-3 h-3 rounded-full bg-primary" />
                </div>
              )}
              
              {/* Time Label */}
              <div className={cn(
                "w-20 flex-shrink-0 p-2 text-sm border-l",
                isCurrentHour ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                <span className="font-medium">
                  {formatHour(hour)}
                </span>
              </div>
              
              {/* Events Container */}
              <div className="flex-1 p-1 relative min-h-[60px]">
                {eventsAtHour.map((event) => {
                  const eventTime = new Date(event.start_date);
                  const endTime = event.end_date ? new Date(event.end_date) : null;
                  
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm mb-1",
                        "border-r-4 transition-all hover:shadow-md cursor-pointer"
                      )}
                      style={{
                        backgroundColor: `${event.color || '#3b82f6'}15`,
                        borderRightColor: event.color || '#3b82f6',
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>
                          {toPersianNumbers(eventTime.getHours().toString().padStart(2, '0'))}:
                          {toPersianNumbers(eventTime.getMinutes().toString().padStart(2, '0'))}
                        </span>
                        {endTime && (
                          <>
                            <span>-</span>
                            <span>
                              {toPersianNumbers(endTime.getHours().toString().padStart(2, '0'))}:
                              {toPersianNumbers(endTime.getMinutes().toString().padStart(2, '0'))}
                            </span>
                          </>
                        )}
                        {event.location && (
                          <span className="truncate">📍 {event.location}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty slot indicator */}
                {eventsAtHour.length === 0 && (
                  <div className="opacity-0 hover:opacity-40 transition-opacity absolute inset-0 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer with event count */}
      <div className="p-2 border-t bg-muted/30 text-center text-sm text-muted-foreground">
        {events.length === 0 ? (
          'هیچ رویدادی برای این روز ثبت نشده'
        ) : (
          `${toPersianNumbers(events.length.toString())} رویداد در این روز`
        )}
      </div>
    </div>
  );
}