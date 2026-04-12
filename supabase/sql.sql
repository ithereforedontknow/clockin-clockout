INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.employees WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.employees WHERE user_id = auth.uid() LIMIT 1
    )
  );
  CREATE OR REPLACE FUNCTION public.close_stale_clock_entries()
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
  BEGIN
    UPDATE clock_entries
    SET
      clock_out = (date + interval '23 hours 59 minutes')::timestamptz,
      total_minutes = 1439,
      notes = COALESCE(notes || ' ', '') || '[Auto-closed: missed clock-out]'
    WHERE
      clock_out IS NULL
      AND date < CURRENT_DATE;
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.close_stale_clock_entries() TO authenticated;

  DROP POLICY IF EXISTS "avatars: owner upload" ON storage.objects;
  DROP POLICY IF EXISTS "avatars: owner update" ON storage.objects;

  CREATE POLICY "avatars: owner upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  CREATE POLICY "avatars: owner update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
