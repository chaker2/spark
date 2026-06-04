-- 1) Hide is_admin column from public/anon/authenticated direct reads.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar, total_xp, created_at, updated_at) ON public.profiles TO anon, authenticated;

-- 2) Hide expected_answer (open-ended answer key) from direct reads.
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (id, text, position, quiz_id, image_url, type, created_at, points, time_limit) ON public.questions TO anon, authenticated;

-- Owner/admin RPC to load full question data (incl. expected_answer + choices) for editing.
CREATE OR REPLACE FUNCTION public.get_quiz_editor_questions(_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.quizzes z
    WHERE z.id = _quiz_id AND (z.owner_id = auth.uid() OR public.is_admin(auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(q ORDER BY q.position), '[]'::jsonb) INTO v_result
  FROM (
    SELECT
      qu.id, qu.text, qu.type, qu.image_url, qu.expected_answer,
      qu.time_limit, qu.points, qu.position,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', c.id, 'text', c.text, 'is_correct', c.is_correct, 'position', c.position) ORDER BY c.position)
        FROM public.choices c WHERE c.question_id = qu.id
      ), '[]'::jsonb) AS choices
    FROM public.questions qu
    WHERE qu.quiz_id = _quiz_id
  ) q;

  RETURN v_result;
END $$;

GRANT EXECUTE ON FUNCTION public.get_quiz_editor_questions(uuid) TO authenticated;

-- 3) Prevent duplicate / flooding player rows per client per room.
CREATE UNIQUE INDEX IF NOT EXISTS room_players_room_client_uniq
  ON public.room_players (room_id, client_id);