
DROP POLICY IF EXISTS choices_select_all ON public.choices;

CREATE OR REPLACE FUNCTION public.get_question_choices(_question_id uuid)
RETURNS TABLE ("id" uuid, "text" text, "pos" int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.text, c.position
  FROM public.choices c
  WHERE c.question_id = _question_id
  ORDER BY c.position;
$$;
GRANT EXECUTE ON FUNCTION public.get_question_choices(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS room_answers_insert_open ON public.room_answers;
DROP POLICY IF EXISTS room_answers_select_all ON public.room_answers;

CREATE POLICY room_answers_select_host ON public.room_answers
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_answers.room_id AND r.host_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE OR REPLACE FUNCTION public.submit_answer(
  _room_id uuid,
  _question_id uuid,
  _client_id text,
  _username text,
  _choice_id uuid,
  _puzzle_order uuid[]
) RETURNS TABLE (is_correct boolean, score_awarded int, correct_choice_id uuid, correct_order uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_question questions%ROWTYPE;
  v_elapsed_ms numeric;
  v_ratio numeric;
  v_correct boolean := false;
  v_awarded int := 0;
  v_correct_choice uuid;
  v_correct_order uuid[];
  v_submitted_order uuid[];
BEGIN
  IF _username IS NULL OR length(trim(_username)) = 0 OR length(_username) > 40 THEN
    RAISE EXCEPTION 'Invalid username';
  END IF;
  IF _client_id IS NULL OR length(_client_id) > 100 THEN
    RAISE EXCEPTION 'Invalid client_id';
  END IF;

  SELECT * INTO v_room FROM rooms WHERE id = _room_id;
  IF NOT FOUND OR v_room.status NOT IN ('waiting','active') THEN
    RAISE EXCEPTION 'Room not open';
  END IF;
  IF v_room.current_question_id IS DISTINCT FROM _question_id THEN
    RAISE EXCEPTION 'Question not active';
  END IF;

  SELECT * INTO v_question FROM questions WHERE id = _question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;

  IF EXISTS (SELECT 1 FROM room_answers
             WHERE room_id = _room_id AND question_id = _question_id AND client_id = _client_id) THEN
    RAISE EXCEPTION 'Already answered';
  END IF;

  v_elapsed_ms := EXTRACT(EPOCH FROM (now() - COALESCE(v_room.question_started_at, now()))) * 1000;

  SELECT c.id INTO v_correct_choice FROM choices c WHERE c.question_id = _question_id AND c.is_correct LIMIT 1;
  SELECT array_agg(c.id ORDER BY c.position) INTO v_correct_order FROM choices c WHERE c.question_id = _question_id;

  IF v_elapsed_ms > (v_question.time_limit * 1000 + 1500) THEN
    INSERT INTO room_answers (room_id, question_id, client_id, username, choice_id, is_correct, score_awarded)
    VALUES (_room_id, _question_id, _client_id, _username, NULL, false, 0);
    RETURN QUERY SELECT false, 0, v_correct_choice, v_correct_order;
    RETURN;
  END IF;

  v_ratio := GREATEST(0, 1 - v_elapsed_ms / (v_question.time_limit * 1000));

  IF v_question.type = 'puzzle' THEN
    v_submitted_order := COALESCE(_puzzle_order, ARRAY[]::uuid[]);
    v_correct := (v_submitted_order = v_correct_order);
  ELSE
    IF _choice_id IS NOT NULL THEN
      SELECT c.is_correct INTO v_correct FROM choices c
       WHERE c.id = _choice_id AND c.question_id = _question_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invalid choice'; END IF;
    END IF;
  END IF;

  IF v_correct THEN
    v_awarded := round(v_question.points * (0.5 + 0.5 * v_ratio));
  END IF;

  INSERT INTO room_answers (room_id, question_id, client_id, username, choice_id, is_correct, score_awarded)
  VALUES (_room_id, _question_id, _client_id, _username, _choice_id, v_correct, v_awarded);

  RETURN QUERY SELECT v_correct, v_awarded, v_correct_choice, v_correct_order;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text, text, uuid, uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_room_scoreboard(_room_id uuid)
RETURNS TABLE (username text, total int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ra.username, COALESCE(SUM(ra.score_awarded), 0)::int AS total
  FROM public.room_answers ra
  WHERE ra.room_id = _room_id
  GROUP BY ra.username
  ORDER BY total DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_room_scoreboard(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_global_leaderboard(_since timestamptz)
RETURNS TABLE (username text, total int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ra.username, COALESCE(SUM(ra.score_awarded), 0)::int AS total
  FROM public.room_answers ra
  WHERE ra.answered_at >= _since
  GROUP BY ra.username
  ORDER BY total DESC
  LIMIT 50;
$$;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard(timestamptz) TO anon, authenticated;

DROP POLICY IF EXISTS room_players_delete_owner_or_host ON public.room_players;
