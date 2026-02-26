import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatWidgetProps {
  embedded?: boolean;
}

export const ChatWidget = ({ embedded = false }: ChatWidgetProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;

    const initSession = async () => {
      const { data: existing } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setSessionId(existing.id);
      } else {
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, visitor_name: user.user_metadata?.full_name || "User" })
          .select("id")
          .single();
        if (newSession) setSessionId(newSession.id);
      }
    };
    initSession();
  }, [open, user]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at");
      setMessages(data ?? []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !sessionId || !user || sending) return;
    setSending(true);
    const content = message.trim();
    setMessage("");
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "user",
      sender_id: user.id,
      content,
    });
    setSending(false);
  };

  // If embedded, just render the chat content without the floating wrapper
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
          {!user ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">Please sign in to chat</p>
              <a href="/login" className="text-primary text-sm font-medium">Sign In →</a>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">👋 Hi! How can we help?</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  m.sender_type === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                }`}>
                  {m.content}
                  <p className={`text-[9px] mt-0.5 ${m.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        {user && (
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="text-sm h-9"
            />
            <Button size="sm" onClick={handleSend} disabled={!message.trim() || sending} className="h-9 px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Original floating widget (kept for backwards compatibility but not used in Layout anymore)
  return null;
};
