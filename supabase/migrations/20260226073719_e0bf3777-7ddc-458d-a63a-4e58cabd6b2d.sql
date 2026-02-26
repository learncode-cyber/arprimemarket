
-- Sync log table for tracking all supplier operations
CREATE TABLE public.supplier_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL DEFAULT 'sync_stock',
  status text NOT NULL DEFAULT 'running',
  items_processed integer NOT NULL DEFAULT 0,
  items_failed integer NOT NULL DEFAULT 0,
  error_details jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync logs"
  ON public.supplier_sync_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add API key secret name to suppliers for secure key storage
ALTER TABLE public.suppliers 
  ADD COLUMN IF NOT EXISTS api_key_secret text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS webhook_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_forward_orders boolean DEFAULT false;

-- Add variations/images support to supplier_products
ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS external_images text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS external_variants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS external_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_category text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS import_errors jsonb DEFAULT NULL;
