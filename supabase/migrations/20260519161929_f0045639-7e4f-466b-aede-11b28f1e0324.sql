
-- ROOMS
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz
);

CREATE INDEX rooms_code_active_idx ON public.rooms(code) WHERE status <> 'ended';
CREATE INDEX rooms_host_idx ON public.rooms(host_id);

-- ROOM PLAYERS
CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  username text NOT NULL,
  user_id uuid,
  client_id text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, username)
);

CREATE INDEX room_players_room_idx ON public.room_players(room_id);

-- Generate a unique 5-digit code not used by any non-ended room
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
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

-- RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Anyone can read rooms (needed for students to validate code without auth)
CREATE POLICY "rooms_select_all" ON public.rooms
  FOR SELECT USING (true);

-- Only authenticated users can create rooms; they must be the host
CREATE POLICY "rooms_insert_auth" ON public.rooms
  FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

-- Only host can update (e.g. start / end game)
CREATE POLICY "rooms_update_host" ON public.rooms
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- Only host can delete
CREATE POLICY "rooms_delete_host" ON public.rooms
  FOR DELETE TO authenticated
  USING (host_id = auth.uid());

-- Anyone can read players (live count + roster)
CREATE POLICY "room_players_select_all" ON public.room_players
  FOR SELECT USING (true);

-- Anyone can join a room that is still waiting
CREATE POLICY "room_players_insert_open" ON public.room_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND r.status = 'waiting'
    )
  );

-- A player can remove themselves by client_id; host can remove anyone in their room
CREATE POLICY "room_players_delete_self_or_host" ON public.room_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND r.host_id = auth.uid()
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
