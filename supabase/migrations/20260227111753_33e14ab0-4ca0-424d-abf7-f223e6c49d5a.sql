
-- 1. Create a public view for payment_methods that hides wallet_address and deposit_link
CREATE OR REPLACE VIEW public.payment_methods_public AS
SELECT id, display_name, display_name_bn, display_name_ar, method_key, method_type,
       icon_name, instructions, instructions_bn, instructions_ar, sort_order, is_active, network
FROM public.payment_methods
WHERE is_active = true;

-- 2. Add a trigger to validate order item prices match product prices
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  actual_price numeric;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT price INTO actual_price FROM public.products WHERE id = NEW.product_id AND is_active = true;
    IF actual_price IS NULL THEN
      RAISE EXCEPTION 'Product not found or inactive';
    END IF;
    IF NEW.price <> actual_price THEN
      RAISE EXCEPTION 'Price mismatch: submitted % but actual is %', NEW.price, actual_price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_item_price_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_item_price();
