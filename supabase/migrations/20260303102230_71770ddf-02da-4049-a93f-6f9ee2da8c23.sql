
-- Fix: drop existing wishlists policies then recreate
DROP POLICY IF EXISTS "Users can manage own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Admins can manage all wishlists" ON public.wishlists;

CREATE POLICY "Users can manage own wishlists" ON public.wishlists
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all wishlists" ON public.wishlists
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);
