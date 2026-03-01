import { useState, useEffect, useRef, useCallback } from "react";
import { Send, History, ArrowLeft, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatOrderForm from "@/components/ChatOrderForm";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  content: string;
  sender_type: "user" | "agent";
  created_at: string;
  is_form?: boolean; // special flag for order form
}

interface ChatWidgetProps {
  embedded?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

// Keywords that trigger order form
const ORDER_HELP_KEYWORDS = [
  "order", "অর্ডার", "buy", "কিনতে", "checkout", "চেকআউট", "purchase", "কেনা",
  "problem ordering", "can't order", "order help", "how to order", "how to buy",
  "অর্ডার করতে পারছি না", "কিভাবে অর্ডার", "কিভাবে কিনবো", "অর্ডার দিতে চাই",
  "payment", "পেমেন্ট", "pay", "পে করতে", "কিনতে চাই", "order দিতে চাই",
];

export const ChatWidget = ({ embedded = false }: ChatWidgetProps) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { items: cartItems } = useCart();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getGuestId = () => {
    let guestId = localStorage.getItem("ar-pm-guest-chat-id");
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem("ar-pm-guest-chat-id", guestId);
    }
    return guestId;
  };

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
  }, [messages, showOrderForm]);

  // ─── ABANDONED CART DETECTION ───
  useEffect(() => {
    if (cartItems.length === 0) return;
    
    const abandonedTimer = setTimeout(() => {
      // If cart has items for 3 minutes without ordering, prompt
      const alreadyPrompted = sessionStorage.getItem("ar-cart-nudge");
      if (alreadyPrompted) return;
      
      sessionStorage.setItem("ar-cart-nudge", "1");
      const cartTotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
      const nudgeMsg: ChatMessage = {
        id: "cart-nudge-" + Date.now(),
        content: lang.code === "bn" 
          ? `🛒 আপনার কার্টে ${cartItems.length}টি আইটেম আছে (৳${Math.floor(cartTotal)})! অর্ডার করতে চান? আমি সাহায্য করতে পারি — শুধু বলুন! 😊`
          : `🛒 You have ${cartItems.length} item(s) in your cart (৳${Math.floor(cartTotal)})! Ready to order? I can help you checkout! 😊`,
        sender_type: "agent",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, nudgeMsg]);
    }, 180000); // 3 minutes
    
    return () => clearTimeout(abandonedTimer);
  }, [cartItems.length, lang.code]);

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
          return { ...s, preview: msgs?.[0]?.content?.slice(0, 60) || "No messages" };
        })
      );
      setPastSessions(sessionsWithPreview);
    }
    setLoadingHistory(false);
  }, [user]);

  const switchToSession = async (sid: string) => {
    setSessionId(sid);
    setShowHistory(false);
    setShowOrderForm(false);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at");
    setMessages((data as ChatMessage[]) ?? []);
  };

  const startNewSession = async () => {
    if (!user) return;
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
      setShowOrderForm(false);
    }
  };

  // Check if AI response suggests showing order form
  const shouldShowOrderForm = (aiResponse: string): boolean => {
    const triggers = ["[ORDER_FORM]", "[SHOW_FORM]", "order form", "fill up the form", "ফর্ম পূরণ"];
    return triggers.some(t => aiResponse.toLowerCase().includes(t.toLowerCase()));
  };

  const streamAIResponse = async (userContent: string, currentHistory: ChatMessage[]) => {
    setAiLoading(true);
    let assistantContent = "";
    const aiMsgId = crypto.randomUUID();

    setMessages(prev => [...prev, { id: aiMsgId, content: "", sender_type: "agent", created_at: new Date().toISOString() }]);

    try {
      const historyForAI = currentHistory.slice(-10).map(m => ({
        role: m.sender_type === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const runChatRequest = async () => {
        const retryDelays = [0, 2000, 4000, 6000];
        let lastResponse: Response | null = null;

        for (const delay of retryDelays) {
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

          const response = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              action: "chat",
              message: userContent,
              stream: true,
              context: { language: lang.code, languageName: lang.name, nativeLanguageName: lang.nativeName, history: historyForAI },
            }),
          });

          if (response.ok && response.body) return response;
          lastResponse = response;

          if (response.status !== 429 && response.status !== 503) {
            return response;
          }
        }

        return lastResponse;
      };

      const resp = await runChatRequest();

      if (!resp || !resp.ok || !resp.body) {
        // Try to parse error message from response
        let errorMsg = "Sorry, I couldn't process that right now. Try again or reach out on WhatsApp! 😊";
        try {
          if (resp) {
            const errData = await resp.json();
            if (errData.reply) errorMsg = errData.reply;
            else if (errData.error) {
              if (resp.status === 429 || resp.status === 503) errorMsg = "আমি এখন একটু ব্যস্ত, কিছুক্ষণ পর আবার চেষ্টা করুন! 😊";
              else if (resp.status === 402) errorMsg = "চ্যাট সার্ভিস সাময়িকভাবে বন্ধ আছে। WhatsApp-এ যোগাযোগ করুন! 📱";
            }
          }
        } catch {}

        assistantContent = errorMsg;
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: errorMsg } : m));
        setAiLoading(false);
        return;
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

      // Check if AI suggests order form
      if (shouldShowOrderForm(assistantContent)) {
        // Remove the [ORDER_FORM] tag from visible text
        const cleanContent = assistantContent.replace(/\[ORDER_FORM\]/gi, "").replace(/\[SHOW_FORM\]/gi, "").trim();
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId ? { ...m, content: cleanContent } : m)
        );
        assistantContent = cleanContent;
        setTimeout(() => setShowOrderForm(true), 500);
      }
    } catch {
      assistantContent = "Sorry, I couldn't process that right now. Try again or reach out on WhatsApp! 😊";
      setMessages(prev =>
        prev.map(m => m.id === aiMsgId ? { ...m, content: assistantContent } : m)
      );
    }

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

    // Check if user message contains order-related keywords
    const lowerContent = content.toLowerCase();
    const isOrderRelated = ORDER_HELP_KEYWORDS.some(kw => lowerContent.includes(kw.toLowerCase()));

    const currentMessages = [...messages, userMsg];
    await streamAIResponse(content, currentMessages);
  };

  const handleOrderComplete = (orderNum: string) => {
    // Build detailed order confirmation
    const orderItems = (() => {
      try {
        const cartCtx = document.querySelector('[data-cart-items]');
        return null; // Will use generic message
      } catch { return null; }
    })();

    const confirmMsg = `✅ **অর্ডার সফলভাবে প্লেস হয়েছে!** 🎉

🧾 **Order ID:** \`${orderNum}\`
📦 **Status:** Processing
💳 **Payment:** Pending verification
📧 **Confirmation:** আপনার ইমেইলে পাঠানো হয়েছে

🔍 অর্ডার ট্র্যাক করতে: [Track Order](/track-order)

কোনো সমস্যা হলে আমাকে জানান! 😊`;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      content: confirmMsg,
      sender_type: "agent",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);

    if (user && sessionId && !sessionId.startsWith("guest-")) {
      const insertMsg = async () => {
        try {
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            sender_type: "agent",
            content: msg.content,
          });
        } catch {}
      };
      insertMsg();
    }

    setTimeout(() => setShowOrderForm(false), 3000);
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
      {/* Top bar */}
      <div className="px-3 pt-2 flex items-center gap-1">
        {/* Quick order button */}
        <button
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10 font-medium"
        >
          <ShoppingCart className="w-3 h-3" />
          {showOrderForm ? "Close Form" : "Quick Order"}
        </button>

        <div className="ml-auto flex items-center gap-1">
          {/* New Chat button */}
          {user ? (
            <button
              onClick={startNewSession}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
            >
              <Send className="w-3 h-3" />
              New Chat
            </button>
          ) : (
            <button
              onClick={() => {
                setMessages([]);
                localStorage.removeItem("ar-pm-guest-chat-messages");
                setShowOrderForm(false);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
            >
              <Send className="w-3 h-3" />
              New Chat
            </button>
          )}

          {/* History button (logged-in users only) */}
          {user && (
            <button
              onClick={() => { setShowHistory(true); loadPastSessions(); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
            >
              <History className="w-3 h-3" />
              History
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {messages.length === 0 && !showOrderForm ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">👋 Hello! Our Support Team is here to help you. How can we assist you today?</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                m.sender_type === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
              }`}>
                {m.content ? (
                  m.sender_type === "agent" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_strong]:font-semibold">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-primary underline decoration-primary/40 underline-offset-2 font-semibold hover:decoration-primary transition-all hover:opacity-90"
                            >
                              {children} ↗
                            </a>
                          ),
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{m.content}</span>
                  )
                ) : (
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

        {/* Inline Order Form */}
        {showOrderForm && (
          <div className="bg-card border border-primary/20 rounded-xl p-2 shadow-sm">
            <ChatOrderForm
              onClose={() => setShowOrderForm(false)}
              onOrderComplete={handleOrderComplete}
            />
          </div>
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
