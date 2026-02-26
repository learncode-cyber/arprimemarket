import { SEOHead } from "@/components/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusIcons: Record<string, any> = { open: AlertCircle, pending: Clock, resolved: CheckCircle, closed: XCircle };
const statusColors: Record<string, string> = { open: "bg-blue-500/10 text-blue-600", pending: "bg-yellow-500/10 text-yellow-600", resolved: "bg-green-500/10 text-green-600", closed: "bg-muted text-muted-foreground" };
const priorityColors: Record<string, string> = { low: "bg-secondary text-muted-foreground", medium: "bg-yellow-500/10 text-yellow-600", high: "bg-destructive/10 text-destructive" };

const Tickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!user) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
      <p className="text-muted-foreground mb-4">Please sign in to view your support tickets.</p>
      <Link to="/login" className="text-primary font-medium">Sign In →</Link>
    </div>
  );

  return (
    <>
      <SEOHead title="Support Tickets" description="View and manage your support tickets" url="/tickets" noindex />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Support Tickets</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Tickets</h1>
          </motion.div>
          <Button onClick={() => navigate("/tickets/new")}><Plus className="w-4 h-4 mr-1.5" />New Ticket</Button>
        </div>

        {isLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}</div> : tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((t: any) => {
              const Icon = statusIcons[t.status] || AlertCircle;
              return (
                <Link key={t.id} to={`/tickets/${t.id}`} className="block p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">{t.ticket_number}</span>
                        <Badge variant="secondary" className={`text-[10px] ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                      </div>
                      <h3 className="font-medium text-foreground truncate">{t.subject}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[t.status]}`}>
                      <Icon className="w-3 h-3" />{t.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No tickets yet</p>
            <p className="text-sm">Create a ticket to get help from our team.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Tickets;
