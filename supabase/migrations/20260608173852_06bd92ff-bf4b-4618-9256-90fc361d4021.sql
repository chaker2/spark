CREATE OR REPLACE FUNCTION public.start_room_question(
  _room_id uuid,
  _question_id uuid,
  _intro_seconds int DEFAULT 5
)
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = _room_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.host_id <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.rooms
  SET status = 'active',
      started_at = COALESCE(started_at, now()),
      current_question_id = _question_id,
      question_started_at = NULL,
      reveal_answer = false,
      question_phase = 'intro',
      phase_started_at = now(),
      phase_ends_at = now() + make_interval(secs => GREATEST(_intro_seconds, 1))
  WHERE id = _room_id
  RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;
GRANT EXECUTE ON FUNCTION public.start_room_question(uuid, uuid, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.advance_room_phase(
  _room_id uuid,
  _next_phase text,
  _duration_seconds int DEFAULT NULL
)
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
BEGIN
  IF _next_phase NOT IN ('idle', 'intro', 'answering', 'waiting', 'result', 'ended') THEN
    RAISE EXCEPTION 'Invalid phase';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = _room_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.host_id <> auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.rooms
  SET question_phase = _next_phase,
      phase_started_at = now(),
      question_started_at = CASE WHEN _next_phase = 'answering' THEN now() ELSE question_started_at END,
      phase_ends_at = CASE
        WHEN _duration_seconds IS NULL OR _duration_seconds <= 0 THEN NULL
        ELSE now() + make_interval(secs => _duration_seconds)
      END,
      reveal_answer = CASE WHEN _next_phase = 'result' THEN true ELSE reveal_answer END,
      status = CASE WHEN _next_phase = 'ended' THEN 'ended' ELSE status END,
      ended_at = CASE WHEN _next_phase = 'ended' THEN now() ELSE ended_at END
  WHERE id = _room_id
  RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;
GRANT EXECUTE ON FUNCTION public.advance_room_phase(uuid, text, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_answer(
  _room_id uuid,
  _question_id uuid,
  _client_id text,
  _username text,
  _choice_id uuid,
  _puzzle_order uuid[],
  _text_answer text DEFAULT NULL::text
)
RETURNS TABLE(is_correct boolean, score_awarded integer, correct_choice_id uuid, correct_order uuid[], correct_text text, similarity numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_question questions%ROWTYPE;
  v_answer_started_at timestamptz;
  v_elapsed_ms numeric;
  v_ratio numeric;
  v_correct boolean := false;
  v_awarded int := 0;
  v_correct_choice uuid;
  v_correct_order uuid[];
  v_submitted_order uuid[];
  v_sim numeric := 0;
  v_mult numeric := 0;
BEGIN
  IF _username IS NULL OR length(trim(_username)) = 0 OR length(_username) > 40 THEN RAISE EXCEPTION 'Invalid username'; END IF;
  IF _client_id IS NULL OR length(_client_id) > 100 THEN RAISE EXCEPTION 'Invalid client_id'; END IF;

  SELECT * INTO v_room FROM rooms WHERE id = _room_id;
  IF NOT FOUND OR v_room.status <> 'active' THEN RAISE EXCEPTION 'Room not open'; END IF;
  IF v_room.current_question_id IS DISTINCT FROM _question_id THEN RAISE EXCEPTION 'Question not active'; END IF;
  IF COALESCE(v_room.question_phase, 'idle') <> 'answering' THEN RAISE EXCEPTION 'Question is not accepting answers'; END IF;

  SELECT * INTO v_question FROM questions WHERE id = _question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;

  IF EXISTS (SELECT 1 FROM room_answers WHERE room_id=_room_id AND question_id=_question_id AND client_id=_client_id) THEN
    RAISE EXCEPTION 'Already answered';
  END IF;

  v_answer_started_at := COALESCE(v_room.question_started_at, v_room.phase_started_at, now());
  v_elapsed_ms := EXTRACT(EPOCH FROM (now() - v_answer_started_at)) * 1000;

  SELECT c.id INTO v_correct_choice FROM choices c WHERE c.question_id=_question_id AND c.is_correct LIMIT 1;
  SELECT array_agg(c.id ORDER BY c.position) INTO v_correct_order FROM choices c WHERE c.question_id=_question_id;

  IF (v_room.phase_ends_at IS NOT NULL AND now() > v_room.phase_ends_at + interval '1.5 seconds')
     OR (v_room.phase_ends_at IS NULL AND v_elapsed_ms > (v_question.time_limit * 1000 + 1500)) THEN
    INSERT INTO room_answers(room_id, question_id, client_id, username, choice_id, is_correct, score_awarded)
    VALUES(_room_id, _question_id, _client_id, _username, NULL, false, 0);
    RETURN QUERY SELECT false, 0, v_correct_choice, v_correct_order, v_question.expected_answer, 0::numeric;
    RETURN;
  END IF;

  v_ratio := GREATEST(0, 1 - v_elapsed_ms / (v_question.time_limit * 1000));

  IF v_question.type = 'puzzle' THEN
    v_submitted_order := COALESCE(_puzzle_order, ARRAY[]::uuid[]);
    v_correct := (v_submitted_order = v_correct_order);
    IF v_correct THEN v_mult := 1; END IF;
  ELSIF v_question.type = 'written' THEN
    v_sim := public.text_similarity(_text_answer, v_question.expected_answer);
    IF v_sim >= 0.95 THEN v_mult := 1; v_correct := true;
    ELSIF v_sim >= 0.80 THEN v_mult := 0.7; v_correct := true;
    ELSIF v_sim >= 0.60 THEN v_mult := 0.4; v_correct := false;
    ELSE v_mult := 0; v_correct := false;
    END IF;
  ELSE
    IF _choice_id IS NOT NULL THEN
      SELECT c.is_correct INTO v_correct FROM choices c WHERE c.id=_choice_id AND c.question_id=_question_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invalid choice'; END IF;
    END IF;
    IF v_correct THEN v_mult := 1; END IF;
  END IF;

  IF v_mult > 0 THEN
    v_awarded := round(v_question.points * v_mult * (0.5 + 0.5 * v_ratio));
  END IF;

  INSERT INTO room_answers(room_id, question_id, client_id, username, choice_id, is_correct, score_awarded)
  VALUES(_room_id, _question_id, _client_id, _username, _choice_id, v_correct, v_awarded);

  RETURN QUERY SELECT v_correct, v_awarded, v_correct_choice, v_correct_order, v_question.expected_answer, v_sim;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text, text, uuid, uuid[], text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_answer(
  _room_id uuid,
  _question_id uuid,
  _client_id text,
  _username text,
  _choice_id uuid,
  _puzzle_order uuid[]
)
RETURNS TABLE(is_correct boolean, score_awarded integer, correct_choice_id uuid, correct_order uuid[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.is_correct, s.score_awarded, s.correct_choice_id, s.correct_order
  FROM public.submit_answer(_room_id, _question_id, _client_id, _username, _choice_id, _puzzle_order, NULL::text) s;
$$;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text, text, uuid, uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_question_result_details(_room_id uuid, _question_id uuid)
RETURNS TABLE(correct_choice_id uuid, correct_order uuid[], correct_text text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = _room_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_room.current_question_id IS DISTINCT FROM _question_id THEN
    RAISE EXCEPTION 'Question not active';
  END IF;
  IF COALESCE(v_room.question_phase, 'idle') <> 'result' AND COALESCE(v_room.reveal_answer, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Answer not revealed';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT c.id FROM public.choices c WHERE c.question_id = _question_id AND c.is_correct ORDER BY c.position LIMIT 1),
    (SELECT array_agg(c.id ORDER BY c.position) FROM public.choices c WHERE c.question_id = _question_id),
    (SELECT q.expected_answer FROM public.questions q WHERE q.id = _question_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_question_result_details(uuid, uuid) TO anon, authenticated;