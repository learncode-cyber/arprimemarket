INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read category images" ON storage.objects
FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Auth users upload category images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "Auth users delete category images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'category-images');