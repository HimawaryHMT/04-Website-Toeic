-- ============================================================
-- FORUMFLASH STUDY - SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT DEFAULT 'Người học',
  birth_date DATE,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'disabled', 'pending')),
  registration_completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create LEARNING_PROGRESS Table (Stores Tree XP, Streak, Completed Lessons & User Settings)
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INT DEFAULT 1,
  client_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create ATTEMPT_HISTORY Table (Stores detailed test submissions)
CREATE TABLE IF NOT EXISTS public.attempt_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  track_id TEXT NOT NULL, -- 'grammar', 'topics', 'cefr'
  level TEXT NOT NULL,    -- 'easy', 'medium', 'hard'
  correct_count INT NOT NULL,
  total_questions INT NOT NULL,
  score_percent NUMERIC(5,2) NOT NULL,
  rating INT DEFAULT 0 CHECK (rating BETWEEN 0 AND 3),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create USER_NOTEBOOK Table (Word bookmarks for review)
CREATE TABLE IF NOT EXISTS public.user_notebook (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  deck_id TEXT,
  meaning_vi TEXT,
  pos TEXT,
  memory_level INT DEFAULT 0, -- 0: Cần ôn, 1: Đang nhớ, 2: Đã thuộc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notebook ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Learning Progress Policies
CREATE POLICY "Users can manage own learning progress"
  ON public.learning_progress FOR ALL
  USING (auth.uid() = user_id);

-- Attempt History Policies
CREATE POLICY "Users can manage own attempt history"
  ON public.attempt_history FOR ALL
  USING (auth.uid() = user_id);

-- User Notebook Policies
CREATE POLICY "Users can manage own notebook"
  ON public.user_notebook FOR ALL
  USING (auth.uid() = user_id);

-- 7. Trigger to automatically create a profile record when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  INSERT INTO public.learning_progress (user_id, state)
  VALUES (
    new.id,
    '{"totalXp": 0, "streak": 0, "treeStage": 1, "completedLessons": {}, "dailyDate": "", "dailyXp": 0}'::jsonb
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. RPC Functions for complete registration
CREATE OR REPLACE FUNCTION public.complete_registration(
  learner_display_name TEXT,
  learner_birth_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    display_name = learner_display_name,
    birth_date = learner_birth_date,
    registration_completed = TRUE,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
