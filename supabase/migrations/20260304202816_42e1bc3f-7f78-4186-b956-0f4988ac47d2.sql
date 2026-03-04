
-- Bucket already created by previous partial migration, skip if exists
INSERT INTO storage.buckets (id, name, public) VALUES ('return-images', 'return-images', false) ON CONFLICT (id) DO NOTHING;

-- Drop policies if they exist from partial run
DROP POLICY IF EXISTS "Auth users can upload return images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own return images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete return images" ON storage.objects;

-- Allow authenticated users to upload images
CREATE POLICY "Auth users can upload return images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'return-images');

-- Allow users to read own + admins to read all
CREATE POLICY "Users can read own return images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'return-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow admins to delete
CREATE POLICY "Admins can delete return images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'return-images' AND public.has_role(auth.uid(), 'admin'::app_role));
