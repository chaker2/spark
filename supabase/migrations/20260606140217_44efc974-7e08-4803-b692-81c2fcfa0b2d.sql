-- Restore EXECUTE on is_admin so RLS policies that call it (quizzes_admin_all,
-- questions_admin_all, choices_admin_all, rooms_admin_all, etc.) can be evaluated
-- by authenticated/anon roles. is_admin is SECURITY DEFINER and only returns a boolean.
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;