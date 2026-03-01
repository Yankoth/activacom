-- Create the photos storage bucket
-- Public read access (Display App needs to view photos without authentication)
-- Service role only for insert/delete (via Edge Functions)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos', 'photos', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
);

-- Only service_role (Edge Functions) can insert photos
CREATE POLICY "photos_bucket: service_role can insert"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Only service_role (Edge Functions) can delete photos
CREATE POLICY "photos_bucket: service_role can delete"
  ON storage.objects FOR DELETE USING (bucket_id = 'photos');

-- Public read — Display App and admin panel need to view photos
CREATE POLICY "photos_bucket: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'photos');
