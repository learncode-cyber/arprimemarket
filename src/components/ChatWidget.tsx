import { useState, useEffect, useRef, useCallback } from "react";
import { Send, History, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  content: string;
  sender_type: "user" | "agent";
  created_at: string;
}

interface ChatWidgetProps {
  embedded?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export const ChatWidget = ({ embedded = false }: ChatWidgetProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getGuestId = () => {
    let guestId = localStorage.getItem("ar-pm-guest-chat-id");
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem("ar-pm-guest-chat-id", guestId);
    }
    return guestId;
  };

  // Load guest messages from localStorage
  const getGuestMessages = (): ChatMessage[] => {
    try {
      const stored = localStorage.getItem("ar-pm-guest-chat-messages");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const saveGuestMessages = (msgs: ChatMessage[]) => {
    localStorage.setItem("ar-pm-guest-chat-messages", JSON.stringify(msgs.slice(-100)));
  };

  useEffect(() => {
    if (!embedded) return;
    const initSession = async () => {
      if (user) {
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
      } else {
        setSessionId("guest-" + getGuestId());
        setMessages(getGuestMessages());
      }
    };
    initSession();
  }, [user, embedded]);

  // Load messages for authenticated session
  useEffect(() => {
    if (!sessionId || sessionId.startsWith("guest-")) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at");
      setMessages((data as ChatMessage[]) ?? []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === (payload.new as any).id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load past sessions for history view
  const loadPastSessions = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("id, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (sessions) {
      const sessionsWithPreview = await Promise.all(
        sessions.map(async (s) => {
          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("content, sender_type")
            .eq("session_id", s.id)
            .order("created_at")
            .limit(1);
          return {
            ...s,
            preview: msgs?.[0]?.content?.slice(0, 60) || "No messages",
            messageCount: 0,
          };
        })
      );
      setPastSessions(sessionsWithPreview);
    }
    setLoadingHistory(false);
  }, [user]);

  const switchToSession = async (sid: string) => {
    setSessionId(sid);
    setShowHistory(false);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at");
    setMessages((data as ChatMessage[]) ?? []);
  };

  const startNewSession = async () => {
    if (!user) return;
    // Close current session
    if (sessionId && !sessionId.startsWith("guest-")) {
      await supabase.from("chat_sessions").update({ status: "closed" }).eq("id", sessionId);
    }
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, visitor_name: user.user_metadata?.full_name || "User" })
      .select("id")
      .single();
    if (newSession) {
      setSessionId(newSession.id);
      setMessages([]);
      setShowHistory(false);
    }
  };

  // Streaming AI response
  const streamAIResponse = async (userContent: string, currentHistory: ChatMessage[]) => {
    setAiLoading(true);
    let assistantContent = "";
    const aiMsgId = crypto.randomUUID();

    // Add placeholder AI message
    setMessages(prev => [...prev, { id: aiMsgId, content: "", sender_type: "agent", created_at: new Date().toISOString() }]);

    try {
      const historyForAI = currentHistory.slice(-10).map(m => ({
        role: m.sender_type === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "chat",
          message: userContent,
          stream: true,
          context: { language: navigator.language || "en", history: historyForAI },
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Stream failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m => m.id === aiMsgId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      assistantContent = "Sorry, I couldn't process that right now. Try again or reach out on WhatsApp! 😊";
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId ? { ...m, content: assistantContent } : m)
      );
    }

    // Save AI reply to DB or localStorage
    if (user && sessionId && !sessionId.startsWith("guest-")) {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        sender_type: "agent",
        content: assistantContent,
      });
    } else {
      saveGuestMessages([...currentHistory, 
        { id: crypto.randomUUID(), content: userContent, sender_type: "user", created_at: new Date().toISOString() },
        { id: aiMsgId, content: assistantContent, sender_type: "agent", created_at: new Date().toISOString() }
      ]);
    }

    setAiLoading(false);
  };

  const handleSend = async () => {
    if (!message.trim() || !sessionId || sending || aiLoading) return;
    setSending(true);
    const content = message.trim();
    setMessage("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), content, sender_type: "user", created_at: new Date().toISOString() };

    if (user && !sessionId.startsWith("guest-")) {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        sender_type: "user",
        sender_id: user.id,
        content,
      });
    } else {
      setMessages(prev => [...prev, userMsg]);
    }

    setSending(false);

    // Stream AI response
    const currentMessages = [...messages, userMsg];
    await streamAIResponse(content, currentMessages);
  };

  if (!embedded) return null;

  // History view
  if (showHistory) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">Chat History</span>
          {user && (
            <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={startNewSession}>
              New Chat
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingHistory ? (
            <div className="text-center py-8">
              <span className="text-sm text-muted-foreground animate-pulse">Loading history...</span>
            </div>
          ) : pastSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No past conversations yet</p>
            </div>
          ) : (
            pastSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => switchToSession(s.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  s.id === sessionId 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-secondary/50 border-border hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {new Date(s.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    s.status === "active" ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                  }`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.preview}</p>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-full">
      {/* History button bar */}
      {user && (
        <div className="px-3 pt-2 flex justify-end">
          <button
            onClick={() => { setShowHistory(true); loadPastSessions(); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
          >
            <History className="w-3 h-3" />
            History
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">👋 Hello! Our Support Team is here to help you. How can we assist you today?</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                m.sender_type === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
              }`}>
                {m.content || (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
                {m.content && (
                  <p className={`text-[9px] mt-0.5 ${m.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="text-sm h-9"
        />
        <Button size="sm" onClick={handleSend} disabled={!message.trim() || sending || aiLoading} className="h-9 px-3">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
