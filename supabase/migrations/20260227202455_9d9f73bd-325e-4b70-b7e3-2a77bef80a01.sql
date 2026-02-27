
-- Remove the permissive authenticated SELECT policy that exposes wallet_address
DROP POLICY IF EXISTS "Authenticated read active payment methods" ON public.payment_methods;

-- Only admins can SELECT from the base table (wallet_address, deposit_link protected)
-- The existing "Admins can manage payment methods" ALL policy already covers admin SELECT,
-- but let's keep "Deny anon access" as-is (already exists).
