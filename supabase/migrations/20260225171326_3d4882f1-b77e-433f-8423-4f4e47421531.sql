
CREATE TABLE public.tracking_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  pixel_id TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tracking pixels"
  ON public.tracking_pixels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active tracking pixels"
  ON public.tracking_pixels FOR SELECT
  USING (is_active = true);

-- Insert default rows for each platform
INSERT INTO public.tracking_pixels (platform, pixel_id, is_active) VALUES
  ('meta_pixel', '', false),
  ('google_analytics', '', false),
  ('google_ads', '', false);
