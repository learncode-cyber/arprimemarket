
-- Fix TOCTOU vulnerability: Add trigger to prevent order ownership changes
CREATE OR REPLACE FUNCTION public.prevent_order_user_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change order ownership after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_order_ownership_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
  EXECUTE FUNCTION public.prevent_order_user_change();
