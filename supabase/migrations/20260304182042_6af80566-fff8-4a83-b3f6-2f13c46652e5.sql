-- Performance indexes for BI analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_payment ON public.orders (created_at DESC, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_payment ON public.orders (user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON public.orders (shipping_country) WHERE payment_status = 'paid';
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON public.products (id, cost_price) WHERE cost_price IS NOT NULL;