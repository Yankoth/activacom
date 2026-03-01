-- Allow the Display App (anon key, no auth) to SELECT approved photos
CREATE POLICY "photos: anon can select approved"
  ON public.photos FOR SELECT TO anon
  USING (status = 'approved');
