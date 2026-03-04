
-- Return requests table
CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text NOT NULL,
  details text,
  product_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  refund_type text NOT NULL DEFAULT 'full',
  refund_amount numeric NOT NULL DEFAULT 0,
  admin_notes text,
  restock_items boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Auto-generate return number
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.return_number := 'RET-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_return_number
  BEFORE INSERT ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_return_number();

-- Prevent duplicate pending returns per order
CREATE UNIQUE INDEX idx_unique_pending_return ON public.return_requests(order_id)
  WHERE status IN ('pending', 'approved');

-- Performance indexes
CREATE INDEX idx_return_requests_user ON public.return_requests(user_id);
CREATE INDEX idx_return_requests_status ON public.return_requests(status);
CREATE INDEX idx_return_requests_order ON public.return_requests(order_id);

-- RLS
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own returns"
  ON public.return_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own returns"
  ON public.return_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all returns"
  ON public.return_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anon access to returns"
  ON public.return_requests FOR SELECT
  USING (false);
