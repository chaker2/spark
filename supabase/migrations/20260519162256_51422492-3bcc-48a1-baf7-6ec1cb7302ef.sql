DROP POLICY IF EXISTS "room_players_delete_public" ON public.room_players;

CREATE POLICY "room_players_delete_owner_or_host" ON public.room_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND r.host_id = auth.uid()
    )
    OR client_id = current_setting('request.headers', true)::json->>'x-client-id'
  );