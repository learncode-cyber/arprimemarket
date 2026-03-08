
-- Auto-generate tracking ID on new orders
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := 'ARP-TRK-' || UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER trg_generate_tracking_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tracking_id();
