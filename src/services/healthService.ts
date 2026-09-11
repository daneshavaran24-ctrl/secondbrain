import { supabase } from '@/integrations/supabase/client';

export interface HealthMetrics {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  heart_rate?: number;
  sleep_hours?: number;
  exercise_minutes?: number;
  water_intake?: number;
  blood_pressure?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Health activities table doesn't exist in database - commenting out
// export interface HealthActivity {
//   id: string;
//   user_id: string;
//   date: string;
//   time: string;
//   activity: string;
//   energy_level: 'بالا' | 'متوسط' | 'پایین';
//   focus_percentage: number;
//   created_at: string;
//   updated_at: string;
// }

export interface WeeklyTrend {
  averageEnergy: number;
  bestDay: { day: string; energy: number };
  optimalHours: string;
  energyGrowth: number;
}

export interface HealthRecommendation {
  type: 'energy' | 'focus' | 'rest';
  icon: string;
  title: string;
  message: string;
  color: string;
}

class HealthService {
  
  // Get today's health metrics
  async getTodaysMetrics(): Promise<HealthMetrics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching today\'s metrics:', error);
      return null;
    }
  }

  // Get today's activities (table doesn't exist - commented out)
  async getTodaysActivities(): Promise<any[]> {
    return [];
  }

  // Calculate weekly trends
  async getWeeklyTrends(): Promise<WeeklyTrend | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return null;
      }

      // Calculate average sleep hours
      const avgSleepHours = data.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / data.length;

      // Find best day (most sleep)
      const bestDay = data.reduce((best, current) => 
        (current.sleep_hours || 0) > (best.sleep_hours || 0) ? current : best
      );

      // Calculate growth (compare first vs last half)
      const firstHalf = data.slice(0, Math.ceil(data.length / 2));
      const secondHalf = data.slice(Math.ceil(data.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / secondHalf.length;
      const energyGrowth = Math.round(((secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)) * 100);

      // Get Persian day name
      const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
      const bestDayName = dayNames[new Date(bestDay.date).getDay()];

      return {
        averageEnergy: Math.round(avgSleepHours),
        bestDay: { day: bestDayName, energy: bestDay.sleep_hours || 0 },
        optimalHours: '9:00 - 11:00',
        energyGrowth
      };
    } catch (error) {
      console.error('Error calculating weekly trends:', error);
      return null;
    }
  }

  // Generate smart recommendations based on user data
  async getSmartRecommendations(metrics?: HealthMetrics): Promise<HealthRecommendation[]> {
    const recommendations: HealthRecommendation[] = [];

    if (!metrics) {
      // Default recommendations for new users
      return [
        {
          type: 'energy',
          icon: '💚',
          title: 'شروع ثبت انرژی',
          message: 'سطح انرژی خود را در طول روز ثبت کنید',
          color: 'green'
        },
        {
          type: 'focus',
          icon: '🧘',
          title: 'تمرکز روزانه',
          message: 'زمان‌های تمرکز بالای خود را شناسایی کنید',
          color: 'blue'
        },
        {
          type: 'rest',
          icon: '😴',
          title: 'خواب منظم',
          message: 'برنامه خواب منظم برای بهبود عملکرد',
          color: 'purple'
        }
      ];
    }

    // Smart recommendations based on actual data
    if (metrics.sleep_hours && metrics.sleep_hours >= 7) {
      recommendations.push({
        type: 'rest',
        icon: '💚',
        title: 'خواب کافی',
        message: `با ${metrics.sleep_hours} ساعت خواب، عملکرد بهتری خواهید داشت`,
        color: 'green'
      });
    } else if (metrics.sleep_hours && metrics.sleep_hours < 6) {
      recommendations.push({
        type: 'rest',
        icon: '😴',
        title: 'بهبود خواب',
        message: 'خواب کافی برای سلامتی ضروری است - حداقل ۷-۸ ساعت',
        color: 'orange'
      });
    }

    if (metrics.exercise_minutes && metrics.exercise_minutes < 30) {
      recommendations.push({
        type: 'energy',
        icon: '🏃',
        title: 'فعالیت بدنی',
        message: 'حداقل ۳۰ دقیقه فعالیت بدنی در روز توصیه می‌شود',
        color: 'blue'
      });
    }

    if (metrics.water_intake && metrics.water_intake < 8) {
      recommendations.push({
        type: 'energy',
        icon: '💧',
        title: 'نوشیدن آب',
        message: 'حداقل ۸ لیوان آب در روز بنوشید',
        color: 'blue'
      });
    }

    return recommendations;
  }

  // Save or update today's metrics
  async saveTodaysMetrics(metrics: Omit<HealthMetrics, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('health_metrics')
        .upsert({
          user_id: user.user.id,
          date: metrics.date,
          weight: metrics.weight,
          heart_rate: metrics.heart_rate,
          sleep_hours: metrics.sleep_hours,
          exercise_minutes: metrics.exercise_minutes,
          water_intake: metrics.water_intake,
          blood_pressure: metrics.blood_pressure,
          notes: metrics.notes
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving metrics:', error);
      return false;
    }
  }

  // Add new activity (table doesn't exist - commented out)
  async addActivity(activity: any): Promise<boolean> {
    return false;
  }

  // Cleanup all health data (for testing/reset purposes)
  async cleanupAllData(): Promise<void> {
    try {
      const { error: metricsError } = await supabase
        .from('health_metrics')
        .delete()
        .neq('id', '');

      if (metricsError) console.error('Error cleaning health metrics:', metricsError);
    } catch (error) {
      console.error('Error in health cleanup:', error);
    }
  }
}

export const healthService = new HealthService();