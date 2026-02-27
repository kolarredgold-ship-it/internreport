
-- Question bank table
CREATE TABLE public.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  subcategory text NOT NULL DEFAULT '',
  question text NOT NULL,
  answer text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON public.question_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage questions" ON public.question_bank FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Mock interview results
CREATE TABLE public.mock_interview_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_or_topic text NOT NULL,
  question text NOT NULL,
  user_answer text NOT NULL,
  ai_score integer NOT NULL DEFAULT 0,
  ai_feedback text,
  ai_suggestions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_interview_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.mock_interview_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.mock_interview_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all results" ON public.mock_interview_results FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- User progress tracking
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  category text NOT NULL,
  subcategory text NOT NULL DEFAULT '',
  questions_attempted integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  last_accessed timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON public.user_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.user_progress FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- AI usage log
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT 'deepseek-chat',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_usage_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.ai_usage_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all usage" ON public.ai_usage_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
