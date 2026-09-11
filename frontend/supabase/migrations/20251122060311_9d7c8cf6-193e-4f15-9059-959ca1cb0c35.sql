-- ====================================
-- Habit Tracker Database Schema (Fixed)
-- ====================================

-- Table: habits (عادت‌ها)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✅',
  description TEXT,
  category TEXT DEFAULT 'wellness',
  color TEXT DEFAULT '#10b981',
  target_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  CONSTRAINT habits_user_id_check CHECK (user_id IS NOT NULL),
  CONSTRAINT habits_target_days_check CHECK (target_days >= 0 AND target_days <= 7)
);

-- Indexes for habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(user_id, sort_order);

-- Table: habit_completions (ثبت انجام روزانه)
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_habit_completion_date UNIQUE(habit_id, completion_date)
);

-- Indexes for habit_completions
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON habit_completions(habit_id, completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON habit_completions(user_id, completion_date DESC);

-- Table: habit_streaks (محاسبه استریک‌ها)
CREATE TABLE IF NOT EXISTS habit_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_habit_user_streak UNIQUE(habit_id, user_id),
  CONSTRAINT habit_streaks_current_check CHECK (current_streak >= 0),
  CONSTRAINT habit_streaks_longest_check CHECK (longest_streak >= 0)
);

-- Indexes for habit_streaks
CREATE INDEX IF NOT EXISTS idx_streaks_habit ON habit_streaks(habit_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_current ON habit_streaks(user_id, current_streak DESC);

-- Table: habit_settings (تنظیمات کاربر)
CREATE TABLE IF NOT EXISTS habit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '22:00:00',
  theme TEXT DEFAULT 'dark',
  start_of_week INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_habit_settings UNIQUE(user_id),
  CONSTRAINT habit_settings_start_of_week_check CHECK (start_of_week >= 0 AND start_of_week <= 6)
);

-- Index for habit_settings
CREATE INDEX IF NOT EXISTS idx_habit_settings_user ON habit_settings(user_id);

-- ====================================
-- Functions
-- ====================================

-- Function: ایجاد عادت‌های پیش‌فرض
CREATE OR REPLACE FUNCTION create_default_habits(p_user_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM habits WHERE user_id = p_user_id) THEN
    INSERT INTO habits (user_id, title, emoji, category, sort_order) VALUES
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
    
    INSERT INTO habit_settings (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: بروزرسانی استریک
CREATE OR REPLACE FUNCTION update_habit_streak(p_habit_id UUID, p_user_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_completion_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM habit_streaks
  WHERE habit_id = p_habit_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO habit_streaks (habit_id, user_id, current_streak, longest_streak, last_completion_date)
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
  
  UPDATE habit_streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_completion_date = p_date,
      updated_at = NOW()
  WHERE habit_id = p_habit_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: بروزرسانی updated_at برای habits
CREATE OR REPLACE FUNCTION update_habits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_habits_updated_at ON habits;
CREATE TRIGGER trigger_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_habits_updated_at();

-- Trigger: بروزرسانی استریک هنگام ثبت completion
CREATE OR REPLACE FUNCTION trigger_update_streak_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true THEN
    PERFORM update_habit_streak(NEW.habit_id, NEW.user_id, NEW.completion_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_habit_completion_streak ON habit_completions;
CREATE TRIGGER trigger_habit_completion_streak
  AFTER INSERT OR UPDATE ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_streak_on_completion();

-- ====================================
-- RLS Policies
-- ====================================

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_settings ENABLE ROW LEVEL SECURITY;

-- Policies for habits
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own habits" ON habits;
CREATE POLICY "Users can create own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON habits;
CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for habit_completions
DROP POLICY IF EXISTS "Users can view own completions" ON habit_completions;
CREATE POLICY "Users can view own completions" ON habit_completions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own completions" ON habit_completions;
CREATE POLICY "Users can create own completions" ON habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own completions" ON habit_completions;
CREATE POLICY "Users can update own completions" ON habit_completions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own completions" ON habit_completions;
CREATE POLICY "Users can delete own completions" ON habit_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for habit_streaks
DROP POLICY IF EXISTS "Users can view own streaks" ON habit_streaks;
CREATE POLICY "Users can view own streaks" ON habit_streaks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON habit_streaks;
CREATE POLICY "Users can update own streaks" ON habit_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Policies for habit_settings
DROP POLICY IF EXISTS "Users can view own settings" ON habit_settings;
CREATE POLICY "Users can view own settings" ON habit_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own settings" ON habit_settings;
CREATE POLICY "Users can manage own settings" ON habit_settings
  FOR ALL USING (auth.uid() = user_id);