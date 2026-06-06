-- Ensure full row data is broadcast on realtime changes (needed for filtered subscriptions)
ALTER TABLE public.room_answers REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.questions REPLICA IDENTITY FULL;

-- Add room_answers to the realtime publication (teacher distribution + scores depend on this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_answers;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
  END IF;
END $$;