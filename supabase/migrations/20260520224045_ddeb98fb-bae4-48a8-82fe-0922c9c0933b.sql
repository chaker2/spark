
DROP POLICY IF EXISTS "room_answers_insert_open" ON public.room_answers;
CREATE POLICY "room_answers_insert_open" ON public.room_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_answers.room_id AND r.status IN ('waiting','active'))
);
