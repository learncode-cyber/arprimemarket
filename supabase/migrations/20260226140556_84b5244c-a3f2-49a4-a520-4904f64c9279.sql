
-- AI Assistant scan results table
CREATE TABLE public.ai_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type text NOT NULL DEFAULT 'full',
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text NOT NULL,
  suggestion text,
  auto_fix_available boolean NOT NULL DEFAULT false,
  auto_fix_query text,
  status text NOT NULL DEFAULT 'pending',
  applied_at timestamp with time zone,
  applied_by uuid,
  dismissed_at timestamp with time zone,
  dismissed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI Assistant activity log
CREATE TABLE public.ai_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details text,
  scan_result_id uuid REFERENCES public.ai_scan_results(id) ON DELETE SET NULL,
  performed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access
CREATE POLICY "Admins can manage scan results" ON public.ai_scan_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage activity log" ON public.ai_activity_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
