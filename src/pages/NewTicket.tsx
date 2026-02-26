import { SEOHead } from "@/components/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const NewTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium", category: "general" });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user!.id,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        category: form.category,
        ticket_number: "TKT-" + Date.now(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket submitted! We'll respond shortly.");
      navigate("/tickets");
    },
    onError: () => toast.error("Failed to submit ticket"),
  });

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1><Link to="/login" className="text-primary font-medium">Sign In →</Link></div>;

  return (
    <>
      <SEOHead title="New Support Ticket" url="/tickets/new" noindex />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/tickets" className="hover:text-primary transition-colors">Tickets</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">New Ticket</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">Submit a Ticket</h1>
        </motion.div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Subject *</label>
            <Input placeholder="Brief description of your issue" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="returns">Returns</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description *</label>
            <Textarea placeholder="Describe your issue in detail..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={6} required />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending || !form.subject.trim() || !form.description.trim()}>
            <Send className="w-4 h-4 mr-1.5" />{mutation.isPending ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </div>
    </>
  );
};

export default NewTicket;
