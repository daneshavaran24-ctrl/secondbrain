import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDayNumbers, formatFullDates, inCurrentJalaliMonth, isIranFriday, isSameDate, toPersianDigits } from "@/lib/date-utils";

interface DayCellProps {
  date: Date;
  anchorDate: Date;
  events: any[];
  onSelect: (d: Date) => void;
  showHijri?: boolean;
  showGregorian?: boolean;
  showEventBars?: boolean;
  highlightFridays?: boolean;
  getEventColor: (e: any) => string;
}

export const DayCell: React.FC<DayCellProps> = ({
  date,
  anchorDate,
  events,
  onSelect,
  showHijri = false,
  showGregorian = false,
  showEventBars = true,
  highlightFridays = true,
  getEventColor,
}) => {
  const inMonth = inCurrentJalaliMonth(date, anchorDate);
  const today = isSameDate(date, new Date());
  const friday = isIranFriday(date);
  const nums = formatDayNumbers(date);
  const full = formatFullDates(date);
  const hasHoliday = events?.some((e) => e?.event_type === 'holiday' || (e?.title || '').includes('تعط'));

  const cell = (
    <button
      onClick={() => inMonth && onSelect(date)}
      className={cn(
        "relative flex h-20 w-full flex-col justify-between rounded-md border p-2 text-right transition-colors",
        "bg-background/50 hover:bg-accent/30",
        inMonth ? "opacity-100" : "opacity-40 pointer-events-none",
        today && "ring-2 ring-primary/40",
        highlightFridays && friday && "[&_.jnum]:text-destructive"
      )}
    >
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        {showGregorian ? <span className="gnum">{nums.g}</span> : <span />}
        {showHijri ? <span className="hnum">{nums.h}</span> : <span />}
      </div>
      <div className={cn("jnum text-base font-medium", hasHoliday && "text-destructive")}>{nums.j}</div>
      {showEventBars && inMonth && (
        <div className="mt-1 flex w-full items-center gap-1">
          {events?.slice(0, 2).map((e, i) => (
            <span
              key={i}
              className="h-1.5 w-full max-w-[36px] flex-1 rounded-full"
              style={{ backgroundColor: getEventColor(e) }}
            />
          ))}
          {events?.length > 2 && (
            <span className="ml-auto text-[10px] text-muted-foreground">+{toPersianDigits(events.length - 2)}</span>
          )}
        </div>
      )}
    </button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{cell}</TooltipTrigger>
        <TooltipContent className="max-w-[260px]">
          <div className="space-y-1">
            <div className="text-sm font-medium">{full.jalali}</div>
            {(showGregorian || showHijri) && (
              <div className="text-xs text-muted-foreground">
                {showGregorian && <div>{full.gregorian}</div>}
                {showHijri && <div>{full.hijri}</div>}
              </div>
            )}
            {events?.length ? (
              <ul className="mt-2 list-disc pr-4 text-xs">
                {events.map((e, i) => (
                  <li key={i} className="leading-5" style={{ direction: 'rtl' }}>{e.title}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
