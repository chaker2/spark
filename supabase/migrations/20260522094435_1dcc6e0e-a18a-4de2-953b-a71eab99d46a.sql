
-- questions: add type + image_url
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'multiple_choice'
    CHECK (type IN ('multiple_choice','true_false','puzzle','image')),
  ADD COLUMN IF NOT EXISTS image_url text;

-- profiles: admin flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- room_players: avatar
ALTER TABLE public.room_players
  ADD COLUMN IF NOT EXISTS avatar text;

-- Seed super-admin if the auth user already exists
UPDATE public.profiles p SET is_admin = true
WHERE p.id IN (SELECT id FROM auth.users WHERE lower(email) = 'chakerennabbach@gmail.com');

-- Ensure profile row for super-admin gets is_admin true even if created later
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (lower(NEW.email) = 'chakerennabbach@gmail.com')
  )
  ON CONFLICT (id) DO UPDATE SET
    is_admin = EXCLUDED.is_admin OR public.profiles.is_admin;
  RETURN NEW;
END $$;

-- Helper: is current user admin? (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = _uid), false);
$$;

-- Admin override policies on quizzes / questions / choices / rooms
DROP POLICY IF EXISTS quizzes_admin_all ON public.quizzes;
CREATE POLICY quizzes_admin_all ON public.quizzes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS questions_admin_all ON public.questions;
CREATE POLICY questions_admin_all ON public.questions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS choices_admin_all ON public.choices;
CREATE POLICY choices_admin_all ON public.choices
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS rooms_admin_all ON public.rooms;
CREATE POLICY rooms_admin_all ON public.rooms
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Teacher can clear players from their own waiting room (delete any player in their room)
DROP POLICY IF EXISTS room_players_delete_host ON public.room_players;
CREATE POLICY room_players_delete_host ON public.room_players
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.host_id = auth.uid()));

-- Realtime for room_players (already enabled per project; safe to re-add)
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='room_players';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players';
  END IF;
END $$;

-- Storage bucket for image questions
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "quiz-images public read" ON storage.objects;
CREATE POLICY "quiz-images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');

DROP POLICY IF EXISTS "quiz-images auth upload" ON storage.objects;
CREATE POLICY "quiz-images auth upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quiz-images');

DROP POLICY IF EXISTS "quiz-images owner delete" ON storage.objects;
CREATE POLICY "quiz-images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'quiz-images' AND owner = auth.uid());
