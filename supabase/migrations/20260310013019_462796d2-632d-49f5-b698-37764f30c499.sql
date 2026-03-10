
-- Drop and recreate all triggers safely

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
DROP TRIGGER IF EXISTS set_tracking_id ON public.orders;
DROP TRIGGER IF EXISTS set_return_number ON public.return_requests;
DROP TRIGGER IF EXISTS set_ticket_number ON public.support_tickets;
DROP TRIGGER IF EXISTS set_affiliate_code ON public.affiliates;
DROP TRIGGER IF EXISTS prevent_order_user_change ON public.orders;
DROP TRIGGER IF EXISTS validate_order_item_price ON public.order_items;

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();
CREATE TRIGGER set_tracking_id BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_id();
CREATE TRIGGER set_return_number BEFORE INSERT ON public.return_requests FOR EACH ROW EXECUTE FUNCTION public.generate_return_number();
CREATE TRIGGER set_ticket_number BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();
CREATE TRIGGER set_affiliate_code BEFORE INSERT ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.generate_affiliate_code();
CREATE TRIGGER prevent_order_user_change BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.prevent_order_user_change();
CREATE TRIGGER validate_order_item_price BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_price();
