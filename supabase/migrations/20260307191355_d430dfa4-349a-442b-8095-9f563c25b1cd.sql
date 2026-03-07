
-- 1. API Keys table (hashed keys, never plaintext)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  label text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT 'admin',
  permissions text[] NOT NULL DEFAULT '{"ai","webhooks","orders","products","blog"}'::text[],
  rate_limit_per_minute int NOT NULL DEFAULT 60,
  rate_limit_per_day int NOT NULL DEFAULT 1000,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage api_keys" ON public.api_keys FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access api_keys" ON public.api_keys FOR SELECT USING (false);

-- 2. API Call Logs
CREATE TABLE public.api_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  source text NOT NULL DEFAULT 'external',
  tokens_used int NOT NULL DEFAULT 0,
  status_code int NOT NULL DEFAULT 200,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage api_call_logs" ON public.api_call_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access api_call_logs" ON public.api_call_logs FOR SELECT USING (false);

-- 3. Webhooks
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}'::text[],
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  retry_count int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage webhooks" ON public.webhooks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access webhooks" ON public.webhooks FOR SELECT USING (false);

-- 4. Webhook Delivery Logs
CREATE TABLE public.webhook_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_code int,
  response_body text,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage webhook_delivery_logs" ON public.webhook_delivery_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access webhook_delivery_logs" ON public.webhook_delivery_logs FOR SELECT USING (false);

-- 5. AI Engine Logs
CREATE TABLE public.ai_engine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine text NOT NULL DEFAULT 'lovable-gemini',
  model text,
  tokens_input int NOT NULL DEFAULT 0,
  tokens_output int NOT NULL DEFAULT 0,
  latency_ms int NOT NULL DEFAULT 0,
  fallback_triggered boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'internal',
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_engine_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ai_engine_logs" ON public.ai_engine_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Deny anon access ai_engine_logs" ON public.ai_engine_logs FOR SELECT USING (false);
