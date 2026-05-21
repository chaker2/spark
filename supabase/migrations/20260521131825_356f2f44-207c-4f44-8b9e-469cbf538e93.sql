ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS lesson text,
  ADD COLUMN IF NOT EXISTS level text;

ALTER TABLE public.quizzes REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;