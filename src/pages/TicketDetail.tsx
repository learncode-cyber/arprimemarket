import { SEOHead } from "@/components/SEOHead";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = { open: "bg-blue-500/10 text-blue-600", pending: "bg-yellow-500/10 text-yellow-600", resolved: "bg-green-500/10 text-green-600", closed: "bg-muted text-muted-foreground" };

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: messages } = useQuery({
    queryKey: ["ticket-messages", id],
    queryFn: async () => {
      const { data } = await supabase.from("ticket_messages").select("*, profiles:sender_id(full_name)").eq("ticket_id", id!).order("created_at");
      return data ?? [];
    },
    enabled: !!id,
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: id!,
        sender_id: user!.id,
        sender_type: "user",
        content: reply,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", id] });
      toast.success("Reply sent!");
    },
    onError: () => toast.error("Failed to send reply"),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12"><Skeleton className="h-8 w-3/4 mb-4" /><Skeleton className="h-32 w-full" /></div>;
  if (!ticket) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-foreground mb-2">Ticket not found</h1><Link to="/tickets" className="text-primary">← Back to Tickets</Link></div>;

  return (
    <>
      <SEOHead title={`Ticket ${ticket.ticket_number}`} noindex />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/tickets" className="hover:text-primary transition-colors">Tickets</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{ticket.ticket_number}</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1">{ticket.subject}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{ticket.ticket_number}</span>
                <span>•</span>
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                <Badge variant="secondary" className="text-[10px]">{ticket.priority}</Badge>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>{ticket.status}</span>
          </div>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
            <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </motion.div>

        {/* Thread */}
        {messages && messages.length > 0 && (
          <div className="space-y-3 mb-6">
            {messages.map((m: any) => (
              <div key={m.id} className={`p-4 rounded-xl border border-border ${m.sender_type === "admin" ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">{m.sender_type === "admin" ? "Support Team" : (m.profiles?.full_name || "You")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.content}</p>
                {m.attachment_url && <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-2 block">📎 Attachment</a>}
              </div>
            ))}
          </div>
        )}

        {ticket.status !== "closed" && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Textarea placeholder="Write a reply..." value={reply} onChange={(e) => setReply(e.target.value)} rows={3} />
            <Button size="sm" disabled={!reply.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate()}>
              <Send className="w-3.5 h-3.5 mr-1.5" />{replyMutation.isPending ? "Sending..." : "Reply"}
            </Button>
          </div>
        )}

        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-8 hover:gap-2.5 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
        </Link>
      </div>
    </>
  );
};

export default TicketDetail;
