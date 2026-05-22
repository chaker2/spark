
-- Restrict is_admin() execute
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Tighten storage read: require an actual object name (prevents listing root)
DROP POLICY IF EXISTS "quiz-images public read" ON storage.objects;
CREATE POLICY "quiz-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-images' AND name IS NOT NULL AND length(name) > 0);
