-- Fix 1: Increase order number entropy (6 digits instead of 4)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.order_number := 'ARP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- Fix 2: Chat sessions - require auth for chat, add proper insert policy
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.chat_sessions;

CREATE POLICY "Users can manage own sessions"
ON public.chat_sessions FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all sessions"
ON public.chat_sessions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix chat_messages to require auth
DROP POLICY IF EXISTS "Session users can manage own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.chat_messages;

CREATE POLICY "Session users can manage own messages"
ON public.chat_messages FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM chat_sessions
  WHERE chat_sessions.id = chat_messages.session_id
  AND chat_sessions.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM chat_sessions
  WHERE chat_sessions.id = chat_messages.session_id
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all messages"
ON public.chat_messages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));