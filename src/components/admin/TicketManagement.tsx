import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, ArrowLeft, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const statusColors: Record<string, string> = { open: "bg-blue-500/10 text-blue-600", pending: "bg-yellow-500/10 text-yellow-600", resolved: "bg-green-500/10 text-green-600", closed: "bg-muted text-muted-foreground" };
const priorityColors: Record<string, string> = { low: "bg-secondary", medium: "bg-yellow-500/10 text-yellow-600", high: "bg-destructive/10 text-destructive" };

const TicketManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: tickets } = useQuery({
    queryKey: ["admin-tickets", filter],
    queryFn: async () => {
      let q = supabase.from("support_tickets").select("*, profiles:user_id(full_name)").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-ticket-messages", selectedId],
    queryFn: async () => {
      const { data } = await supabase.from("ticket_messages").select("*, profiles:sender_id(full_name)").eq("ticket_id", selectedId!).order("created_at");
      return data ?? [];
    },
    enabled: !!selectedId,
  });

  const selected = tickets?.find((t: any) => t.id === selectedId);

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", selectedId!);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }); toast.success("Status updated"); },
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedId!,
        sender_id: user!.id,
        sender_type: "admin",
        content: reply,
      });
      if (error) throw error;
      await supabase.from("support_tickets").update({ status: "pending" }).eq("id", selectedId!);
    },
    onSuccess: () => { setReply(""); queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages", selectedId] }); queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }); toast.success("Reply sent"); },
    onError: () => toast.error("Failed"),
  });

  if (selectedId && selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedId(null)} className="p-2 rounded-xl hover:bg-secondary"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-foreground">{selected.subject}</h2>
            <p className="text-xs text-muted-foreground">{selected.ticket_number} • {(selected as any).profiles?.full_name}</p>
          </div>
          <Select value={selected.status} onValueChange={(v) => updateStatus.mutate(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex gap-2 mb-2"><Badge variant="secondary" className={`text-[10px] ${priorityColors[selected.priority]}`}>{selected.priority}</Badge><Badge variant="secondary" className="text-[10px]">{selected.category}</Badge></div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{selected.description}</p>
        </div>

        <div className="space-y-3">
          {messages?.map((m: any) => (
            <div key={m.id} className={`p-3 rounded-xl border border-border ${m.sender_type === "admin" ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
              <div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium text-foreground">{m.sender_type === "admin" ? "You" : m.profiles?.full_name || "Customer"}</span><span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span></div>
              <p className="text-sm text-muted-foreground">{m.content}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Textarea placeholder="Reply to customer..." value={reply} onChange={(e) => setReply(e.target.value)} rows={2} className="flex-1" />
          <Button onClick={() => sendReply.mutate()} disabled={!reply.trim() || sendReply.isPending} className="self-end"><Send className="w-4 h-4 mr-1" />Send</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Support Tickets</h2>
        <div className="flex gap-2">
          {["all", "open", "pending", "resolved", "closed"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {tickets?.map((t: any) => (
          <button key={t.id} onClick={() => setSelectedId(t.id)} className="w-full text-left p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><span className="text-xs text-muted-foreground font-mono">{t.ticket_number}</span><Badge variant="secondary" className={`text-[10px] ${priorityColors[t.priority]}`}>{t.priority}</Badge></div>
                <h3 className="text-sm font-medium text-foreground truncate">{t.subject}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t.profiles?.full_name} • {new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[t.status]}`}>{t.status}</span>
            </div>
          </button>
        ))}
        {!tickets?.length && <p className="text-center py-8 text-sm text-muted-foreground">No tickets found</p>}
      </div>
    </div>
  );
};

export default TicketManagement;
