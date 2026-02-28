
CREATE TABLE public.translations_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text text NOT NULL,
  source_lang text NOT NULL DEFAULT 'en',
  target_lang text NOT NULL,
  translated_text text NOT NULL,
  content_type text NOT NULL DEFAULT 'product',
  content_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(source_text, target_lang)
);

ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations" ON public.translations_cache
  FOR SELECT USING (true);

CREATE POLICY "Edge functions can insert translations" ON public.translations_cache
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_translations_cache_lookup ON public.translations_cache(source_text, target_lang);
CREATE INDEX idx_translations_cache_content ON public.translations_cache(content_id, target_lang);
