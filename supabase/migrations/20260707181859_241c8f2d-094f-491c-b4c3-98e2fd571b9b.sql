
-- 1) submit_answer: verify username belongs to the submitting client
CREATE OR REPLACE FUNCTION public.submit_answer(_room_id uuid, _question_id uuid, _client_id text, _username text, _choice_id uuid, _puzzle_order uuid[], _text_answer text DEFAULT NULL::text)
 RETURNS TABLE(is_correct boolean, score_awarded integer, correct_choice_id uuid, correct_order uuid[], correct_text text, similarity numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Ensure the (room_id, client_id) actually registered under this username
  IF NOT EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_id = _room_id AND client_id = _client_id AND username = _username
  ) THEN
    RAISE EXCEPTION 'Player identity mismatch';
  END IF;

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
$function$;

-- 2) Fix mutable search_path on helper functions
CREATE OR REPLACE FUNCTION public.text_normalize(_s text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT trim(regexp_replace(
    regexp_replace(
      lower(translate(
        coalesce(_s, ''),
        'àáâãäåèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇŸÿ',
        'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNCYy'
      )),
      '[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]', '', 'g'
    ),
    '[[:punct:]\s]+', ' ', 'g'
  ));
$function$;

CREATE OR REPLACE FUNCTION public.text_similarity(_a text, _b text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  a text := public.text_normalize(_a);
  b text := public.text_normalize(_b);
  d int; m int;
BEGIN
  IF a = '' AND b = '' THEN RETURN 1; END IF;
  IF a = '' OR b = '' THEN RETURN 0; END IF;
  IF a = b THEN RETURN 1; END IF;
  m := GREATEST(length(a), length(b));
  d := public.levenshtein_less_equal(left(a, 255), left(b, 255), 100);
  RETURN GREATEST(0, 1 - d::numeric / m);
END $function$;

-- 3) Restrict rooms SELECT
DROP POLICY IF EXISTS rooms_select_all ON public.rooms;
CREATE POLICY rooms_select_live ON public.rooms
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('waiting','active')
    OR created_at > now() - interval '12 hours'
  );
CREATE POLICY rooms_select_host ON public.rooms
  FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR public.is_admin(auth.uid()));

-- 4) Restrict room_players SELECT
DROP POLICY IF EXISTS room_players_select_all ON public.room_players;
CREATE POLICY room_players_select_live ON public.room_players
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_players.room_id
        AND (r.status IN ('waiting','active') OR r.created_at > now() - interval '12 hours')
    )
  );
CREATE POLICY room_players_select_host ON public.room_players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_players.room_id
        AND (r.host_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- 5) Tighten anonymous avatar uploads to image files in the players folder
DROP POLICY IF EXISTS "Players can upload avatars to players folder" ON storage.objects;
CREATE POLICY "Players can upload avatars to players folder" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'players'
    AND name ~* '\.(jpe?g|png|webp)$'
  );
