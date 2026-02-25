
-- Shipping zones table for country-based shipping rules
CREATE TABLE public.shipping_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  free_shipping_threshold NUMERIC DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shipping rates per zone (standard/express etc)
CREATE TABLE public.shipping_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  shipping_type TEXT NOT NULL DEFAULT 'standard',
  base_cost NUMERIC NOT NULL DEFAULT 0,
  per_kg_cost NUMERIC NOT NULL DEFAULT 0,
  min_days INTEGER NOT NULL DEFAULT 3,
  max_days INTEGER NOT NULL DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, admins can manage
CREATE POLICY "Anyone can read shipping zones" ON public.shipping_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read shipping rates" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default shipping zones
INSERT INTO public.shipping_zones (country_code, country_name, free_shipping_threshold) VALUES
  ('BD', 'Bangladesh', 999),
  ('US', 'United States', 5000),
  ('CA', 'Canada', 5000),
  ('AE', 'United Arab Emirates', 3000);

-- Seed default shipping rates
INSERT INTO public.shipping_rates (zone_id, shipping_type, base_cost, per_kg_cost, min_days, max_days)
SELECT z.id, 'standard', 60, 10, 3, 7 FROM public.shipping_zones z WHERE z.country_code = 'BD'
UNION ALL
SELECT z.id, 'express', 120, 20, 1, 3 FROM public.shipping_zones z WHERE z.country_code = 'BD'
UNION ALL
SELECT z.id, 'standard', 500, 50, 7, 14 FROM public.shipping_zones z WHERE z.country_code = 'US'
UNION ALL
SELECT z.id, 'express', 1200, 80, 3, 7 FROM public.shipping_zones z WHERE z.country_code = 'US'
UNION ALL
SELECT z.id, 'standard', 600, 55, 7, 14 FROM public.shipping_zones z WHERE z.country_code = 'CA'
UNION ALL
SELECT z.id, 'express', 1300, 85, 3, 7 FROM public.shipping_zones z WHERE z.country_code = 'CA'
UNION ALL
SELECT z.id, 'standard', 300, 30, 5, 10 FROM public.shipping_zones z WHERE z.country_code = 'AE'
UNION ALL
SELECT z.id, 'express', 700, 50, 2, 5 FROM public.shipping_zones z WHERE z.country_code = 'AE';
