
-- Allow anon users to insert payment transactions for guest orders
CREATE POLICY "Allow anon guest payment transaction inserts"
  ON public.payment_transactions
  FOR INSERT
  TO anon
  WITH CHECK (public.is_guest_order(order_id));
