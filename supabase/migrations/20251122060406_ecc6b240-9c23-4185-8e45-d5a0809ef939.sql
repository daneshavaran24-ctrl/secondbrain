-- Fix security warnings for Habit Tracker functions

-- Function: ایجاد عادت‌های پیش‌فرض (با search_path)
CREATE OR REPLACE FUNCTION create_default_habits(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.habits WHERE user_id = p_user_id) THEN
    INSERT INTO public.habits (user_id, title, emoji, category, sort_order) VALUES
      (p_user_id, 'بیدار شدن صبح زود', '⏰', 'wellness', 1),
      (p_user_id, 'ورزش و تناسب اندام', '🏋️', 'health', 2),
      (p_user_id, 'مطالعه و یادگیری', '📚', 'productivity', 3),
      (p_user_id, 'برنامه‌ریزی روز', '📅', 'productivity', 4),
      (p_user_id, 'پیگیری بودجه', '💰', 'productivity', 5),
      (p_user_id, 'کار روی پروژه‌ها', '⚙️', 'productivity', 6),
      (p_user_id, 'پرهیز از الکل', '🍺', 'wellness', 7),
      (p_user_id, 'دتاکس شبکه‌های اجتماعی', '🌱', 'social', 8),
      (p_user_id, 'نوشتن اهداف', '📔', 'productivity', 9),
      (p_user_id, 'دوش آب سرد', '❄️', 'health', 10);
    
    INSERT INTO public.habit_settings (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

-- Function: بروزرسانی استریک (با search_path)
CREATE OR REPLACE FUNCTION update_habit_streak(p_habit_id UUID, p_user_id UUID, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_completion_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.habit_streaks
  WHERE habit_id = p_habit_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.habit_streaks (habit_id, user_id, current_streak, longest_streak, last_completion_date)
    VALUES (p_habit_id, p_user_id, 1, 1, p_date);
    RETURN;
  END IF;
  
  IF v_last_date IS NULL OR p_date = v_last_date + INTERVAL '1 day' THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
  ELSIF p_date <= v_last_date THEN
    v_current_streak := COALESCE(v_current_streak, 1);
  ELSE
    v_current_streak := 1;
  END IF;
  
  UPDATE public.habit_streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_completion_date = p_date,
      updated_at = NOW()
  WHERE habit_id = p_habit_id AND user_id = p_user_id;
END;
$$;

-- Trigger function: بروزرسانی updated_at (با search_path)
CREATE OR REPLACE FUNCTION update_habits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger function: بروزرسانی استریک (با search_path)
CREATE OR REPLACE FUNCTION trigger_update_streak_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.completed = true THEN
    PERFORM update_habit_streak(NEW.habit_id, NEW.user_id, NEW.completion_date);
  END IF;
  RETURN NEW;
END;
$$;