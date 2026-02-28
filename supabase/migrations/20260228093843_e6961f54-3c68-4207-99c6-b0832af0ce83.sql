
-- AI Learning Log: stores mistakes, corrections, and lessons learned
CREATE TABLE public.ai_learning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_type text NOT NULL DEFAULT 'correction', -- correction, feedback, insight, marketing_update
  trigger_message text, -- what the user said
  wrong_response text, -- what AI said wrong
  correct_response text, -- what it should have said
  lesson text NOT NULL, -- the lesson learned
  category text NOT NULL DEFAULT 'general', -- sales, support, product, marketing
  confidence_score numeric DEFAULT 0.5, -- how confident this lesson is (0-1)
  times_applied integer DEFAULT 0, -- how many times this lesson was used
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Marketing Strategies: auto-updating marketing tactics
CREATE TABLE public.ai_marketing_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name text NOT NULL,
  strategy_type text NOT NULL DEFAULT 'sales_tactic', -- sales_tactic, engagement, upsell, retention
  description text NOT NULL,
  effectiveness_score numeric DEFAULT 0.5, -- 0-1 score
  times_used integer DEFAULT 0,
  times_converted integer DEFAULT 0,
  is_active boolean DEFAULT true,
  last_reviewed_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Knowledge Updates: tracks when knowledge was refreshed
CREATE TABLE public.ai_knowledge_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_type text NOT NULL DEFAULT 'product_sync', -- product_sync, faq_sync, strategy_refresh, self_improvement
  summary text,
  items_updated integer DEFAULT 0,
  triggered_by text DEFAULT 'auto', -- auto, manual, schedule
  status text DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_learning_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_updates ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage ai_learning_log" ON public.ai_learning_log FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to ai_learning_log" ON public.ai_learning_log FOR SELECT USING (false);

CREATE POLICY "Admins can manage ai_marketing_strategies" ON public.ai_marketing_strategies FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to ai_marketing_strategies" ON public.ai_marketing_strategies FOR SELECT USING (false);

CREATE POLICY "Admins can manage ai_knowledge_updates" ON public.ai_knowledge_updates FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deny anon access to ai_knowledge_updates" ON public.ai_knowledge_updates FOR SELECT USING (false);

-- Seed initial marketing strategies
INSERT INTO public.ai_marketing_strategies (strategy_name, strategy_type, description, effectiveness_score) VALUES
('Scarcity Alert', 'sales_tactic', 'Highlight low stock items: "মাত্র X টা বাকি!" to create urgency', 0.8),
('Social Proof', 'sales_tactic', 'Mention bestseller status and ratings to build trust', 0.75),
('Bundle Upsell', 'upsell', 'Suggest complementary products: "এটার সাথে এটাও নিলে combo save হবে"', 0.7),
('Free Shipping Hook', 'engagement', 'If close to free shipping threshold, mention how much more needed', 0.85),
('First-Time Discount', 'retention', 'Offer special welcome discount for new customers', 0.65),
('Empathy First', 'support', 'For frustrated customers: empathize first, solve next, ZERO selling', 0.9),
('Quick Order Push', 'sales_tactic', 'When buying intent is clear, immediately show order form', 0.88),
('Personalized Recommendation', 'sales_tactic', 'Recommend based on browsing history and preferences', 0.72);
