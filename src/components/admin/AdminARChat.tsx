import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Minus, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const AdminARChat = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", content: "👋 আমি **Admin AR** — আপনার Senior Dev Assistant।\n\nকোড, ডিপ্লয়মেন্ট, অর্ডার মনিটরিং, পারফরম্যান্স — যেকোনো কিছু জিজ্ঞেস করুন!", role: "assistant" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), content, role: "user" };
    const currentMsgs = [...messages, userMsg];
    setMessages(currentMsgs);
    setLoading(true);

    try {
      const token = (await import("@/integrations/supabase/client")).supabase;
      const { data: { session } } = await token.auth.getSession();

      if (!session?.access_token) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), content: "⚠️ Admin session required. Please log in.", role: "assistant" }]);
        setLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "admin_ar_chat",
          message: content,
          history: currentMsgs.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        setMessages(prev => [...prev, { id: crypto.randomUUID(), content: errData.error || "Request failed. Try again.", role: "assistant" }]);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), content: data.reply || "No response.", role: "assistant" }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), content: "Connection error. Please try again.", role: "assistant" }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <motion.button
        onClick={() => { setOpen(true); setHasNotification(false); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="w-6 h-6" />
        {hasNotification && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
        )}
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
          minimized ? "bottom-6 right-6 w-72 h-14" : "bottom-6 right-6 w-96 h-[520px]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">AR</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Admin AR</p>
            <p className="text-[10px] opacity-70">Senior Dev Assistant • Online</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(!minimized)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
              {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0 [&_code]:text-xs [&_pre]:text-xs [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded-lg">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary px-3 py-2 rounded-xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card shrink-0">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Admin AR anything..."
                  className="text-sm h-9"
                  disabled={loading}
                />
                <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-9 px-3">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
              <p className="text-center text-[9px] text-muted-foreground mt-1">Powered by AR Prime AI</p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminARChat;
