-- Warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  city text,
  country text DEFAULT 'Bangladesh',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage warehouses"
  ON public.warehouses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active warehouses"
  ON public.warehouses FOR SELECT
  USING (is_active = true);

-- Warehouse stock (product stock per warehouse)
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  reserved_quantity integer NOT NULL DEFAULT 0,
  reorder_level integer DEFAULT 5,
  bin_location text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, product_id)
);

ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage warehouse stock"
  ON public.warehouse_stock FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read warehouse stock"
  ON public.warehouse_stock FOR SELECT
  USING (true);

-- Stock adjustment history
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  adjustment_type text NOT NULL DEFAULT 'manual',
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL DEFAULT 0,
  new_quantity integer NOT NULL DEFAULT 0,
  reason text,
  adjusted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stock adjustments"
  ON public.stock_adjustments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for warehouse_stock
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_stock;
