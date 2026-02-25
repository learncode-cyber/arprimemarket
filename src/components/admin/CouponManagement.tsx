import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Tag, Calendar, Edit2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
}

const defaultForm = { code: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", starts_at: "", expires_at: "" };

const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.code || !form.discount_value) { toast.error("Code and value required"); return; }
    const payload = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
    };

    if (editId) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editId);
      if (error) toast.error(error.message);
      else { toast.success("Coupon updated"); setEditId(null); }
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Coupon created");
    }
    setForm(defaultForm); setShowAdd(false); load();
  };

  const startEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "",
      max_uses: c.max_uses ? String(c.max_uses) : "",
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setEditId(c.id);
    setShowAdd(true);
  };

  const handleToggle = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Disabled" : "Enabled");
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" /> Coupons ({coupons.length})
        </h3>
        <button onClick={() => { setShowAdd(!showAdd); setEditId(null); setForm(defaultForm); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> Add Coupon
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{editId ? "Edit Coupon" : "New Coupon"}</h4>
                <button onClick={() => { setShowAdd(false); setEditId(null); }} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Code *</label><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="SAVE20" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase" /></div>
                <div><label className="text-xs text-muted-foreground">Type</label>
                  <select value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none">
                    <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Value *</label><input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Min Order</label><input type="number" value={form.min_order_amount} onChange={e => setForm(p => ({ ...p, min_order_amount: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Max Uses</label><input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Starts At</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires At</label><input type="datetime-local" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">{editId ? "Update" : "Create"}</button>
                <button onClick={() => { setShowAdd(false); setEditId(null); }} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Discount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Min Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Used</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Validity</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground text-xs">{c.code}</td>
                  <td className="px-4 py-3 text-xs text-foreground">{c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${Number(c.discount_value).toLocaleString()}`}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{c.min_order_amount ? `৳${Number(c.min_order_amount).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.used_count || 0}/{c.max_uses || "∞"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {c.starts_at || c.expires_at ? (
                      <div className="space-y-0.5">
                        {c.starts_at && <div>From: {new Date(c.starts_at).toLocaleDateString()}</div>}
                        {c.expires_at && <div className={isExpired(c) ? "text-destructive" : ""}>To: {new Date(c.expires_at).toLocaleDateString()}{isExpired(c) && " (Expired)"}</div>}
                      </div>
                    ) : "Always"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isExpired(c) ? "bg-destructive/10 text-destructive" :
                      c.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    }`}>
                      {isExpired(c) ? "Expired" : c.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No coupons</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CouponManagement;
