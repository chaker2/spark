ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS question_phase text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS phase_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS phase_ends_at timestamptz;

CREATE OR REPLACE FUNCTION public.start_room_question(
  _room_id uuid,
  _question_id uuid,
  _intro_seconds int DEFAULT 3
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
      question_started_at = now(),
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

CREATE OR REPLACE FUNCTION public.get_room_answer_progress(_room_id uuid, _question_id uuid)
RETURNS TABLE(answered_count int, player_count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT count(*)::int
      FROM public.room_answers ra
      WHERE ra.room_id = _room_id
        AND ra.question_id = _question_id
    ), 0) AS answered_count,
    COALESCE((
      SELECT count(*)::int
      FROM public.room_players rp
      WHERE rp.room_id = _room_id
    ), 0) AS player_count;
$$;
GRANT EXECUTE ON FUNCTION public.get_room_answer_progress(uuid, uuid) TO anon, authenticated;