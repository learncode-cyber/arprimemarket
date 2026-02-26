
-- Fix the security definer view - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public WITH (security_invoker = true) AS
SELECT 
  id, title, slug, description, price, compare_at_price, currency,
  image_url, images, category_id, stock_quantity, is_active, is_featured,
  rating, review_count, tags, sku, barcode, weight, created_at, updated_at
FROM public.products
WHERE is_active = true;

GRANT SELECT ON public.products_public TO anon, authenticated;
