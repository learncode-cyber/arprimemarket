
-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  affiliate_code text NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 5.0,
  commission_type text NOT NULL DEFAULT 'percentage',
  total_earnings numeric NOT NULL DEFAULT 0,
  pending_earnings numeric NOT NULL DEFAULT 0,
  paid_earnings numeric NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_sales numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  last_sale_at timestamptz,
  payout_method text DEFAULT 'bank_transfer',
  payout_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Affiliate commissions log
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_total numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Affiliates
CREATE POLICY "Users can read own affiliate" ON public.affiliates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own affiliate" ON public.affiliates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Auth users can create affiliate" ON public.affiliates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all affiliates" ON public.affiliates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access affiliates" ON public.affiliates FOR SELECT USING (false);

-- RLS: Commissions
CREATE POLICY "Users can read own commissions" ON public.affiliate_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = affiliate_commissions.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can manage all commissions" ON public.affiliate_commissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access commissions" ON public.affiliate_commissions FOR SELECT USING (false);

-- Function to generate affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.affiliate_code IS NULL OR NEW.affiliate_code = '' THEN
    NEW.affiliate_code := 'AFF-' || UPPER(SUBSTR(MD5(NEW.user_id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_affiliate_code
BEFORE INSERT ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.generate_affiliate_code();

-- Function to credit affiliate commission
CREATE OR REPLACE FUNCTION public.credit_affiliate_commission(_affiliate_code text, _order_id uuid, _order_total numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    total_earnings = total_earnings + _commission,
    pending_earnings = pending_earnings + _commission,
    total_orders = total_orders + 1,
    total_sales = total_sales + _order_total,
    last_sale_at = now(),
    updated_at = now()
  WHERE id = _affiliate.id;
END;
$$;

-- Auto-cleanup: deactivate affiliates with no sales in 30 days
CREATE OR REPLACE FUNCTION public.cleanup_inactive_affiliates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.affiliates
  SET status = 'inactive', updated_at = now()
  WHERE status = 'active'
    AND total_orders = 0
    AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;
