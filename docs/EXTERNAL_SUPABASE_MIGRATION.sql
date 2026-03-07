-- ============================================================
-- AR Prime Market — Full Database Migration Script
-- Target: External Supabase Project
-- Generated: 2026-03-07
-- ============================================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard → SQL Editor
-- 2. Paste this entire script and run it
-- 3. After running, go to Authentication → Settings and configure providers
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- STEP 1: ENUM TYPES
-- ══════════════════════════════════════════════════════════════
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ══════════════════════════════════════════════════════════════
-- STEP 2: TABLES (in dependency order)
-- ══════════════════════════════════════════════════════════════

-- ─── Categories ───
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Products ───
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  cost_price numeric,
  supplier_price numeric,
  supplier_url text,
  currency text NOT NULL DEFAULT 'BDT',
  category_id uuid REFERENCES public.categories(id),
  image_url text,
  images text[],
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  tags text[],
  sku text,
  barcode text,
  weight numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Product Variants ───
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_label text NOT NULL DEFAULT '',
  size text,
  color text,
  sku text,
  price_delta numeric NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Profiles ───
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  address text,
  city text,
  country text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── User Roles ───
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ─── Addresses ───
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  country text NOT NULL DEFAULT 'Bangladesh',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Coupons ───
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  min_order_amount numeric,
  max_uses integer,
  used_count integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Orders ───
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  coupon_id uuid REFERENCES public.coupons(id),
  shipping_name text,
  shipping_email text,
  shipping_phone text,
  shipping_address text,
  shipping_city text,
  shipping_postal_code text,
  shipping_country text,
  shipping_method text,
  tracking_number text,
  tracking_token text,
  notes text,
  is_dropship boolean DEFAULT false,
  auto_forwarded boolean DEFAULT false,
  forwarded_at timestamptz,
  supplier_order_id text,
  processing_errors jsonb,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Order Items ───
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  title text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Payment Methods ───
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  display_name_bn text,
  display_name_ar text,
  method_key text NOT NULL UNIQUE,
  method_type text NOT NULL,
  icon_name text,
  instructions text,
  instructions_bn text,
  instructions_ar text,
  wallet_address text,
  deposit_link text,
  network text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Payment Transactions ───
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  payment_method_key text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'pending',
  transaction_reference text,
  admin_notes text,
  confirmed_at timestamptz,
  confirmed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Abandoned Carts ───
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  email text,
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  recovery_token text,
  is_recovered boolean NOT NULL DEFAULT false,
  recovered_at timestamptz,
  recovered_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Cart Reminder Logs ───
CREATE TABLE public.cart_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abandoned_cart_id uuid NOT NULL REFERENCES public.abandoned_carts(id),
  email_to text NOT NULL,
  reminder_tier integer NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Email Logs ───
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  abandoned_cart_id uuid REFERENCES public.abandoned_carts(id),
  recipient text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Order Alerts ───
CREATE TABLE public.order_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  alert_type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Return Requests ───
CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  product_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  refund_amount numeric NOT NULL DEFAULT 0,
  refund_type text NOT NULL DEFAULT 'original',
  restock_items boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Shipping Zones & Rates ───
CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  free_shipping_threshold numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.shipping_zones(id),
  shipping_type text NOT NULL DEFAULT 'standard',
  base_cost numeric NOT NULL DEFAULT 0,
  per_kg_cost numeric NOT NULL DEFAULT 0,
  min_days integer NOT NULL DEFAULT 3,
  max_days integer NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Suppliers ───
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  website_url text,
  api_endpoint text,
  api_key_encrypted text,
  auto_forward boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  supplier_sku text,
  supplier_price numeric,
  supplier_url text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  external_order_id text,
  status text NOT NULL DEFAULT 'pending',
  tracking_number text,
  shipping_carrier text,
  notes text,
  forwarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  sync_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  products_synced integer DEFAULT 0,
  errors jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Warehouses & Stock ───
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 0,
  reserved_quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  adjustment_type text NOT NULL DEFAULT 'manual',
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL DEFAULT 0,
  new_quantity integer NOT NULL DEFAULT 0,
  reason text,
  adjusted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Blog ───
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  image_url text,
  author_name text NOT NULL DEFAULT 'Admin',
  category_id uuid REFERENCES public.blog_categories(id),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  read_time text,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id),
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Chat ───
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  visitor_name text,
  visitor_email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id),
  sender_type text NOT NULL DEFAULT 'user',
  sender_id uuid,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── FAQ ───
CREATE TABLE public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.faq_categories(id),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Help Center ───
CREATE TABLE public.help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.help_categories(id),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Support Tickets ───
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id),
  sender_id uuid NOT NULL,
  sender_type text NOT NULL DEFAULT 'user',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Campaigns ───
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'draft',
  budget numeric,
  spent numeric NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  metrics jsonb,
  related_coupon_id uuid REFERENCES public.coupons(id),
  related_promotion_id uuid REFERENCES public.promotions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Promotions ───
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  promotion_type text NOT NULL DEFAULT 'sale',
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  product_ids text[],
  category_ids text[],
  conditions jsonb,
  banner_url text,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fix: campaigns references promotions, so create promotions first, then alter campaigns
-- (campaigns table above references promotions which doesn't exist yet)
-- We'll handle this by creating promotions before campaigns or using ALTER TABLE

-- ─── Referrals ───
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  reward_type text NOT NULL DEFAULT 'percentage',
  reward_value numeric NOT NULL DEFAULT 5,
  referrer_reward_value numeric NOT NULL DEFAULT 5,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  order_id uuid REFERENCES public.orders(id),
  status text NOT NULL DEFAULT 'pending',
  referrer_reward numeric,
  referred_reward numeric,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Site Content ───
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_label text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Tracking Pixels ───
CREATE TABLE public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pixel_type text NOT NULL,
  pixel_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Translations Cache ───
CREATE TABLE public.translations_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text text NOT NULL,
  target_lang text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_text, target_lang)
);

-- ─── Upsell Events ───
CREATE TABLE public.upsell_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  product_id uuid REFERENCES public.products(id),
  upsell_product_id uuid REFERENCES public.products(id),
  event_type text NOT NULL DEFAULT 'shown',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Wishlists ───
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ─── Widget Configs ───
CREATE TABLE public.widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_key text NOT NULL UNIQUE,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── AI Tables ───
CREATE TABLE public.ai_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type text NOT NULL DEFAULT 'general',
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text NOT NULL,
  suggestion text,
  auto_fix_available boolean NOT NULL DEFAULT false,
  auto_fix_query text,
  status text NOT NULL DEFAULT 'open',
  metadata jsonb,
  applied_at timestamptz,
  applied_by uuid,
  dismissed_at timestamptz,
  dismissed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details text,
  scan_result_id uuid REFERENCES public.ai_scan_results(id),
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_knowledge_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_type text NOT NULL DEFAULT 'product_sync',
  summary text,
  items_updated integer DEFAULT 0,
  status text DEFAULT 'completed',
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_learning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  lesson_type text NOT NULL DEFAULT 'correction',
  category text NOT NULL DEFAULT 'general',
  trigger_message text,
  correct_response text,
  wrong_response text,
  confidence_score numeric DEFAULT 0.5,
  times_applied integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_marketing_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name text NOT NULL,
  strategy_type text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  effectiveness_score numeric DEFAULT 0,
  times_used integer DEFAULT 0,
  times_converted integer DEFAULT 0,
  is_active boolean DEFAULT true,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- STEP 3: VIEWS
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.products_public AS
SELECT id, title, slug, description, price, compare_at_price, currency,
  image_url, images, is_active, is_featured, rating, review_count,
  stock_quantity, tags, sku, barcode, weight, category_id, created_at, updated_at
FROM products WHERE is_active = true;

CREATE OR REPLACE VIEW public.payment_methods_public AS
SELECT id, display_name, display_name_bn, display_name_ar, method_key,
  method_type, icon_name, instructions, instructions_bn, instructions_ar,
  sort_order, is_active, network
FROM payment_methods WHERE is_active = true;

-- ══════════════════════════════════════════════════════════════
-- STEP 4: FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Role checker (SECURITY DEFINER — bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile + user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Order number generator
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'ARP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- Return number generator
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.return_number := 'RET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Ticket number generator
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Guest order lookup
CREATE OR REPLACE FUNCTION public.get_guest_order(_order_number text, _tracking_token text)
RETURNS SETOF orders
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number
    AND tracking_token = _tracking_token
    AND user_id IS NULL
    AND created_at > NOW() - INTERVAL '180 days';
$$;

CREATE OR REPLACE FUNCTION public.verify_guest_order(_order_number text, _email text)
RETURNS SETOF orders
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number
    AND LOWER(shipping_email) = LOWER(_email)
    AND user_id IS NULL
    AND created_at > NOW() - INTERVAL '180 days';
$$;

CREATE OR REPLACE FUNCTION public.is_guest_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id AND o.user_id IS NULL
  )
$$;

-- Prevent order ownership change
CREATE OR REPLACE FUNCTION public.prevent_order_user_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change order ownership after creation';
  END IF;
  RETURN NEW;
END;
$$;

-- Price validation
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE actual_price numeric;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT price INTO actual_price FROM public.products WHERE id = NEW.product_id AND is_active = true;
    IF actual_price IS NULL THEN RAISE EXCEPTION 'Product not found or inactive'; END IF;
    IF NEW.price <> actual_price THEN RAISE EXCEPTION 'Price mismatch: submitted % but actual is %', NEW.price, actual_price; END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- STEP 5: TRIGGERS
-- ══════════════════════════════════════════════════════════════

-- Auth trigger (run in Supabase SQL editor — attaches to auth.users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

CREATE TRIGGER set_return_number
  BEFORE INSERT ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_return_number();

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

CREATE TRIGGER prevent_user_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.prevent_order_user_change();

CREATE TRIGGER validate_item_price
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_price();

-- ══════════════════════════════════════════════════════════════
-- STEP 6: ENABLE RLS ON ALL TABLES
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- STEP 7: RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- Helper macro: Admin full access
-- Pattern: Admins get ALL, public/anon get limited access

-- ─── abandoned_carts ───
CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own abandoned carts" ON public.abandoned_carts FOR ALL TO public USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anon can insert guest carts" ON public.abandoned_carts FOR INSERT TO public WITH CHECK (user_id IS NULL);
CREATE POLICY "Anon can update own guest cart" ON public.abandoned_carts FOR UPDATE TO public USING (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "Deny anon select abandoned" ON public.abandoned_carts FOR SELECT TO public USING (false);

-- ─── addresses ───
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL TO public USING (user_id = auth.uid());
CREATE POLICY "Deny anon access" ON public.addresses FOR SELECT TO anon USING (false);

-- ─── ai tables (admin only) ───
CREATE POLICY "Admins can manage activity log" ON public.ai_activity_log FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access" ON public.ai_activity_log FOR SELECT TO anon USING (false);

CREATE POLICY "Admins can manage ai_knowledge_updates" ON public.ai_knowledge_updates FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to ai_knowledge_updates" ON public.ai_knowledge_updates FOR SELECT TO public USING (false);

CREATE POLICY "Admins can manage ai_learning_log" ON public.ai_learning_log FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to ai_learning_log" ON public.ai_learning_log FOR SELECT TO public USING (false);

CREATE POLICY "Admins can manage ai_marketing_strategies" ON public.ai_marketing_strategies FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to ai_marketing_strategies" ON public.ai_marketing_strategies FOR SELECT TO public USING (false);

CREATE POLICY "Admins can manage scan results" ON public.ai_scan_results FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to scan results" ON public.ai_scan_results FOR SELECT TO anon USING (false);

-- ─── blog ───
CREATE POLICY "Anyone can read blog categories" ON public.blog_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read published posts" ON public.blog_posts FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read approved comments" ON public.blog_comments FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Auth users can insert comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage comments" ON public.blog_comments FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── campaigns ───
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to campaigns" ON public.campaigns FOR SELECT TO anon USING (false);

-- ─── cart_reminder_logs ───
CREATE POLICY "Admins can manage reminder logs" ON public.cart_reminder_logs FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── categories ───
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── chat ───
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT TO public USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admins can manage chat sessions" ON public.chat_sessions FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can read session messages" ON public.chat_messages FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage chat messages" ON public.chat_messages FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── coupons ───
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── email_logs ───
CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── faq ───
CREATE POLICY "Anyone can read faq categories" ON public.faq_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage faq categories" ON public.faq_categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active faqs" ON public.faq_items FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage faq items" ON public.faq_items FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── help center ───
CREATE POLICY "Anyone can read help categories" ON public.help_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage help categories" ON public.help_categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read published articles" ON public.help_articles FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admins can manage help articles" ON public.help_articles FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── orders ───
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO public USING (user_id = auth.uid() OR is_guest_order(id));
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── order_items ───
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_guest_order(orders.id)))
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── order_alerts ───
CREATE POLICY "Admins can manage order alerts" ON public.order_alerts FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── payment_methods ───
CREATE POLICY "Anyone can read active payment methods" ON public.payment_methods FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── payment_transactions ───
CREATE POLICY "Users can view own transactions" ON public.payment_transactions FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert transactions" ON public.payment_transactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage transactions" ON public.payment_transactions FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── products ───
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── product_variants ───
CREATE POLICY "Anyone can read active variants" ON public.product_variants FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── profiles ───
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO public USING (has_role(auth.uid(), 'admin'));

-- ─── promotions ───
CREATE POLICY "Anyone can read active promotions" ON public.promotions FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── referrals ───
CREATE POLICY "Users can view own referral codes" ON public.referral_codes FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "Users can create referral codes" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO public USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── return_requests ───
CREATE POLICY "Users can view own returns" ON public.return_requests FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "Users can create returns" ON public.return_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage returns" ON public.return_requests FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── shipping ───
CREATE POLICY "Anyone can read active zones" ON public.shipping_zones FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage zones" ON public.shipping_zones FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active rates" ON public.shipping_rates FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage rates" ON public.shipping_rates FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── site_content ───
CREATE POLICY "Anyone can read active content" ON public.site_content FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage content" ON public.site_content FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── stock_adjustments ───
CREATE POLICY "Admins can manage stock" ON public.stock_adjustments FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── suppliers ───
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage supplier products" ON public.supplier_products FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage supplier orders" ON public.supplier_orders FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage sync logs" ON public.supplier_sync_logs FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── support_tickets ───
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own ticket messages" ON public.ticket_messages FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_messages.ticket_id AND support_tickets.user_id = auth.uid())
);
CREATE POLICY "Users can insert ticket messages" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Admins can manage ticket messages" ON public.ticket_messages FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── tracking_pixels ───
CREATE POLICY "Anyone can read active pixels" ON public.tracking_pixels FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage pixels" ON public.tracking_pixels FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── translations_cache ───
CREATE POLICY "Anyone can read translations" ON public.translations_cache FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage translations" ON public.translations_cache FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── upsell_events ───
CREATE POLICY "Anyone can insert upsell events" ON public.upsell_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage upsell events" ON public.upsell_events FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── user_roles ───
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── warehouses ───
CREATE POLICY "Admins can manage warehouses" ON public.warehouses FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage warehouse stock" ON public.warehouse_stock FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── widget_configs ───
CREATE POLICY "Anyone can read active widgets" ON public.widget_configs FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage widgets" ON public.widget_configs FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- ─── wishlists ───
CREATE POLICY "Users can manage own wishlists" ON public.wishlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- STEP 8: ENABLE REALTIME
-- ══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_stock;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;

-- ══════════════════════════════════════════════════════════════
-- STEP 9: CREATE FIRST ADMIN USER (run AFTER your first signup)
-- ══════════════════════════════════════════════════════════════
-- Replace 'YOUR_USER_ID_HERE' with the actual user UUID after signup:
--
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin');
--
-- ══════════════════════════════════════════════════════════════

-- ✅ Migration Complete!
