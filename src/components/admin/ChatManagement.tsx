import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";

const ChatManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: sessions } = useQuery({
    queryKey: ["admin-chat-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_sessions").select("*").order("updated_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!selectedSession) return;
    const fetch = async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("session_id", selectedSession).order("created_at");
      setMessages(data ?? []);
    };
    fetch();

    const channel = supabase
      .channel(`admin-chat-${selectedSession}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${selectedSession}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedSession]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession || !user) return;
    const content = reply.trim();
    setReply("");
    await supabase.from("chat_messages").insert({
      session_id: selectedSession,
      sender_type: "admin",
      sender_id: user.id,
      content,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">Live Chat</h2>

      <div className="grid lg:grid-cols-3 gap-4" style={{ minHeight: 400 }}>
        <div className="lg:col-span-1 border border-border rounded-xl overflow-hidden">
          <div className="p-3 bg-secondary/50 border-b border-border"><p className="text-sm font-medium text-foreground">Sessions ({sessions?.length || 0})</p></div>
          <div className="overflow-y-auto max-h-96 divide-y divide-border">
            {sessions?.map((s: any) => (
              <button key={s.id} onClick={() => setSelectedSession(s.id)} className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${selectedSession === s.id ? "bg-secondary" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{s.visitor_name}</span>
                  <Badge variant="secondary" className={`text-[10px] ${s.status === "active" ? "bg-green-500/10 text-green-600" : ""}`}>{s.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleString()}</p>
              </button>
            ))}
            {!sessions?.length && <p className="p-4 text-sm text-muted-foreground text-center">No sessions yet</p>}
          </div>
        </div>

        <div className="lg:col-span-2 border border-border rounded-xl flex flex-col">
          {selectedSession ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 max-h-80">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.sender_type === "admin" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                      {m.content}
                      <p className={`text-[9px] mt-0.5 ${m.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input placeholder="Reply..." value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} className="text-sm" />
                <Button size="sm" onClick={sendReply} disabled={!reply.trim()}><Send className="w-3.5 h-3.5" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Select a session</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatManagement;
