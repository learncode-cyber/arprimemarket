-- Allow guest (anonymous/unauthenticated) inserts into orders where user_id IS NULL
CREATE POLICY "Allow guest order inserts"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Allow guest inserts into order_items for orders with no user_id
CREATE POLICY "Allow guest order item inserts"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id IS NULL
  )
);