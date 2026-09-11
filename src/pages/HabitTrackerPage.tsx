import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart3, Settings, CheckSquare } from 'lucide-react';
import { HabitCalendarGrid } from '@/components/habits/HabitCalendarGrid';
import { HabitProgressDashboard } from '@/components/habits/HabitProgressDashboard';
import { HabitManager } from '@/components/habits/HabitManager';
import { HabitSettings } from '@/components/habits/HabitSettings';
import { DeleteHabitDialog } from '@/components/habits/DeleteHabitDialog';
import { habitTrackerService, Habit, HabitCompletion, MonthlyStats } from '@/services/habitTrackerService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addMonths, subMonths } from 'date-fns';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';

const HabitTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'calendar' | 'stats' | 'settings'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHabitManager, setShowHabitManager] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  useEffect(() => {
    if (user) {
      initializeHabits();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentMonth]);

  const initializeHabits = async () => {
    if (!user) return;
    try {
      const existingHabits = await habitTrackerService.getHabits(user.id);
      if (existingHabits.length === 0) {
        await habitTrackerService.initializeDefaultHabits(user.id);
        await loadData();
      }
    } catch (error) {
      console.error('Error initializing habits:', error);
    }
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [habitsData, completionsData, statsData] = await Promise.all([
        habitTrackerService.getHabits(user.id),
        habitTrackerService.getCompletionsForMonth(
          user.id,
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1
        ),
        habitTrackerService.getMonthlyStats(
          user.id,
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1
        ),
      ]);

      setHabits(habitsData);
      setCompletions(completionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری داده‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async (habitId: string, date: string) => {
    if (!user) return;
    try {
      await habitTrackerService.toggleCompletion(habitId, user.id, date);
      await loadData();
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ثبت تکمیل',
        variant: 'destructive',
      });
    }
  };

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    if (!user) return;
    try {
      if (selectedHabit) {
        await habitTrackerService.updateHabit(selectedHabit.id, habitData);
        toast({
          title: 'عادت ویرایش شد',
          description: 'تغییرات با موفقیت ذخیره شد.',
        });
      } else {
        await habitTrackerService.createHabit({
          ...habitData,
          user_id: user.id,
          is_active: true,
          sort_order: habits.length,
        } as any);
        toast({
          title: 'عادت اضافه شد',
          description: 'عادت جدید با موفقیت ایجاد شد.',
        });
      }
      await loadData();
      setShowHabitManager(false);
      setSelectedHabit(null);
    } catch (error) {
      console.error('Error saving habit:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره عادت',
        variant: 'destructive',
      });
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowHabitManager(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit);
    setShowDeleteDialog(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    try {
      await habitTrackerService.deleteHabit(habitToDelete.id);
      toast({
        title: 'عادت حذف شد',
        description: 'عادت با موفقیت حذف شد.',
      });
      await loadData();
      setShowDeleteDialog(false);
      setHabitToDelete(null);
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: 'خطا',
        description: 'خطا در حذف عادت',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveHabit = async (habit: Habit) => {
    try {
      await habitTrackerService.archiveHabit(habit.id);
      toast({
        title: 'عادت آرشیو شد',
        description: 'عادت با موفقیت آرشیو شد و دیگر نمایش داده نمی‌شود.',
      });
      await loadData();
    } catch (error) {
      console.error('Error archiving habit:', error);
      toast({
        title: 'خطا',
        description: 'خطا در آرشیو عادت',
        variant: 'destructive',
      });
    }
  };

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMonth,
    onSwipedRight: handlePrevMonth,
    trackMouse: true,
  });

  if (loading && !habits.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SectionHeader
        title="عادت‌سازی"
        subtitle="پیگیری و مدیریت عادت‌های روزانه"
        icon={<CheckSquare className="h-6 w-6" />}
      />

      <div className="container mx-auto px-4 py-6" {...swipeHandlers}>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              {!isMobile && 'تقویم'}
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {!isMobile && 'آمار'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              {!isMobile && 'تنظیمات'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <HabitCalendarGrid
              habits={habits}
              completions={completions}
              currentMonth={currentMonth}
              onToggle={handleToggleCompletion}
              onAddHabit={() => {
                setSelectedHabit(null);
                setShowHabitManager(true);
              }}
              onEditHabit={handleEditHabit}
              onDeleteHabit={handleDeleteHabit}
              onArchiveHabit={handleArchiveHabit}
              onNextMonth={handleNextMonth}
              onPrevMonth={handlePrevMonth}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats && <HabitProgressDashboard stats={stats} />}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <HabitSettings />
          </TabsContent>
        </Tabs>
      </div>

      <HabitManager
        open={showHabitManager}
        onClose={() => {
          setShowHabitManager(false);
          setSelectedHabit(null);
        }}
        onSave={handleSaveHabit}
        habit={selectedHabit}
      />

      <DeleteHabitDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setHabitToDelete(null);
        }}
        onConfirm={confirmDeleteHabit}
        habit={habitToDelete}
      />
    </div>
  );
};

export default HabitTrackerPage;
