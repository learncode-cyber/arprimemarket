
-- Fix #3: Restrict payment_methods base table - remove public read, add deny anon
DROP POLICY IF EXISTS "Anyone can read active payment methods" ON public.payment_methods;

CREATE POLICY "Deny anon select on payment_methods"
  ON public.payment_methods FOR SELECT TO anon
  USING (false);

CREATE POLICY "Authenticated read active payment methods"
  ON public.payment_methods FOR SELECT TO authenticated
  USING (
    is_active = true 
    OR has_role(auth.uid(), 'admin'::app_role)
  );
