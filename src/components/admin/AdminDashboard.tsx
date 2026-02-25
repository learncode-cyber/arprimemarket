import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package, ArrowUpRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  avgOrderValue: number;
  pendingOrders: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_name: string | null;
  order_number: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, payment_status, created_at, shipping_name, order_number").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      setOrders(ordersRes.data || []);
      setCustomerCount(customersRes.count || 0);
      setProductCount(productsRes.count || 0);
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const periodStart = new Date(now.getTime() - periodDays * 86400000);
  const prevPeriodStart = new Date(periodStart.getTime() - periodDays * 86400000);

  const currentOrders = useMemo(() => orders.filter(o => new Date(o.created_at) >= periodStart), [orders, periodStart]);
  const prevOrders = useMemo(() => orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= prevPeriodStart && d < periodStart;
  }), [orders, prevPeriodStart, periodStart]);

  const stats: DashboardStats = useMemo(() => {
    const totalRevenue = currentOrders.reduce((s, o) => s + Number(o.total), 0);
    const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total), 0);
    return {
      totalRevenue,
      totalOrders: currentOrders.length,
      totalCustomers: customerCount,
      totalProducts: productCount,
      revenueChange: prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      ordersChange: prevOrders.length ? ((currentOrders.length - prevOrders.length) / prevOrders.length) * 100 : 0,
      avgOrderValue: currentOrders.length ? totalRevenue / currentOrders.length : 0,
      pendingOrders: currentOrders.filter(o => o.status === "pending").length,
    };
  }, [currentOrders, prevOrders, customerCount, productCount]);

  // Revenue chart data
  const revenueData = useMemo(() => {
    const buckets: Record<string, number> = {};
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 12; // weeks for 90d
    
    if (period === "90d") {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getTime() - (11 - i) * 7 * 86400000);
        const key = `W${i + 1}`;
        buckets[key] = 0;
      }
      currentOrders.forEach(o => {
        const weeksAgo = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / (7 * 86400000));
        const idx = 11 - Math.min(weeksAgo, 11);
        const key = `W${idx + 1}`;
        buckets[key] = (buckets[key] || 0) + Number(o.total);
      });
    } else {
      for (let i = 0; i < days; i++) {
        const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        buckets[key] = 0;
      }
      currentOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        if (key in buckets) buckets[key] += Number(o.total);
      });
    }
    return Object.entries(buckets).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  }, [currentOrders, period]);

  // Order status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    currentOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [currentOrders]);

  const CHART_COLORS = [
    "hsl(var(--primary))",
    "hsl(346, 72%, 72%)",
    "hsl(200, 70%, 55%)",
    "hsl(142, 55%, 50%)",
    "hsl(38, 92%, 55%)",
    "hsl(0, 65%, 55%)",
  ];

  const statCards = [
    { label: "Revenue", value: `৳${stats.totalRevenue.toLocaleString()}`, change: stats.revenueChange, icon: DollarSign, color: "from-primary/20 to-primary/5" },
    { label: "Orders", value: stats.totalOrders.toString(), change: stats.ordersChange, icon: ShoppingBag, color: "from-blue-500/20 to-blue-500/5" },
    { label: "Customers", value: stats.totalCustomers.toString(), change: 0, icon: Users, color: "from-green-500/20 to-green-500/5" },
    { label: "Avg. Order", value: `৳${Math.round(stats.avgOrderValue).toLocaleString()}`, change: 0, icon: Package, color: "from-amber-500/20 to-amber-500/5" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {(["7d", "30d", "90d"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                {stat.change !== 0 && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${stat.change > 0 ? "text-green-500" : "text-red-500"}`}>
                    {stat.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(Math.round(stat.change))}%
                  </span>
                )}
              </div>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Overview</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v: number) => [`৳${v.toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Order Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Order Status</h3>
          {statusData.length > 0 ? (
            <div className="h-56 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No orders yet</p>
          )}
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
          <span className="text-[10px] text-muted-foreground">{stats.pendingOrders} pending</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground text-xs">{o.order_number}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{o.shipping_name || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      o.status === "delivered" ? "bg-green-500/10 text-green-500" :
                      o.status === "pending" ? "bg-amber-500/10 text-amber-500" :
                      o.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                      "bg-primary/10 text-primary"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground text-xs">৳{Number(o.total).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
