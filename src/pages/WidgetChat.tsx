import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-chat`;

const WidgetChat = () => {
  const [searchParams] = useSearchParams();
  const widgetId = searchParams.get("id");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetId) return;
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("widget_configs" as any)
        .select("*")
        .eq("id", widgetId)
        .eq("is_active", true)
        .single();
      if (data) {
        setConfig(data);
        setMessages([{
          id: "welcome",
          content: (data as any).welcome_message || "Hi! How can I help you? 😊",
          role: "assistant",
        }]);
      }
    };
    fetchConfig();
  }, [widgetId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !widgetId) return;
    const content = input.trim();
    setInput("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), content, role: "user" };
    const currentMsgs = [...messages, userMsg];
    setMessages(currentMsgs);
    setLoading(true);

    try {
      const runWidgetRequest = async () => {
        const retryDelays = [0, 900, 1800];
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
              widget_id: widgetId,
              message: content,
              history: currentMsgs.filter(m => m.id !== "welcome").map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              })),
            }),
          });

          if (response.ok) return response;
          lastResponse = response;

          if (response.status !== 429 && response.status !== 503) {
            return response;
          }
        }

        return lastResponse;
      };

      const resp = await runWidgetRequest();

      if (!resp || !resp.ok) {
        let errorMsg = "Sorry, I couldn't process that. Please try again! 😊";
        try {
          if (resp) {
            const errData = await resp.json();
            if (errData.reply) errorMsg = errData.reply;
            else if (resp.status === 429 || resp.status === 503) errorMsg = "আমি এখন একটু ব্যস্ত, কিছুক্ষণ পর আবার চেষ্টা করুন! 😊";
            else if (resp.status === 402) errorMsg = "চ্যাট সার্ভিস সাময়িকভাবে বন্ধ আছে, পরে আবার চেষ্টা করুন। 📱";
          }
        } catch {}
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: errorMsg,
          role: "assistant",
        }]);
        setLoading(false);
        return;
      }

      // Handle streaming
      if (resp.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        const aiId = crypto.randomUUID();
        let aiContent = "";
        setMessages(prev => [...prev, { id: aiId, content: "", role: "assistant" }]);

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) {
                aiContent += c;
                setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: aiContent } : m));
              }
            } catch {}
          }
        }
      } else {
        const data = await resp.json();
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: data.reply || "Sorry, try again!",
          role: "assistant",
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: "Sorry, I couldn't process that. Please try again! 😊",
        role: "assistant",
      }]);
    }
    setLoading(false);
  };

  if (!widgetId) return <div className="p-4 text-center text-sm">Widget ID missing</div>;

  const color = config?.widget_color || "#6366f1";

  return (
    <div className="flex flex-col h-screen bg-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: color }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">AI</div>
        <div>
          <p className="text-white font-semibold text-sm">{config?.site_name || "AI Assistant"}</p>
          <p className="text-white/70 text-xs">Online • Ready to help</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: "#f9fafb" }}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                m.role === "user"
                  ? "text-white"
                  : "bg-white text-gray-800 shadow-sm border border-gray-100"
              }`}
              style={m.role === "user" ? { background: color } : undefined}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none [&_p]:m-0 [&_a]:underline" style={{ color: "#1f2937" }}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-gray-100">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-50"
            style={{ background: color }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-1">Powered by AR Prime AI</p>
      </div>
    </div>
  );
};

export default WidgetChat;
