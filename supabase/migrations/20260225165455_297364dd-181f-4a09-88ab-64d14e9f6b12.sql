
-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_type TEXT NOT NULL DEFAULT 'manual',
  api_url TEXT,
  api_key_name TEXT,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_sync BOOLEAN NOT NULL DEFAULT false,
  sync_interval_hours INTEGER NOT NULL DEFAULT 24,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  markup_percentage NUMERIC NOT NULL DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier products mapping (links supplier items to local products)
CREATE TABLE public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  external_url TEXT,
  external_title TEXT NOT NULL,
  external_price NUMERIC NOT NULL DEFAULT 0,
  external_stock INTEGER NOT NULL DEFAULT 0,
  external_image_url TEXT,
  is_imported BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier orders (forwarded orders to suppliers)
CREATE TABLE public.supplier_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  external_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  shipping_carrier TEXT,
  notes TEXT,
  forwarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can manage
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage supplier products" ON public.supplier_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage supplier orders" ON public.supplier_orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
