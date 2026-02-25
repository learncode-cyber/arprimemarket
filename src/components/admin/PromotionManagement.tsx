import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Zap, Edit2, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  promotion_type: string;
  discount_type: string;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
  product_ids: string[] | null;
  category_ids: string[] | null;
  banner_url: string | null;
  conditions: Record<string, unknown> | null;
}

const typeLabels: Record<string, string> = {
  flash_sale: "⚡ Flash Sale",
  seasonal: "🎄 Seasonal",
  product_rule: "📦 Product Rule",
  bundle: "🎁 Bundle Deal",
};

const defaultForm = {
  name: "", description: "", promotion_type: "flash_sale", discount_type: "percentage",
  discount_value: "", starts_at: "", ends_at: "", priority: "0", banner_url: "",
};

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promotions").select("*").order("priority", { ascending: false });
    setPromotions((data as Promotion[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.discount_value) { toast.error("Name and discount value required"); return; }
    const payload = {
      name: form.name,
      description: form.description || null,
      promotion_type: form.promotion_type,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      priority: parseInt(form.priority) || 0,
      banner_url: form.banner_url || null,
    };

    if (editId) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editId);
      if (error) toast.error(error.message);
      else { toast.success("Promotion updated"); setEditId(null); }
    } else {
      const { error } = await supabase.from("promotions").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Promotion created");
    }
    setForm(defaultForm); setShowForm(false); load();
  };

  const startEdit = (p: Promotion) => {
    setForm({
      name: p.name,
      description: p.description || "",
      promotion_type: p.promotion_type,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      starts_at: p.starts_at ? p.starts_at.slice(0, 16) : "",
      ends_at: p.ends_at ? p.ends_at.slice(0, 16) : "",
      priority: String(p.priority),
      banner_url: p.banner_url || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleToggle = async (p: Promotion) => {
    await supabase.from("promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    toast.success(p.is_active ? "Disabled" : "Enabled"); load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("promotions").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const isLive = (p: Promotion) => {
    if (!p.is_active) return false;
    const now = new Date();
    if (p.starts_at && new Date(p.starts_at) > now) return false;
    if (p.ends_at && new Date(p.ends_at) < now) return false;
    return true;
  };

  const getTimeLeft = (p: Promotion) => {
    if (!p.ends_at) return null;
    const diff = new Date(p.ends_at).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    return `${hours}h ${mins}m left`;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Promotions ({promotions.length})
        </h3>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> New Promotion
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{editId ? "Edit Promotion" : "New Promotion"}</h4>
                <button onClick={() => setShowForm(false)} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Summer Flash Sale" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Type</label>
                  <select value={form.promotion_type} onChange={e => setForm(p => ({ ...p, promotion_type: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none">
                    <option value="flash_sale">Flash Sale</option>
                    <option value="seasonal">Seasonal Offer</option>
                    <option value="product_rule">Product Rule</option>
                    <option value="bundle">Bundle Deal</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Discount Type</label>
                  <select value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none">
                    <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Value *</label><input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Priority</label><input type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Starts At</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Ends At</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Banner URL</label><input value={form.banner_url} onChange={e => setForm(p => ({ ...p, banner_url: e.target.value }))} placeholder="https://..." className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {promotions.map(p => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
            {isLive(p) && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40 animate-pulse" />}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{typeLabels[p.promotion_type] || p.promotion_type}</span>
                  {isLive(p) && <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-medium rounded-full">LIVE</span>}
                </div>
                <h4 className="font-semibold text-foreground text-sm mt-1">{p.name}</h4>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-primary">{p.discount_type === "percentage" ? `${p.discount_value}% OFF` : `৳${p.discount_value} OFF`}</span>
              {getTimeLeft(p) && (
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{getTimeLeft(p)}</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">Priority: {p.priority}</span>
              <button onClick={() => handleToggle(p)} className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${p.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                {p.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {promotions.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No promotions yet</p>}
    </div>
  );
};

export default PromotionManagement;
