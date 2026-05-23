
-- Written-answer support
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS expected_answer text;

-- Reveal flag on rooms (controls whether correct answer is shown)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS reveal_answer boolean NOT NULL DEFAULT false;

-- Normalizer: lowercase, strip accents, strip Arabic tashkeel, collapse spaces, strip punctuation
CREATE OR REPLACE FUNCTION public.text_normalize(_s text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
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
$$;

-- Levenshtein-based similarity ratio (0..1). Postgres ships fuzzystrmatch.
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

CREATE OR REPLACE FUNCTION public.text_similarity(_a text, _b text)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  a text := public.text_normalize(_a);
  b text := public.text_normalize(_b);
  d int; m int;
BEGIN
  IF a = '' AND b = '' THEN RETURN 1; END IF;
  IF a = '' OR b = '' THEN RETURN 0; END IF;
  IF a = b THEN RETURN 1; END IF;
  m := GREATEST(length(a), length(b));
  -- levenshtein caps to avoid huge cost
  d := levenshtein_less_equal(left(a, 255), left(b, 255), 100);
  RETURN GREATEST(0, 1 - d::numeric / m);
END $$;

-- Replace submit_answer to handle 'written' type
CREATE OR REPLACE FUNCTION public.submit_answer(
  _room_id uuid, _question_id uuid, _client_id text, _username text,
  _choice_id uuid, _puzzle_order uuid[], _text_answer text DEFAULT NULL
)
RETURNS TABLE(is_correct boolean, score_awarded int, correct_choice_id uuid, correct_order uuid[], correct_text text, similarity numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
  v_sim numeric := 0;
  v_mult numeric := 0;
BEGIN
  IF _username IS NULL OR length(trim(_username)) = 0 OR length(_username) > 40 THEN RAISE EXCEPTION 'Invalid username'; END IF;
  IF _client_id IS NULL OR length(_client_id) > 100 THEN RAISE EXCEPTION 'Invalid client_id'; END IF;

  SELECT * INTO v_room FROM rooms WHERE id = _room_id;
  IF NOT FOUND OR v_room.status NOT IN ('waiting','active') THEN RAISE EXCEPTION 'Room not open'; END IF;
  IF v_room.current_question_id IS DISTINCT FROM _question_id THEN RAISE EXCEPTION 'Question not active'; END IF;

  SELECT * INTO v_question FROM questions WHERE id = _question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;

  IF EXISTS (SELECT 1 FROM room_answers WHERE room_id=_room_id AND question_id=_question_id AND client_id=_client_id) THEN
    RAISE EXCEPTION 'Already answered';
  END IF;

  v_elapsed_ms := EXTRACT(EPOCH FROM (now() - COALESCE(v_room.question_started_at, now()))) * 1000;

  SELECT c.id INTO v_correct_choice FROM choices c WHERE c.question_id=_question_id AND c.is_correct LIMIT 1;
  SELECT array_agg(c.id ORDER BY c.position) INTO v_correct_order FROM choices c WHERE c.question_id=_question_id;

  IF v_elapsed_ms > (v_question.time_limit * 1000 + 1500) THEN
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
END $$;

-- Unique username RPC for profile editing
CREATE OR REPLACE FUNCTION public.is_display_name_available(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(display_name) = lower(trim(_name)) AND id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

-- Answer-distribution RPC for end-of-question stats (host or admin only)
CREATE OR REPLACE FUNCTION public.get_answer_distribution(_room_id uuid, _question_id uuid)
RETURNS TABLE(choice_id uuid, count int, is_correct boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM rooms WHERE id=_room_id AND (host_id=auth.uid() OR public.is_admin(auth.uid()))
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
    SELECT ra.choice_id, count(*)::int, ra.is_correct
    FROM room_answers ra
    WHERE ra.room_id=_room_id AND ra.question_id=_question_id
    GROUP BY ra.choice_id, ra.is_correct;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_answer_distribution(uuid, uuid) FROM anon;
