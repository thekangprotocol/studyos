-- ========================================================
-- StudyOS AI Academic Chief of Staff Schema (Supabase / PostgreSQL)
-- Tables: users, courses, tasks, exams, student_memories, conversation_messages, daily_plans
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. USERS TABLE
-- Stores student profile & onboarding responses.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    grade_level TEXT,                 -- e.g. "Senior / 12th", "College Sophomore"
    school_name TEXT,                 -- e.g. "Lincoln High", "Stanford University"
    target_grades TEXT,               -- e.g. "Straight A's, 3.8+ GPA"
    procrastination_triggers TEXT,    -- e.g. "Overwhelm, starting large papers, phone distractions"
    daily_available_hours NUMERIC(3, 1) DEFAULT 3.0,
    preferred_study_times TEXT,       -- e.g. "Mornings, 6 PM - 9 PM"
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 2. COURSES TABLE
-- Stores classes/subjects student is taking.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT,                        -- e.g. "CS 101"
    difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
    target_grade TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 3. TASKS TABLE
-- Stores assignments, homework, essays, and study tasks.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    estimated_minutes INTEGER DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 4. EXAMS TABLE
-- Stores upcoming exams, quizzes, and midterms.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    weight TEXT,                      -- e.g. "Midterm (25% of grade)"
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 5. STUDENT_MEMORIES TABLE
-- Stores AI-extracted long-term memory & academic context.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL,        -- 'challenge', 'preference', 'goal', 'habit', 'subject_note'
    content TEXT NOT NULL,
    relevance_score INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 6. CONVERSATION_MESSAGES TABLE
-- Stores ongoing advisor chat history for continuous context.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,                   -- Extracted entities, actions taken, intent
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 7. DAILY_PLANS TABLE
-- Stores daily study missions, top priorities, & schedule.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    target_study_hours NUMERIC(3, 1) DEFAULT 4.0,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
    notes TEXT,                       -- JSON payload containing mission, priorities, timeline, reasoning
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_daily_plan UNIQUE (user_id, plan_date)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_student_memories_user_id ON public.student_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON public.conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON public.daily_plans(user_id, plan_date);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage their courses" ON public.courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their exams" ON public.exams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their memories" ON public.student_memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their messages" ON public.conversation_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their daily plans" ON public.daily_plans FOR ALL USING (auth.uid() = user_id);

-- Automatic user sync trigger from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
