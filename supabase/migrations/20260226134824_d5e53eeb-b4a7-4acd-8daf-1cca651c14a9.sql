
-- Blog Categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog categories" ON public.blog_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Blog Posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  image_url text,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'AR Prime Team',
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  read_time text DEFAULT '5 min',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Blog Comments
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved comments" ON public.blog_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Auth users can insert comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage comments" ON public.blog_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Help Categories
CREATE TABLE public.help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT 'HelpCircle',
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read help categories" ON public.help_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage help categories" ON public.help_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Help Articles
CREATE TABLE public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published articles" ON public.help_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage help articles" ON public.help_articles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- FAQ Categories
CREATE TABLE public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read faq categories" ON public.faq_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage faq categories" ON public.faq_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- FAQ Items
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active faqs" ON public.faq_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage faq items" ON public.faq_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat Sessions
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  visitor_name text DEFAULT 'Visitor',
  visitor_email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON public.chat_sessions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all sessions" ON public.chat_sessions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'user',
  sender_id uuid,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session users can manage own messages" ON public.chat_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all messages" ON public.chat_messages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Support Tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_number text NOT NULL UNIQUE,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Ticket Messages
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ticket messages" ON public.ticket_messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Ticket number generator
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();
