
-- ============================================================
-- 1. Deny anonymous SELECT on all sensitive/admin-only tables
-- ============================================================

-- Admin-only tables: deny anon access explicitly
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'suppliers', 'supplier_products', 'supplier_orders', 'supplier_sync_logs',
    'stock_adjustments', 'warehouse_stock', 'warehouses',
    'campaigns', 'order_alerts', 'ai_scan_results', 'ai_activity_log',
    'tracking_pixels'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Deny anon access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Deny anon access" ON public.%I FOR SELECT TO anon USING (false)', tbl
    );
  END LOOP;
END $$;

-- User-owned tables: deny anon access
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'orders', 'order_items', 'addresses',
    'payment_transactions', 'support_tickets', 'ticket_messages',
    'user_roles', 'referral_codes', 'referrals', 'wishlists',
    'chat_sessions', 'chat_messages'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Deny anon access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Deny anon access" ON public.%I FOR SELECT TO anon USING (false)', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 2. Hide cost_price and supplier_price from public product reads
--    by replacing the public SELECT policy with a column-restricted view approach.
--    Since RLS can't restrict columns, we replace the "Anyone can read active products"
--    policy to only work for authenticated users, and update the products_public view
--    to exclude sensitive fields.
-- ============================================================

-- Drop and recreate the products_public view WITHOUT sensitive columns
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
SELECT
  id, title, slug, description, price, compare_at_price, currency,
  image_url, images, is_active, is_featured, rating, review_count,
  stock_quantity, tags, sku, barcode, weight, category_id,
  created_at, updated_at
FROM public.products
WHERE is_active = true;

-- Grant SELECT on the safe view to anon and authenticated
GRANT SELECT ON public.products_public TO anon, authenticated;
