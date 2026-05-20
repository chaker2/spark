
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar TEXT,
  total_xp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- QUIZZES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select_public_or_owner" ON public.quizzes FOR SELECT USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "quizzes_insert_owner" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "quizzes_update_owner" ON public.quizzes FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "quizzes_delete_owner" ON public.quizzes FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- QUESTIONS
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  time_limit INT NOT NULL DEFAULT 20,
  points INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_all" ON public.questions FOR SELECT USING (true);
CREATE POLICY "questions_modify_owner" ON public.questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = questions.quiz_id AND q.owner_id = auth.uid()));

-- CHOICES
CREATE TABLE public.choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "choices_select_all" ON public.choices FOR SELECT USING (true);
CREATE POLICY "choices_modify_owner" ON public.choices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes z ON z.id = q.quiz_id WHERE q.id = choices.question_id AND z.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.questions q JOIN public.quizzes z ON z.id = q.quiz_id WHERE q.id = choices.question_id AND z.owner_id = auth.uid()));

-- ROOMS: add quiz_id and current question tracking
ALTER TABLE public.rooms
  ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  ADD COLUMN current_question_id UUID,
  ADD COLUMN question_started_at TIMESTAMPTZ;

-- ROOM ANSWERS
CREATE TABLE public.room_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  username TEXT NOT NULL,
  choice_id UUID REFERENCES public.choices(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  score_awarded INT NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, question_id, client_id)
);
ALTER TABLE public.room_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_answers_select_all" ON public.room_answers FOR SELECT USING (true);
CREATE POLICY "room_answers_insert_open" ON public.room_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_answers.room_id AND r.status IN ('waiting','playing'))
);

-- Prevent duplicate usernames in same room
ALTER TABLE public.room_players ADD CONSTRAINT room_players_unique_username UNIQUE (room_id, username);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_answers;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.room_answers REPLICA IDENTITY FULL;

-- updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
