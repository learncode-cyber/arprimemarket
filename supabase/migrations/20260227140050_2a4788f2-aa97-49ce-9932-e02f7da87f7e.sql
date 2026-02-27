-- Security definer helper to validate guest order ownership without exposing orders table
CREATE OR REPLACE FUNCTION public.is_guest_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = _order_id
      AND o.user_id IS NULL
  )
$$;

-- Remove duplicate/old anon insert policies
DROP POLICY IF EXISTS "Allow guest order item inserts" ON public.order_items;
DROP POLICY IF EXISTS "Allow anon guest order item inserts" ON public.order_items;

-- Recreate anon order_items insert policy using security definer helper
CREATE POLICY "Allow anon guest order item inserts"
  ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (public.is_guest_order(order_id));