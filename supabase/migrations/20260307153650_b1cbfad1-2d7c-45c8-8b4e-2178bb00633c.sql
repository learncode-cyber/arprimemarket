
-- Add RLS policies to existing wishlists table (if not already set)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Users can manage own wishlist') THEN
    CREATE POLICY "Users can manage own wishlist" ON public.wishlists
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Admins can manage all wishlists') THEN
    CREATE POLICY "Admins can manage all wishlists" ON public.wishlists
      FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Deny anon access to wishlists') THEN
    CREATE POLICY "Deny anon access to wishlists" ON public.wishlists
      FOR SELECT TO anon USING (false);
  END IF;
END $$;
