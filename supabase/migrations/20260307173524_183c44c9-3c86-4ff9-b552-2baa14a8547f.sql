
-- Add scheduled publishing columns to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;

-- Create blog-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT (id) DO NOTHING;

-- RLS for blog-images bucket
CREATE POLICY "Admins can upload blog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update blog images" ON storage.objects FOR UPDATE USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete blog images" ON storage.objects FOR DELETE USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
