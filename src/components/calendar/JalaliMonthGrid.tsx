import React from "react";
import { persianWeekdaysShort, getJalaliMonthGrid } from "@/lib/date-utils";
import { DayCell } from "./DayCell";

export interface JalaliMonthGridProps {
  currentDate: Date;
  onSelectDate: (d: Date) => void;
  getEventsForDate: (d: Date) => any[];
  getEventColor: (e: any) => string;
  showHijri?: boolean;
  showGregorian?: boolean;
  showEventBars?: boolean;
  highlightFridays?: boolean;
}

export const JalaliMonthGrid: React.FC<JalaliMonthGridProps> = ({
  currentDate,
  onSelectDate,
  getEventsForDate,
  getEventColor,
  showHijri = false,
  showGregorian = false,
  showEventBars = true,
  highlightFridays = true,
}) => {
  const days = React.useMemo(() => getJalaliMonthGrid(currentDate), [currentDate]);

  return (
    <div className="w-full select-none">
      {/* Weekdays header */}
      <div className="mb-2 grid grid-cols-7 items-center gap-1 text-center text-xs text-muted-foreground">
        {persianWeekdaysShort.map((d, idx) => (
          <div key={idx} className="py-2">{d}</div>
        ))}
      </div>
      {/* Grid 6x7 */}
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
    </div>
  );
};
