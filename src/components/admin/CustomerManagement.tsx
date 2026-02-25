import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, ShieldCheck, ShieldOff, Loader2, Mail, MapPin, Calendar, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
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

  useEffect(() => {
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

      // Aggregate orders per user
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
    load();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Update existing role
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as "admin" | "moderator" | "user" })
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Role updated");
      setRoles(prev => ({ ...prev, [userId]: newRole }));
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, role: newRole } : c));
    }
  };

  const filtered = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(s) ||
      (c.phone || "").includes(s) ||
      (c.city || "").toLowerCase().includes(s);
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, city..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
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
                  <td className="px-4 py-3 text-[10px] text-muted-foreground hidden sm:table-cell">
                    {new Date(c.created_at).toLocaleDateString()}
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
