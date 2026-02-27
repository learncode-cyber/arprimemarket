
-- Add Bangladesh sub-zone shipping rates (Inside Dhaka / Outside Dhaka)
-- First, get the BD zone and add new rate types

INSERT INTO public.shipping_rates (zone_id, shipping_type, base_cost, per_kg_cost, min_days, max_days, is_active)
SELECT z.id, 'inside_dhaka', 60, 5, 1, 2, true
FROM public.shipping_zones z WHERE z.country_code = 'BD'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, shipping_type, base_cost, per_kg_cost, min_days, max_days, is_active)
SELECT z.id, 'outside_dhaka', 120, 15, 3, 5, true
FROM public.shipping_zones z WHERE z.country_code = 'BD'
ON CONFLICT DO NOTHING;
