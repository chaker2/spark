CREATE POLICY "Players can upload avatars to players folder"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'players'
  );