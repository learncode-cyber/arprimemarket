-- Abandoned carts table
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  email text,
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  recovery_token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  is_recovered boolean NOT NULL DEFAULT false,
  recovered_at timestamptz,
  recovered_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own abandoned carts" ON public.abandoned_carts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anon can insert guest carts" ON public.abandoned_carts FOR INSERT WITH CHECK (user_id IS NULL);
CREATE POLICY "Anon can update own guest cart" ON public.abandoned_carts FOR UPDATE USING (user_id IS NULL AND session_id IS NOT NULL);
CREATE POLICY "Deny anon select abandoned" ON public.abandoned_carts FOR SELECT USING (false);

-- Cart reminder logs
CREATE TABLE public.cart_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abandoned_cart_id uuid NOT NULL REFERENCES public.abandoned_carts(id) ON DELETE CASCADE,
  reminder_tier integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  email_to text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text
);

ALTER TABLE public.cart_reminder_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage reminder logs" ON public.cart_reminder_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to reminder logs" ON public.cart_reminder_logs FOR SELECT USING (false);

-- Email logs table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  abandoned_cart_id uuid REFERENCES public.abandoned_carts(id),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email logs" ON public.email_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to email logs" ON public.email_logs FOR SELECT USING (false);

-- Upsell events
CREATE TABLE public.upsell_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  source_product_id uuid REFERENCES public.products(id),
  suggested_product_id uuid REFERENCES public.products(id),
  event_type text NOT NULL DEFAULT 'impression',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.upsell_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage upsell events" ON public.upsell_events FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert upsell events" ON public.upsell_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Deny anon select on upsell" ON public.upsell_events FOR SELECT USING (false);

-- Indexes
CREATE INDEX idx_abandoned_carts_user ON public.abandoned_carts(user_id);
CREATE INDEX idx_abandoned_carts_activity ON public.abandoned_carts(last_activity_at) WHERE is_recovered = false;
CREATE INDEX idx_abandoned_carts_recovery_token ON public.abandoned_carts(recovery_token);
CREATE INDEX idx_cart_reminder_logs_cart ON public.cart_reminder_logs(abandoned_cart_id);
CREATE INDEX idx_email_logs_order ON public.email_logs(order_id);
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type, created_at);
CREATE INDEX idx_upsell_events_source ON public.upsell_events(source_product_id);
CREATE INDEX idx_upsell_events_type ON public.upsell_events(event_type, created_at);