
-- Add tracking_token to orders for secure guest order tracking
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tracking_token text DEFAULT encode(gen_random_bytes(32), 'hex');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders(tracking_token) WHERE tracking_token IS NOT NULL;

-- Secure function to look up guest orders by order_number + tracking_token
CREATE OR REPLACE FUNCTION public.get_guest_order(
  _order_number text,
  _tracking_token text
)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number
    AND tracking_token = _tracking_token
    AND user_id IS NULL
    AND created_at > NOW() - INTERVAL '180 days';
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_order TO anon, authenticated;

-- Also create a function to verify by order_number + email (fallback)
CREATE OR REPLACE FUNCTION public.verify_guest_order(
  _order_number text,
  _email text
)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE order_number = _order_number
    AND LOWER(shipping_email) = LOWER(_email)
    AND user_id IS NULL
    AND created_at > NOW() - INTERVAL '180 days';
$$;

GRANT EXECUTE ON FUNCTION public.verify_guest_order TO anon, authenticated;
