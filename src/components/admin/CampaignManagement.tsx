import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Megaphone, Edit2, X, TrendingUp, Eye, MousePointer, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  budget: number | null;
  spent: number;
  metrics: { impressions: number; clicks: number; conversions: number; revenue: number };
  related_promotion_id: string | null;
  related_coupon_id: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/10 text-green-500",
  paused: "bg-amber-500/10 text-amber-500",
  ended: "bg-destructive/10 text-destructive",
};

const defaultForm = {
  name: "", description: "", campaign_type: "promotion", status: "draft",
  starts_at: "", ends_at: "", budget: "",
};

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as unknown as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Campaign name required"); return; }
    const payload = {
      name: form.name,
      description: form.description || null,
      campaign_type: form.campaign_type,
      status: form.status,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      budget: form.budget ? parseFloat(form.budget) : null,
    };

    if (editId) {
      const { error } = await supabase.from("campaigns").update(payload).eq("id", editId);
      if (error) toast.error(error.message);
      else { toast.success("Campaign updated"); setEditId(null); }
    } else {
      const { error } = await supabase.from("campaigns").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Campaign created");
    }
    setForm(defaultForm); setShowForm(false); load();
  };

  const startEdit = (c: Campaign) => {
    setForm({
      name: c.name,
      description: c.description || "",
      campaign_type: c.campaign_type,
      status: c.status,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
      budget: c.budget ? String(c.budget) : "",
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("campaigns").update({ status }).eq("id", id);
    toast.success(`Status: ${status}`); load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const totals = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + (c.metrics?.impressions || 0),
    clicks: acc.clicks + (c.metrics?.clicks || 0),
    conversions: acc.conversions + (c.metrics?.conversions || 0),
    revenue: acc.revenue + (c.metrics?.revenue || 0),
  }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0 });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> Campaigns ({campaigns.length})
        </h3>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Impressions", value: totals.impressions.toLocaleString(), icon: Eye, color: "from-primary/20 to-primary/5" },
          { label: "Clicks", value: totals.clicks.toLocaleString(), icon: MousePointer, color: "from-blue-500/20 to-blue-500/5" },
          { label: "Conversions", value: totals.conversions.toLocaleString(), icon: ShoppingCart, color: "from-green-500/20 to-green-500/5" },
          { label: "Revenue", value: `৳${totals.revenue.toLocaleString()}`, icon: TrendingUp, color: "from-amber-500/20 to-amber-500/5" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-50`} />
            <div className="relative">
              <s.icon className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="font-display text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{editId ? "Edit Campaign" : "New Campaign"}</h4>
                <button onClick={() => setShowForm(false)} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Q1 Growth Campaign" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Type</label>
                  <select value={form.campaign_type} onChange={e => setForm(p => ({ ...p, campaign_type: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none">
                    <option value="promotion">Promotion</option>
                    <option value="coupon">Coupon</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none">
                    <option value="draft">Draft</option><option value="active">Active</option>
                    <option value="paused">Paused</option><option value="ended">Ended</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Budget (৳)</label><input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Starts At</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Ends At</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" /></div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">{editId ? "Update" : "Create"}</button>
                <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Cards */}
      <div className="space-y-3">
        {campaigns.map(c => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status]}`}>{c.status}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{c.campaign_type}</span>
                </div>
                <h4 className="font-semibold text-foreground text-sm">{c.name}</h4>
                {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                {c.status === "draft" && <button onClick={() => updateStatus(c.id, "active")} className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-medium">Launch</button>}
                {c.status === "active" && <button onClick={() => updateStatus(c.id, "paused")} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-medium">Pause</button>}
                {c.status === "paused" && <button onClick={() => updateStatus(c.id, "active")} className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-medium">Resume</button>}
                <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Views", value: c.metrics?.impressions || 0 },
                { label: "Clicks", value: c.metrics?.clicks || 0 },
                { label: "Sales", value: c.metrics?.conversions || 0 },
                { label: "Revenue", value: `৳${(c.metrics?.revenue || 0).toLocaleString()}` },
              ].map(m => (
                <div key={m.label} className="bg-secondary/50 rounded-xl p-2 text-center">
                  <p className="font-bold text-foreground text-xs">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            {c.budget && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Budget: ৳{Number(c.budget).toLocaleString()}</span>
                  <span>Spent: ৳{Number(c.spent).toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((Number(c.spent) / Number(c.budget)) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {campaigns.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No campaigns yet</p>}
      </div>
    </div>
  );
};

export default CampaignManagement;
