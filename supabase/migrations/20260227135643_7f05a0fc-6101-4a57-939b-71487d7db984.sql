-- Allow anon users to insert guest orders (user_id IS NULL)
CREATE POLICY "Allow anon guest order inserts"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow anon users to insert order items for guest orders
CREATE POLICY "Allow anon guest order item inserts"
  ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
  ));