
-- Fix: Set products_public view to SECURITY INVOKER (safe default)
ALTER VIEW public.products_public SET (security_invoker = on);
