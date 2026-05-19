CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  attempts int := 0;
BEGIN
  LOOP
    new_code := lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
    IF NOT EXISTS (
      SELECT 1 FROM public.rooms WHERE code = new_code AND status <> 'ended'
    ) THEN
      RETURN new_code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 50 THEN
      RAISE EXCEPTION 'Could not generate unique room code';
    END IF;
  END LOOP;
END;
$$;