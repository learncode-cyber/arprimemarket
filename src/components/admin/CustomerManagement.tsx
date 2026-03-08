import { useState, useEffect } from "react";
import { Search, Users, ShieldCheck, ShoppingBag, Loader2, Trash2, Edit3, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  created_at: string;
  orderCount?: number;
  totalSpent?: number;
  role?: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("orders").select("user_id, total"),
    ]);

    const rolesMap: Record<string, string> = {};
    (rolesRes.data || []).forEach(r => { rolesMap[r.user_id] = r.role; });
    setRoles(rolesMap);

    const orderStats: Record<string, { count: number; spent: number }> = {};
    (ordersRes.data || []).forEach(o => {
      if (!o.user_id) return;
      if (!orderStats[o.user_id]) orderStats[o.user_id] = { count: 0, spent: 0 };
      orderStats[o.user_id].count++;
      orderStats[o.user_id].spent += Number(o.total);
    });

    setCustomers((profilesRes.data || []).map(p => ({
      ...p,
      orderCount: orderStats[p.id]?.count || 0,
      totalSpent: orderStats[p.id]?.spent || 0,
      role: rolesMap[p.id] || "user",
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as "admin" | "moderator" | "user" })
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Role updated");
      setRoles(prev => ({ ...prev, [userId]: newRole }));
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, role: newRole } : c));
    }
  };

  const startEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({
      full_name: c.full_name || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      country: c.country || "",
    });
  };

  const saveEdit = async () => {
    if (!editingCustomer) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke("admin-tools", {
      body: { action: "update_customer", user_id: editingCustomer.id, updates: editForm },
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Customer updated");
      setEditingCustomer(null);
      load();
    }
    setSaving(false);
  };

  const handleDelete = async (userId: string) => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("admin-tools", {
      body: { action: "delete_customer", user_id: userId },
    });
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Deletion failed");
    } else {
      toast.success("Customer fully deleted");
      setDeleteConfirm(null);
      setDeleteTyped("");
      load();
    }
    setDeleting(false);
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(s) ||
      (c.phone || "").includes(s) ||
      (c.city || "").toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s);
  });

  const stats = {
    total: customers.length,
    admins: customers.filter(c => c.role === "admin").length,
    withOrders: customers.filter(c => (c.orderCount || 0) > 0).length,
    totalRevenue: customers.reduce((s, c) => s + (c.totalSpent || 0), 0),
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Total Users", value: stats.total, icon: Users },
          { label: "Admins", value: stats.admins, icon: ShieldCheck },
          { label: "Buyers", value: stats.withOrders, icon: ShoppingBag },
          { label: "Revenue", value: `৳${stats.totalRevenue.toLocaleString()}`, icon: ShoppingBag },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="font-display text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, city, ID..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setEditingCustomer(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground">Edit Customer</h3>
              <button onClick={() => setEditingCustomer(null)} className="p-1 rounded-lg hover:bg-secondary"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            {["full_name", "phone", "address", "city", "country"].map(field => (
              <div key={field}>
                <label className="text-xs text-muted-foreground capitalize">{field.replace("_", " ")}</label>
                <input value={editForm[field] || ""} onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setEditingCustomer(null)} className="px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setDeleteConfirm(null); setDeleteTyped(""); }} />
          <div className="relative w-full max-w-sm bg-card border-2 border-destructive/30 rounded-2xl p-6 space-y-4 z-10">
            <h3 className="font-display font-bold text-destructive">⚠️ Permanent Deletion</h3>
            <p className="text-sm text-muted-foreground">This will permanently delete this customer's account, profile, all orders, addresses, and authentication data. <strong className="text-foreground">This cannot be undone.</strong></p>
            <div>
              <label className="text-xs text-muted-foreground">Type <strong className="text-destructive">DELETE</strong> to confirm</label>
              <input value={deleteTyped} onChange={e => setDeleteTyped(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-destructive/30 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
                placeholder="Type DELETE" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteTyped !== "DELETE" || deleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-40">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Forever
              </button>
              <button onClick={() => { setDeleteConfirm(null); setDeleteTyped(""); }} className="px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Spent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground text-xs">{c.full_name || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{c.phone || "No phone"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {c.city || "—"}, {c.country || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">{c.orderCount}</td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground hidden sm:table-cell">
                    ৳{(c.totalSpent || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.role}
                      onChange={e => handleRoleChange(c.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border-0 focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                        c.role === "admin" ? "bg-primary/10 text-primary" :
                        c.role === "moderator" ? "bg-amber-500/10 text-amber-500" :
                        "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
