
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  google_id text,
  email text,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  stage int NOT NULL,
  page text NOT NULL,
  field_key text NOT NULL,
  field_value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, stage, page, field_key)
);

CREATE TABLE public.stage_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  stage_unlocked int NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, stage_unlocked)
);

CREATE TABLE public.scenario_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  stage int NOT NULL,
  scenario_id int NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, stage)
);

CREATE TABLE public.stage3_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  scenario_id int NOT NULL,
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  result text NOT NULL,
  guide_pin_confirmed boolean NOT NULL DEFAULT false,
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage3_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own student row select" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own student row insert" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own student row update" ON public.students FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own progress all" ON public.progress FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "own unlocks all" ON public.stage_unlocks FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "own assignments all" ON public.scenario_assignments FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "own attempts all" ON public.stage3_attempts FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
