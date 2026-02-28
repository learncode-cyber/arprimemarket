
DROP POLICY "Edge functions can insert translations" ON public.translations_cache;

CREATE POLICY "Deny anon insert on translations" ON public.translations_cache
  FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Auth users can insert translations" ON public.translations_cache
  FOR INSERT TO authenticated WITH CHECK (true);
