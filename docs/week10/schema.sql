-- ============================================================
-- SQLD AI Tutor — DB 스키마 (Week 10)
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1. users: Supabase Auth와 연동 (auth.users 참조)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nickname TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 신규 가입 시 자동으로 public.users에 행 삽입
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. student_progress: 카테고리별 정답률, streak 등 학습 현황
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    accuracy FLOAT DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category)
);

-- 3. question_attempts: 문제별 시도 이력
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT,
    student_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

-- 4. conversations: 세션(대화) 단위
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- 5. messages: 개별 메시지
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. events: 사용자 행동 로그 (14주차 분석용)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS (Row Level Security) 설정
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- users: 본인만 조회
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- student_progress: 본인만 조회/수정
CREATE POLICY "progress_select_own" ON public.student_progress
    FOR ALL USING (auth.uid() = user_id);

-- question_attempts: 본인만 조회/삽입
CREATE POLICY "attempts_own" ON public.question_attempts
    FOR ALL USING (auth.uid() = user_id);

-- conversations: 본인만
CREATE POLICY "conversations_own" ON public.conversations
    FOR ALL USING (auth.uid() = user_id);

-- messages: conversation 소유자만
CREATE POLICY "messages_own" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND c.user_id = auth.uid()
        )
    );

-- events: service role만 삽입 (백엔드에서만)
CREATE POLICY "events_service_insert" ON public.events
    FOR INSERT WITH CHECK (true);
CREATE POLICY "events_select_own" ON public.events
    FOR SELECT USING (auth.uid() = user_id);
