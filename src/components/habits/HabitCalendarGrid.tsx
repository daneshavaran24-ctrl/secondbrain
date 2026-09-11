import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Edit, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Habit, HabitCompletion } from '@/services/habitTrackerService';
import confetti from 'canvas-confetti';

interface HabitCalendarGridProps {
  habits: Habit[];
  completions: HabitCompletion[];
  currentMonth: Date;
  onToggle: (habitId: string, date: string) => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  onArchiveHabit: (habit: Habit) => void;
  onNextMonth: () => void;
  onPrevMonth: () => void;
}

export const HabitCalendarGrid: React.FC<HabitCalendarGridProps> = ({
  habits,
  completions,
  currentMonth,
  onToggle,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onArchiveHabit,
  onNextMonth,
  onPrevMonth,
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const isCompleted = (habitId: string, date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.some(
      c => c.habit_id === habitId && c.completion_date === dateStr && c.completed
    );
  };

  const handleToggle = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    onToggle(habitId, dateStr);

    // Celebration effect
    if (!isCompleted(habitId, date)) {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevMonth}
            className="hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={onAddHabit} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن عادت
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days header */}
          <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `200px repeat(${daysInMonth.length}, 40px)` }}>
            <div className="font-semibold text-sm text-muted-foreground">عادت</div>
            {daysInMonth.map(day => (
              <div
                key={day.toISOString()}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {format(day, 'd')}
              </div>
            ))}
          </div>

          {/* Habits rows */}
          {habits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              هنوز عادتی ثبت نشده است. روی "افزودن عادت" کلیک کنید.
            </div>
          ) : (
            habits.map(habit => (
              <div
                key={habit.id}
                className="grid gap-2 py-2 border-b border-border last:border-0 group"
                style={{ gridTemplateColumns: `200px repeat(${daysInMonth.length}, 40px)` }}
              >
                {/* Habit name with menu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{habit.emoji}</span>
                    <span className="text-sm font-medium truncate">{habit.title}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditHabit(habit);
                        }}
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveHabit(habit);
                        }}
                      >
                        <Archive className="h-4 w-4 ml-2" />
                        آرشیو
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHabit(habit);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Checkboxes */}
                {daysInMonth.map(day => {
                  const cellKey = `${habit.id}-${format(day, 'yyyy-MM-dd')}`;
                  const completed = isCompleted(habit.id, day);
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <div
                      key={cellKey}
                      className="flex items-center justify-center"
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <Checkbox
                        checked={completed}
                        onCheckedChange={() => handleToggle(habit.id, day)}
                        className={cn(
                          'transition-all duration-200',
                          completed && 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600',
                          isToday && 'ring-2 ring-primary ring-offset-2',
                          hoveredCell === cellKey && 'scale-110'
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
