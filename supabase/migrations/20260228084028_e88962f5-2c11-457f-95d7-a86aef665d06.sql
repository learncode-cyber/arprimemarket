
-- Widget configurations for portable AI chatbot
CREATE TABLE public.widget_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  site_name text NOT NULL DEFAULT '',
  site_url text NOT NULL DEFAULT '',
  widget_color text NOT NULL DEFAULT '#6366f1',
  widget_position text NOT NULL DEFAULT 'bottom-right',
  welcome_message text NOT NULL DEFAULT 'Hi! How can I help you today?',
  ai_persona text NOT NULL DEFAULT 'helpful sales assistant',
  is_active boolean NOT NULL DEFAULT true,
  scraped_data jsonb DEFAULT '{}',
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own widgets" ON public.widget_configs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all widgets" ON public.widget_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read for widget rendering (by ID only)
CREATE POLICY "Anyone can read active widgets" ON public.widget_configs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
