
-- Promotions table for flash sales, seasonal offers, product discount rules
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL DEFAULT 'flash_sale', -- flash_sale, seasonal, product_rule, bundle
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB DEFAULT '{}'::jsonb, -- min_qty, categories, specific products, etc.
  product_ids UUID[] DEFAULT '{}'::uuid[],
  category_ids UUID[] DEFAULT '{}'::uuid[],
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read active promotions" ON public.promotions FOR SELECT USING (is_active = true);

-- Referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  reward_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed
  reward_value NUMERIC NOT NULL DEFAULT 5,
  referrer_reward_value NUMERIC NOT NULL DEFAULT 5,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referral codes" ON public.referral_codes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own referral codes" ON public.referral_codes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, rewarded
  referrer_reward NUMERIC DEFAULT 0,
  referred_reward NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals" ON public.referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Admins can manage all referrals" ON public.referrals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (referred_id = auth.uid());

-- Campaigns table for unified marketing management
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'promotion', -- promotion, coupon, referral
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, ended
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  budget NUMERIC,
  spent NUMERIC NOT NULL DEFAULT 0,
  metrics JSONB DEFAULT '{"impressions":0,"clicks":0,"conversions":0,"revenue":0}'::jsonb,
  related_promotion_id UUID REFERENCES public.promotions(id),
  related_coupon_id UUID REFERENCES public.coupons(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
