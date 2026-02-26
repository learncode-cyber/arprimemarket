
-- Create a secure view for public product access that hides sensitive pricing
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  id, title, slug, description, price, compare_at_price, currency,
  image_url, images, category_id, stock_quantity, is_active, is_featured,
  rating, review_count, tags, sku, barcode, weight, created_at, updated_at
FROM public.products
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.products_public TO anon, authenticated;
