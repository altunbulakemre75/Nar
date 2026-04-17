-- ========================================
-- Nar - Başarı rozetleri tablosu
-- ========================================
-- SQL Editor'de Run bas

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON public.user_achievements(user_id, unlocked_at DESC);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own achievements" ON public.user_achievements;
CREATE POLICY "Users read own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;
CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
