DROP POLICY IF EXISTS "room_players_delete_self_or_host" ON public.room_players;
CREATE POLICY "room_players_delete_public" ON public.room_players
  FOR DELETE USING (true);