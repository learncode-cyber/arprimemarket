-- ============================================================
-- AR Prime Market — Full Schema Migration
-- Run this in your external Supabase SQL Editor
-- Generated: 2026-03-09
-- ============================================================

-- ─── Extensions ───
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Custom Types ───
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES public.categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS public.products (
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
  images text[] DEFAULT '{}',
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  sku text,
  barcode text,
  brand text,
  weight numeric,
  width_cm numeric,
  height_cm numeric,
  length_cm numeric,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- products_public (view)
CREATE OR REPLACE VIEW public.products_public AS
  SELECT id, title, slug, description, price, compare_at_price, currency,
         category_id, image_url, images, stock_quantity, is_active, is_featured,
         rating, review_count, tags, sku, barcode, weight, created_at, updated_at
  FROM public.products
  WHERE is_active = true;

-- product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
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

-- coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text,
  payment_reference text,
  currency text NOT NULL DEFAULT 'BDT',
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  coupon_id uuid REFERENCES public.coupons(id),
  shipping_name text,
  shipping_phone text,
  shipping_email text,
  shipping_address text,
  shipping_city text,
  shipping_country text DEFAULT 'BD',
  shipping_postal_code text,
  shipping_method text,
  tracking_number text,
  tracking_token text DEFAULT encode(gen_random_bytes(32), 'hex'),
  notes text,
  is_dropship boolean DEFAULT false,
  auto_forwarded boolean DEFAULT false,
  forwarded_at timestamptz,
  supplier_order_id text,
  processing_errors jsonb DEFAULT '[]',
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  product_id uuid REFERENCES public.products(id),
  title text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- order_alerts
CREATE TABLE IF NOT EXISTS public.order_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  title text NOT NULL,
  message text,
  alert_type text NOT NULL DEFAULT 'info',
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'Bangladesh',
  postal_code text,
  label text NOT NULL DEFAULT 'Home',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key text NOT NULL UNIQUE,
  method_type text NOT NULL,
  display_name text NOT NULL,
  display_name_bn text,
  display_name_ar text,
  icon_name text,
  instructions text,
  instructions_bn text,
  instructions_ar text,
  wallet_address text,
  deposit_link text,
  network text,
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- payment_methods_public (view)
CREATE OR REPLACE VIEW public.payment_methods_public AS
  SELECT id, method_key, method_type, display_name, display_name_bn, display_name_ar,
         icon_name, instructions, instructions_bn, instructions_ar, network, is_active, sort_order
  FROM public.payment_methods
  WHERE is_active = true;

-- payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  payment_method_key text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'pending',
  transaction_reference text,
  admin_notes text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- abandoned_carts
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  session_id text,
  cart_items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  is_recovered boolean NOT NULL DEFAULT false,
  recovered_at timestamptz,
  recovered_order_id uuid REFERENCES public.orders(id),
  recovery_token text DEFAULT encode(gen_random_bytes(32), 'hex'),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- cart_reminder_logs
CREATE TABLE IF NOT EXISTS public.cart_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abandoned_cart_id uuid NOT NULL REFERENCES public.abandoned_carts(id),
  email_to text NOT NULL,
  reminder_tier integer NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  order_id uuid REFERENCES public.orders(id),
  abandoned_cart_id uuid REFERENCES public.abandoned_carts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  affiliate_code text NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 5.0,
  commission_type text NOT NULL DEFAULT 'percentage',
  status text NOT NULL DEFAULT 'active',
  total_clicks integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_sales numeric NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  pending_earnings numeric NOT NULL DEFAULT 0,
  paid_earnings numeric NOT NULL DEFAULT 0,
  last_sale_at timestamptz,
  payout_method text DEFAULT 'bank_transfer',
  payout_details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- affiliate_commissions
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  order_total numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- referral_codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  reward_type text NOT NULL DEFAULT 'discount',
  reward_value numeric NOT NULL DEFAULT 0,
  referrer_reward_value numeric NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  order_id uuid REFERENCES public.orders(id),
  referrer_reward numeric,
  referred_reward numeric,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  promotion_type text NOT NULL DEFAULT 'discount',
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

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL DEFAULT 'promotion',
  status text NOT NULL DEFAULT 'draft',
  budget numeric,
  spent numeric NOT NULL DEFAULT 0,
  metrics jsonb DEFAULT '{"clicks": 0, "revenue": 0, "conversions": 0, "impressions": 0}',
  related_promotion_id uuid REFERENCES public.promotions(id),
  related_coupon_id uuid REFERENCES public.coupons(id),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- blog_categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  image_url text,
  author_name text NOT NULL DEFAULT 'AR Prime Team',
  category_id uuid REFERENCES public.blog_categories(id),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  scheduled_at timestamptz,
  read_time text DEFAULT '5 min',
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- blog_comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id),
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- chat_sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  visitor_name text DEFAULT 'Visitor',
  visitor_email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id),
  sender_type text NOT NULL DEFAULT 'user',
  sender_id uuid,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- faq_categories
CREATE TABLE IF NOT EXISTS public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- faq_items
CREATE TABLE IF NOT EXISTS public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.faq_categories(id),
  question text NOT NULL,
  answer text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- help_categories
CREATE TABLE IF NOT EXISTS public.help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'HelpCircle',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- help_articles
CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.help_categories(id),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- api_keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  label text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT 'admin',
  permissions text[] NOT NULL DEFAULT '{ai,webhooks,orders,products,blog}',
  is_active boolean NOT NULL DEFAULT true,
  rate_limit_per_minute integer NOT NULL DEFAULT 60,
  rate_limit_per_day integer NOT NULL DEFAULT 1000,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- api_call_logs
CREATE TABLE IF NOT EXISTS public.api_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id),
  endpoint text NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  tokens_used integer NOT NULL DEFAULT 0,
  ip_address text,
  source text NOT NULL DEFAULT 'external',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_scan_results
CREATE TABLE IF NOT EXISTS public.ai_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  suggestion text,
  severity text NOT NULL DEFAULT 'info',
  category text NOT NULL DEFAULT 'general',
  scan_type text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'pending',
  auto_fix_available boolean NOT NULL DEFAULT false,
  auto_fix_query text,
  metadata jsonb DEFAULT '{}',
  applied_at timestamptz,
  applied_by uuid,
  dismissed_at timestamptz,
  dismissed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_activity_log
CREATE TABLE IF NOT EXISTS public.ai_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details text,
  performed_by uuid,
  scan_result_id uuid REFERENCES public.ai_scan_results(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_engine_logs
CREATE TABLE IF NOT EXISTS public.ai_engine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine text NOT NULL DEFAULT 'lovable-gemini',
  model text,
  source text NOT NULL DEFAULT 'internal',
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  fallback_triggered boolean NOT NULL DEFAULT false,
  api_key_id uuid REFERENCES public.api_keys(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_knowledge_updates
CREATE TABLE IF NOT EXISTS public.ai_knowledge_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_type text NOT NULL DEFAULT 'product_sync',
  status text DEFAULT 'completed',
  items_updated integer DEFAULT 0,
  summary text,
  triggered_by text DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ai_learning_log
CREATE TABLE IF NOT EXISTS public.ai_learning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  lesson_type text NOT NULL DEFAULT 'correction',
  category text NOT NULL DEFAULT 'general',
  trigger_message text,
  wrong_response text,
  correct_response text,
  confidence_score numeric DEFAULT 0.5,
  times_applied integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ai_marketing_strategies
CREATE TABLE IF NOT EXISTS public.ai_marketing_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name text NOT NULL,
  description text NOT NULL,
  strategy_type text NOT NULL DEFAULT 'sales_tactic',
  effectiveness_score numeric DEFAULT 0.5,
  times_used integer DEFAULT 0,
  times_converted integer DEFAULT 0,
  is_active boolean DEFAULT true,
  last_reviewed_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_guest_order(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = _order_id AND o.user_id IS NULL)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.order_number := 'ARP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_order_number BEFORE INSERT ON public.orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := 'ARP-TRK-' || UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_order_user_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change order ownership after creation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_order_user_change BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.prevent_order_user_change();

CREATE OR REPLACE FUNCTION public.get_guest_order(_order_number text, _tracking_token text)
RETURNS SETOF orders LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number AND tracking_token = _tracking_token
    AND user_id IS NULL AND created_at > NOW() - INTERVAL '180 days';
$$;

CREATE OR REPLACE FUNCTION public.verify_guest_order(_order_number text, _email text)
RETURNS SETOF orders LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number AND LOWER(shipping_email) = LOWER(_email)
    AND user_id IS NULL AND created_at > NOW() - INTERVAL '180 days';
$$;

CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.return_number := 'RET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.affiliate_code IS NULL OR NEW.affiliate_code = '' THEN
    NEW.affiliate_code := 'AFF-' || UPPER(SUBSTR(MD5(NEW.user_id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_affiliate_commission(_affiliate_code text, _order_id uuid, _order_total numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _affiliate record;
  _commission numeric;
BEGIN
  SELECT * INTO _affiliate FROM public.affiliates WHERE affiliate_code = _affiliate_code AND status = 'active';
  IF NOT FOUND THEN RETURN; END IF;
  IF _affiliate.commission_type = 'percentage' THEN
    _commission := ROUND((_order_total * _affiliate.commission_rate / 100), 2);
  ELSE
    _commission := _affiliate.commission_rate;
  END IF;
  INSERT INTO public.affiliate_commissions (affiliate_id, order_id, order_total, commission_rate, commission_amount)
  VALUES (_affiliate.id, _order_id, _order_total, _affiliate.commission_rate, _commission);
  UPDATE public.affiliates SET
    total_earnings = total_earnings + _commission, pending_earnings = pending_earnings + _commission,
    total_orders = total_orders + 1, total_sales = total_sales + _order_total,
    last_sale_at = now(), updated_at = now()
  WHERE id = _affiliate.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_inactive_affiliates()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.affiliates SET status = 'inactive', updated_at = now()
  WHERE status = 'active' AND total_orders = 0 AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- ============================================================
-- RLS — Enable on all tables
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_engine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marketing_strategies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- categories
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- products
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- product_variants
CREATE POLICY "Anyone can read active variants" ON public.product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (has_role(auth.uid(), 'admin'));

-- coupons
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow anon guest order inserts" ON public.orders FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon select orders" ON public.orders FOR SELECT TO anon USING (false);

-- order_items
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Allow anon guest order item inserts" ON public.order_items FOR INSERT TO anon WITH CHECK (is_guest_order(order_id));
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon select order_items" ON public.order_items FOR SELECT TO anon USING (false);

-- order_alerts
CREATE POLICY "Admins can manage order alerts" ON public.order_alerts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon order_alerts" ON public.order_alerts FOR SELECT TO anon USING (false);

-- addresses
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Deny anon addresses" ON public.addresses FOR SELECT TO anon USING (false);

-- payment_methods
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon payment_methods" ON public.payment_methods FOR SELECT TO anon USING (false);

-- payment_transactions
CREATE POLICY "Users can read own payment transactions" ON public.payment_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Allow anon guest payment inserts" ON public.payment_transactions FOR INSERT TO anon WITH CHECK (is_guest_order(order_id));
CREATE POLICY "Admins can manage all payment transactions" ON public.payment_transactions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon select payment_transactions" ON public.payment_transactions FOR SELECT TO anon USING (false);

-- abandoned_carts
CREATE POLICY "Users can manage own abandoned carts" ON public.abandoned_carts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anon can insert guest carts" ON public.abandoned_carts FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "Anon can update own guest cart" ON public.abandoned_carts FOR UPDATE USING (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon select abandoned" ON public.abandoned_carts FOR SELECT USING (false);

-- cart_reminder_logs
CREATE POLICY "Admins can manage reminder logs" ON public.cart_reminder_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon reminder_logs" ON public.cart_reminder_logs FOR SELECT USING (false);

-- email_logs
CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon email_logs" ON public.email_logs FOR SELECT USING (false);

-- affiliates
CREATE POLICY "Users can read own affiliate" ON public.affiliates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Auth users can create affiliate" ON public.affiliates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own affiliate" ON public.affiliates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all affiliates" ON public.affiliates FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon affiliates" ON public.affiliates FOR SELECT USING (false);

-- affiliate_commissions
CREATE POLICY "Users can read own commissions" ON public.affiliate_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_commissions.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon commissions" ON public.affiliate_commissions FOR SELECT USING (false);

-- blog
CREATE POLICY "Anyone can read published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read approved comments" ON public.blog_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Auth users can insert comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage comments" ON public.blog_comments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- chat
CREATE POLICY "Users can manage own sessions" ON public.chat_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all sessions" ON public.chat_sessions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon chat_sessions" ON public.chat_sessions FOR SELECT TO anon USING (false);
CREATE POLICY "Session users can manage own messages" ON public.chat_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid()));
CREATE POLICY "Admins can manage all messages" ON public.chat_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon chat_messages" ON public.chat_messages FOR SELECT TO anon USING (false);

-- FAQ
CREATE POLICY "Anyone can read faq categories" ON public.faq_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage faq categories" ON public.faq_categories FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active faqs" ON public.faq_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage faq items" ON public.faq_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Help
CREATE POLICY "Anyone can read help categories" ON public.help_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage help categories" ON public.help_categories FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read published articles" ON public.help_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage help articles" ON public.help_articles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Promotions & Campaigns
CREATE POLICY "Anyone can read active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon campaigns" ON public.campaigns FOR SELECT TO anon USING (false);

-- Referrals
CREATE POLICY "Users can read own referral codes" ON public.referral_codes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own referrals" ON public.referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- API & AI admin tables
CREATE POLICY "Admins can manage api_keys" ON public.api_keys FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon api_keys" ON public.api_keys FOR SELECT USING (false);
CREATE POLICY "Admins can manage api_call_logs" ON public.api_call_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon api_call_logs" ON public.api_call_logs FOR SELECT USING (false);
CREATE POLICY "Admins can manage scan results" ON public.ai_scan_results FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon ai_scan_results" ON public.ai_scan_results FOR SELECT TO anon USING (false);
CREATE POLICY "Admins can manage activity log" ON public.ai_activity_log FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon ai_activity_log" ON public.ai_activity_log FOR SELECT TO anon USING (false);
CREATE POLICY "Admins can manage ai_engine_logs" ON public.ai_engine_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon ai_engine_logs" ON public.ai_engine_logs FOR SELECT USING (false);
CREATE POLICY "Admins can manage ai_knowledge_updates" ON public.ai_knowledge_updates FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon ai_knowledge_updates" ON public.ai_knowledge_updates FOR SELECT USING (false);
CREATE POLICY "Admins can manage ai_learning_log" ON public.ai_learning_log FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon ai_learning_log" ON public.ai_learning_log FOR SELECT USING (false);
CREATE POLICY "Admins can manage ai_marketing_strategies" ON public.ai_marketing_strategies FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon ai_marketing_strategies" ON public.ai_marketing_strategies FOR SELECT USING (false);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these separately if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('return-images', 'return-images', false) ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE! Your external Supabase now mirrors Lovable Cloud schema.
-- Remember to also:
-- 1. Deploy edge functions via `supabase functions deploy`
-- 2. Set secrets: RESEND_API_KEY, etc.
-- 3. Configure env vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
-- ============================================================
