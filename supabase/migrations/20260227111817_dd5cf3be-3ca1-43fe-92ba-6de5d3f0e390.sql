
-- Fix: Change view to SECURITY INVOKER (default, safe)
DROP VIEW IF EXISTS public.payment_methods_public;
CREATE VIEW public.payment_methods_public
WITH (security_invoker = true)
AS
SELECT id, display_name, display_name_bn, display_name_ar, method_key, method_type,
       icon_name, instructions, instructions_bn, instructions_ar, sort_order, is_active, network
FROM public.payment_methods
WHERE is_active = true;
