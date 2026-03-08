import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Minus, Maximize2, Loader2, RefreshCw, Paperclip, ImageIcon, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";

interface Attachment {
  name: string;
  type: string;
  base64: string;
  preview?: string;
}

interface ParsedAction {
  tool: string;
  description: string;
  params: Record<string, any>;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  attachments?: Attachment[];
  actions?: ParsedAction[];
  actionResults?: Record<string, { status: "pending" | "loading" | "done" | "error"; message?: string }>;
}

interface Alert {
  type: "critical" | "warning" | "info";
  message: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const QUICK_ACTIONS = [
  { icon: "📊", label: "Daily Summary", prompt: "আজকের ডেইলি সামারি দাও — অর্ডার, সেলস, টিকেট, ইনভেন্টরি সব কিছু।" },
  { icon: "📦", label: "Pending Orders", prompt: "পেন্ডিং অর্ডার গুলো দেখাও এবং কোনটা urgent সেটা বলো।" },
  { icon: "🔒", label: "Security Check", prompt: "সিকিউরিটি স্ক্যান রেজাল্ট দেখাও এবং critical issues আছে কিনা বলো।" },
  { icon: "💻", label: "Code Help", prompt: "আমি কোডে একটা পরিবর্তন করতে চাই — সাহায্য করো।" },
  { icon: "🚀", label: "Deploy Guide", prompt: "এই সাইটটা অন্য হোস্টিং-এ মুভ করতে কি কি করতে হবে step by step বলো।" },
  { icon: "📈", label: "Analytics", prompt: "আজকের সেলস পারফরম্যান্স, কনভার্সন রেট এবং কান্ট্রি-ওয়াইজ ডেটা দেখাও।" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOC_TYPES = ["text/csv", "application/json", "text/plain", "text/html"];

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data URI prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const AdminARChat = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", content: "👋 আমি **Admin AR** — আপনার Senior Dev Assistant।\n\nকোড, ডিপ্লয়মেন্ট, অর্ডার মনিটরিং, পারফরম্যান্স, হোস্টিং — যেকোনো কিছু জিজ্ঞেস করুন!\n\n📎 **নতুন:** স্ক্রিনশট বা ফাইল আপলোড করতে পারেন — আমি দেখে সমস্যা সমাধান দেব!\n\n💡 Quick actions থেকে সহজে শুরু করতে পারেন।", role: "assistant" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const alertsFetched = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const processFiles = async (files: FileList | File[]) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        continue; // silently skip too-large files
      }
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isDoc = ALLOWED_DOC_TYPES.includes(file.type);
      if (!isImage && !isDoc) continue;

      const base64 = await fileToBase64(file);
      newAttachments.push({
        name: file.name,
        type: file.type,
        base64,
        preview: isImage ? `data:${file.type};base64,${base64}` : undefined,
      });
    }
    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Proactive alerts on first open
  const fetchAlerts = useCallback(async () => {
    if (alertsFetched.current) return;
    alertsFetched.current = true;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { count: pendingOrders } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
      const { count: openTickets } = await supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]);
      const { count: criticalFindings } = await supabase.from("ai_scan_results").select("id", { count: "exact", head: true }).eq("severity", "critical").eq("status", "pending");

      const newAlerts: Alert[] = [];
      if (pendingOrders && pendingOrders > 5) newAlerts.push({ type: "warning", message: `⚠️ ${pendingOrders}টি পেন্ডিং অর্ডার আছে — প্রসেস করুন!` });
      if (openTickets && openTickets > 10) newAlerts.push({ type: "warning", message: `🎫 ${openTickets}টি আনসলভড সাপোর্ট টিকেট` });
      if (criticalFindings && criticalFindings > 0) newAlerts.push({ type: "critical", message: `🚨 ${criticalFindings}টি ক্রিটিক্যাল সমস্যা পাওয়া গেছে` });

      if (newAlerts.length > 0) {
        setHasNotification(true);
        const alertMsg = `🔔 **Proactive Alerts:**\n\n${newAlerts.map(a => `${a.type === "critical" ? "🔴" : "🟡"} ${a.message}`).join("\n")}\n\nবিস্তারিত জানতে আমাকে জিজ্ঞেস করুন!`;
        setMessages(prev => [...prev, { id: "alerts-" + Date.now(), content: alertMsg, role: "assistant" }]);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (open && !alertsFetched.current) fetchAlerts();
  }, [open, fetchAlerts]);

  // Background notification check
  useEffect(() => {
    const checkNotifications = async () => {
      if (open) return;
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const { count: pendingOrders } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
        if (pendingOrders && pendingOrders > 3) setHasNotification(true);
      } catch { /* silent */ }
    };
    const interval = setInterval(checkNotifications, 120000);
    checkNotifications();
    return () => clearInterval(interval);
  }, [open]);

  const sendMessage = async (overrideContent?: string) => {
    const content = (overrideContent || input).trim();
    if ((!content && attachments.length === 0) || loading) return;
    if (!overrideContent) setInput("");

    const currentAttachments = [...attachments];
    setAttachments([]);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      content: content || (currentAttachments.length > 0 ? `📎 ${currentAttachments.map(a => a.name).join(", ")}` : ""),
      role: "user",
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };
    const currentMsgs = [...messages, userMsg];
    setMessages(currentMsgs);
    setLoading(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), content: "⚠️ Admin session required. Please log in.", role: "assistant" }]);
        setLoading(false);
        return;
      }

      // Build multimodal message content
      let messagePayload: any = content;
      if (currentAttachments.length > 0) {
        // For multimodal: send images as base64 in a structured format
        const imageDescriptions = currentAttachments.map(a => {
          if (a.type.startsWith("image/")) {
            return `[Attached image: ${a.name}]`;
          }
          // For text files, decode and include content
          try {
            const decoded = atob(a.base64);
            return `[File: ${a.name}]\n\`\`\`\n${decoded.slice(0, 5000)}\n\`\`\``;
          } catch {
            return `[Attached file: ${a.name}]`;
          }
        });
        messagePayload = `${content}\n\n${imageDescriptions.join("\n\n")}`;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "admin_ar_chat",
          message: messagePayload,
          history: currentMsgs.filter(m => m.id !== "welcome" && !m.id.startsWith("alerts-")).map(m => ({ role: m.role, content: m.content })),
          attachments: currentAttachments.filter(a => a.type.startsWith("image/")).map(a => ({
            type: a.type,
            base64: a.base64,
          })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        setMessages(prev => [...prev, { id: crypto.randomUUID(), content: errData.error || "Request failed. Try again.", role: "assistant" }]);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      const rawReply = data.reply || "No response.";
      
      // Parse action blocks from AI response
      const actionRegex = /<!--ACTION:(.*?)-->/g;
      const actions: ParsedAction[] = [];
      let match;
      while ((match = actionRegex.exec(rawReply)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          actions.push(parsed);
        } catch {}
      }
      const cleanContent = rawReply.replace(/<!--ACTION:.*?-->/g, "").trim();
      
      const actionResults: Record<string, { status: "pending" | "loading" | "done" | "error"; message?: string }> = {};
      actions.forEach((a, i) => { actionResults[`${a.tool}_${i}`] = { status: "pending" }; });

      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        content: cleanContent, 
        role: "assistant",
        actions: actions.length > 0 ? actions : undefined,
        actionResults: actions.length > 0 ? actionResults : undefined,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), content: "Connection error. Please try again.", role: "assistant" }]);
    }
    setLoading(false);
  };

  const executeAction = async (messageId: string, action: ParsedAction, actionKey: string) => {
    // Set loading
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return { ...m, actionResults: { ...m.actionResults, [actionKey]: { status: "loading" as const } } };
    }));

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "execute_action",
          tool: action.tool,
          params: action.params,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Action failed");

      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return { ...m, actionResults: { ...m.actionResults, [actionKey]: { status: "done" as const, message: data.message } } };
      }));
    } catch (err: any) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        return { ...m, actionResults: { ...m.actionResults, [actionKey]: { status: "error" as const, message: err.message } } };
      }));
    }
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
          minimized ? "bottom-6 right-6 w-72 h-14" : "bottom-6 right-6 w-[420px] h-[600px]"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">AR</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Admin AR</p>
            <p className="text-[10px] opacity-70">Senior Dev • Multimodal AI • Online</p>
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
            {/* Quick Actions */}
            <div className="px-2 py-2 border-b border-border flex gap-1 shrink-0 overflow-x-auto scrollbar-none">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => sendMessage(qa.prompt)}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  {qa.icon} {qa.label}
                </button>
              ))}
              <button
                onClick={() => { alertsFetched.current = false; fetchAlerts(); }}
                className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 whitespace-nowrap transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">Drop files here</p>
                  <p className="text-[10px] text-muted-foreground">Images, CSV, JSON, TXT</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : m.id.startsWith("alerts-")
                        ? "bg-destructive/10 text-foreground border border-destructive/20 rounded-bl-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                  }`}>
                    {/* Show image attachments */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex gap-1.5 mb-2 flex-wrap">
                        {m.attachments.map((a, i) => (
                          a.preview ? (
                            <img key={i} src={a.preview} alt={a.name} className="w-16 h-16 rounded-lg object-cover border border-primary-foreground/20" />
                          ) : (
                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-primary-foreground/10 rounded-lg text-[10px]">
                              <FileText className="w-3 h-3" /> {a.name}
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0 [&_code]:text-xs [&_pre]:text-xs [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:overflow-x-auto">
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

            {/* Attachment preview bar */}
            {attachments.length > 0 && (
              <div className="px-3 py-2 border-t border-border bg-muted/30 flex gap-2 overflow-x-auto scrollbar-none">
                {attachments.map((a, i) => (
                  <div key={i} className="relative shrink-0 group">
                    {a.preview ? (
                      <img src={a.preview} alt={a.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-border bg-card flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <p className="text-[8px] text-muted-foreground text-center mt-0.5 truncate w-12">{a.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-card shrink-0">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2 items-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*,.csv,.json,.txt,.html"
                  onChange={e => {
                    if (e.target.files) processFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
                  title="Attach file or screenshot"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask anything or drop a screenshot..."
                  className="text-sm h-9"
                  disabled={loading}
                />
                <Button type="submit" size="sm" disabled={loading || (!input.trim() && attachments.length === 0)} className="h-9 px-3">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
              <p className="text-center text-[9px] text-muted-foreground mt-1">📎 Images & files supported • Powered by AR Prime AI</p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminARChat;
