-- Enable realtime on supplier_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_orders;

-- Add processing metadata columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS auto_forwarded boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS forwarded_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS processing_errors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Create order processing alerts table
CREATE TABLE IF NOT EXISTS public.order_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  is_resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order alerts"
  ON public.order_alerts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
