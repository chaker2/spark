CREATE OR REPLACE FUNCTION public.get_room_category(_room_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.category
  FROM public.rooms r
  JOIN public.quizzes q ON q.id = r.quiz_id
  WHERE r.id = _room_id
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_room_category(uuid) TO anon, authenticated;