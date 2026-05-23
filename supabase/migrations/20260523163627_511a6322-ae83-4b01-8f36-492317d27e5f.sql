
-- 1) Restrict profiles.is_admin column exposure
REVOKE SELECT (is_admin) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.is_admin(auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE(id uuid, display_name text, total_xp int, is_admin boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT p.id, p.display_name, p.total_xp, p.is_admin
    FROM public.profiles p ORDER BY p.total_xp DESC LIMIT 200;
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_profiles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon;

-- 2) Remove room_answers from realtime broadcast
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='room_answers'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.room_answers';
  END IF;
END $$;

-- 3) Scope quiz-images storage to per-user folder
DROP POLICY IF EXISTS "quiz-images auth upload" ON storage.objects;
DROP POLICY IF EXISTS "quiz-images owner delete" ON storage.objects;

CREATE POLICY "quiz-images auth upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'quiz-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "quiz-images owner update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'quiz-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "quiz-images owner delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'quiz-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Restrict EXECUTE on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_room_code() FROM anon, public;
-- generate_room_code still callable by authenticated teachers
GRANT EXECUTE ON FUNCTION public.generate_room_code() TO authenticated;
