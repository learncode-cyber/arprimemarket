import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingBag, Users, BarChart3,
  Download, Globe, Percent, Package, ArrowUpRight, Target, Repeat, PieChart as PieIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──
interface OrderRow {
  id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  tax_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  user_id: string | null;
  shipping_country: string | null;
  coupon_id: string | null;
}

interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  price: number;
  quantity: number;
  total: number;
  title: string;
}

interface ProductRow {
  id: string;
  title: string;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  category_id: string | null;
}

interface CampaignRow {
  id: string;
  name: string;
  spent: number;
  metrics: { revenue?: number; conversions?: number; impressions?: number; clicks?: number } | null;
}

// ── Helpers ──
const fmt = (n: number) => `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "")}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const COLORS = [
  "hsl(var(--primary))", "hsl(200, 70%, 55%)", "hsl(142, 55%, 50%)",
  "hsl(38, 92%, 55%)", "hsl(346, 72%, 72%)", "hsl(270, 60%, 60%)",
  "hsl(0, 65%, 55%)", "hsl(180, 55%, 45%)"
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
};

// ── Stat Card ──
const StatCard = ({ label, value, change, icon: Icon, sub }: {
  label: string; value: string; change?: number; icon: React.ElementType; sub?: string;
}) => (
  <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
    <div className="flex items-center justify-between mb-1.5">
      <Icon className="w-4 h-4 text-muted-foreground" />
      {change !== undefined && change !== 0 && (
        <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${change > 0 ? "text-green-500" : "text-destructive"}`}>
          {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(Math.round(change))}%
        </span>
      )}
    </div>
    <p className="font-display text-lg font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    {sub && <p className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</p>}
  </div>
);

// ── Main Component ──
const BusinessIntelligence = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [oRes, iRes, pRes, cRes, custRes] = await Promise.all([
        supabase.from("orders").select("id, total, subtotal, shipping_cost, discount_amount, tax_amount, status, payment_status, created_at, user_id, shipping_country, coupon_id").order("created_at", { ascending: false }).limit(5000),
        supabase.from("order_items").select("order_id, product_id, price, quantity, total, title").limit(10000),
        supabase.from("products").select("id, title, price, cost_price, stock_quantity, category_id"),
        supabase.from("campaigns").select("id, name, spent, metrics"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setOrders((oRes.data || []) as OrderRow[]);
      setItems((iRes.data || []) as OrderItemRow[]);
      setProducts((pRes.data || []) as ProductRow[]);
      setCampaigns((cRes.data || []).map(c => ({ ...c, metrics: c.metrics as CampaignRow["metrics"] })));
      setCustomerCount(custRes.count || 0);
      setLoading(false);
    };
    load();
  }, []);

  // ── Period filter ──
  const now = useMemo(() => new Date(), []);
  const periodMs = period === "7d" ? 7 * 864e5 : period === "30d" ? 30 * 864e5 : period === "90d" ? 90 * 864e5 : Infinity;
  const filteredOrders = useMemo(() => {
    if (period === "all") return orders;
    const cutoff = new Date(now.getTime() - periodMs);
    return orders.filter(o => new Date(o.created_at) >= cutoff);
  }, [orders, period, periodMs, now]);

  const prevOrders = useMemo(() => {
    if (period === "all") return [];
    const start = new Date(now.getTime() - periodMs);
    const prevStart = new Date(start.getTime() - periodMs);
    return orders.filter(o => { const d = new Date(o.created_at); return d >= prevStart && d < start; });
  }, [orders, period, periodMs, now]);

  const paidOrders = useMemo(() => filteredOrders.filter(o => o.payment_status === "paid"), [filteredOrders]);
  const prevPaidOrders = useMemo(() => prevOrders.filter(o => o.payment_status === "paid"), [prevOrders]);

  // ══════════ PHASE A: Revenue Analytics ══════════
  const revenue = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.total), 0), [paidOrders]);
  const prevRevenue = useMemo(() => prevPaidOrders.reduce((s, o) => s + Number(o.total), 0), [prevPaidOrders]);
  const revenueChange = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const aov = paidOrders.length ? revenue / paidOrders.length : 0;
  const conversionRate = filteredOrders.length ? (paidOrders.length / filteredOrders.length) * 100 : 0;

  const returningCustomers = useMemo(() => {
    const userOrders: Record<string, number> = {};
    paidOrders.filter(o => o.user_id).forEach(o => { userOrders[o.user_id!] = (userOrders[o.user_id!] || 0) + 1; });
    const total = Object.keys(userOrders).length;
    const returning = Object.values(userOrders).filter(c => c > 1).length;
    return total ? (returning / total) * 100 : 0;
  }, [paidOrders]);

  // Revenue by day
  const revenueChart = useMemo(() => {
    const buckets: Record<string, number> = {};
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    for (let i = 0; i < Math.min(days, 90); i++) {
      const d = new Date(now.getTime() - (Math.min(days, 90) - 1 - i) * 864e5);
      buckets[`${d.getMonth() + 1}/${d.getDate()}`] = 0;
    }
    paidOrders.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (key in buckets) buckets[key] += Number(o.total);
    });
    return Object.entries(buckets).map(([name, rev]) => ({ name, revenue: Math.round(rev) }));
  }, [paidOrders, period, now]);

  // Revenue by country
  const revenueByCountry = useMemo(() => {
    const map: Record<string, number> = {};
    paidOrders.forEach(o => {
      const c = o.shipping_country || "Unknown";
      map[c] = (map[c] || 0) + Number(o.total);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [paidOrders]);

  // ══════════ PHASE B: Growth Metrics ══════════
  const campaignROI = useMemo(() => {
    return campaigns.filter(c => c.spent > 0).map(c => {
      const rev = (c.metrics?.revenue || 0);
      return { name: c.name.slice(0, 20), spent: Number(c.spent), revenue: rev, roi: c.spent > 0 ? ((rev - Number(c.spent)) / Number(c.spent)) * 100 : 0 };
    }).sort((a, b) => b.roi - a.roi).slice(0, 10);
  }, [campaigns]);

  const productPerformance = useMemo(() => {
    const salesMap: Record<string, { qty: number; revenue: number }> = {};
    items.forEach(i => {
      if (!i.product_id) return;
      if (!salesMap[i.product_id]) salesMap[i.product_id] = { qty: 0, revenue: 0 };
      salesMap[i.product_id].qty += i.quantity;
      salesMap[i.product_id].revenue += Number(i.total);
    });
    return products.map(p => ({
      name: p.title.slice(0, 25),
      sold: salesMap[p.id]?.qty || 0,
      revenue: Math.round(salesMap[p.id]?.revenue || 0),
      stock: p.stock_quantity,
      turnover: p.stock_quantity > 0 ? ((salesMap[p.id]?.qty || 0) / p.stock_quantity * 100) : 0,
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [products, items]);

  // ══════════ PHASE C: Profit Margin ══════════
  const profitData = useMemo(() => {
    const productCosts: Record<string, number> = {};
    products.forEach(p => { if (p.cost_price) productCosts[p.id] = Number(p.cost_price); });

    let totalCost = 0;
    let totalShipping = 0;
    let totalRevenue = 0;
    const perOrder: { order: string; revenue: number; cost: number; shipping: number; profit: number; margin: number }[] = [];

    paidOrders.forEach(o => {
      const orderItems = items.filter(i => i.order_id === o.id);
      const cost = orderItems.reduce((s, i) => s + (productCosts[i.product_id || ""] || Number(i.price) * 0.6) * i.quantity, 0);
      const ship = Number(o.shipping_cost);
      const rev = Number(o.total);
      const profit = rev - cost - ship;
      totalCost += cost;
      totalShipping += ship;
      totalRevenue += rev;
      perOrder.push({ order: o.id.slice(0, 8), revenue: Math.round(rev), cost: Math.round(cost), shipping: Math.round(ship), profit: Math.round(profit), margin: rev > 0 ? (profit / rev) * 100 : 0 });
    });

    const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCost - totalShipping) / totalRevenue) * 100 : 0;
    return { totalCost: Math.round(totalCost), totalShipping: Math.round(totalShipping), totalRevenue: Math.round(totalRevenue), netProfit: Math.round(totalRevenue - totalCost - totalShipping), overallMargin, perOrder };
  }, [paidOrders, items, products]);

  const productProfit = useMemo(() => {
    const productCosts: Record<string, number> = {};
    products.forEach(p => { if (p.cost_price) productCosts[p.id] = Number(p.cost_price); });
    const map: Record<string, { title: string; revenue: number; cost: number }> = {};
    items.forEach(i => {
      if (!i.product_id) return;
      if (!map[i.product_id]) map[i.product_id] = { title: i.title, revenue: 0, cost: 0 };
      map[i.product_id].revenue += Number(i.total);
      map[i.product_id].cost += (productCosts[i.product_id] || Number(i.price) * 0.6) * i.quantity;
    });
    return Object.values(map).map(p => ({
      name: p.title.slice(0, 25),
      profit: Math.round(p.revenue - p.cost),
      margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100) : 0,
    })).sort((a, b) => b.profit - a.profit).slice(0, 10);
  }, [items, products]);

  // ══════════ PHASE D: CAC vs LTV ══════════
  const cacLtv = useMemo(() => {
    const totalSpent = campaigns.reduce((s, c) => s + Number(c.spent), 0);
    const uniqueCustomers = new Set(paidOrders.filter(o => o.user_id).map(o => o.user_id!)).size;
    const cac = uniqueCustomers > 0 ? totalSpent / uniqueCustomers : 0;

    // LTV = avg orders per customer × AOV × estimated lifespan (months)
    const userOrderCounts: Record<string, number> = {};
    const userRevenue: Record<string, number> = {};
    paidOrders.filter(o => o.user_id).forEach(o => {
      userOrderCounts[o.user_id!] = (userOrderCounts[o.user_id!] || 0) + 1;
      userRevenue[o.user_id!] = (userRevenue[o.user_id!] || 0) + Number(o.total);
    });
    const customers = Object.keys(userOrderCounts);
    const avgOrdersPerCustomer = customers.length ? customers.reduce((s, c) => s + userOrderCounts[c], 0) / customers.length : 0;
    const avgRevPerCustomer = customers.length ? customers.reduce((s, c) => s + userRevenue[c], 0) / customers.length : 0;
    const ltv = avgRevPerCustomer * 1.5; // 1.5x projected lifespan multiplier

    // Retention: customers who ordered more than once
    const retentionRate = customers.length ? (customers.filter(c => userOrderCounts[c] > 1).length / customers.length) * 100 : 0;

    // Monthly cohort data
    const cohorts: Record<string, { month: string; customers: number; revenue: number; retained: number }> = {};
    paidOrders.filter(o => o.user_id).forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!cohorts[key]) cohorts[key] = { month: key, customers: 0, revenue: 0, retained: 0 };
      cohorts[key].revenue += Number(o.total);
    });
    // Count unique customers per cohort
    const customerFirstMonth: Record<string, string> = {};
    paidOrders.filter(o => o.user_id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).forEach(o => {
      if (!customerFirstMonth[o.user_id!]) {
        const d = new Date(o.created_at);
        customerFirstMonth[o.user_id!] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }
    });
    Object.values(customerFirstMonth).forEach(m => { if (cohorts[m]) cohorts[m].customers++; });

    const cohortData = Object.values(cohorts).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

    return { cac: Math.round(cac), ltv: Math.round(ltv), ltvCacRatio: cac > 0 ? ltv / cac : 0, retentionRate, avgOrdersPerCustomer: avgOrdersPerCustomer.toFixed(1), uniqueCustomers, cohortData };
  }, [campaigns, paidOrders]);

  // ── Export handlers ──
  const exportRevenue = useCallback(() => {
    downloadCSV(revenueChart.map(r => ({ date: r.name, revenue: r.revenue })), "revenue-data");
  }, [revenueChart]);

  const exportProducts = useCallback(() => {
    downloadCSV(productPerformance, "product-performance");
  }, [productPerformance]);

  const exportProfit = useCallback(() => {
    downloadCSV(profitData.perOrder.slice(0, 500), "profit-per-order");
  }, [profitData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Business Intelligence</h2>
          <p className="text-xs text-muted-foreground">Investor-ready analytics & insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {(["7d", "30d", "90d", "all"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p === "all" ? "All" : p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="cac-ltv">CAC / LTV</TabsTrigger>
        </TabsList>

        {/* ══════════ REVENUE TAB ══════════ */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total Revenue" value={fmt(revenue)} change={revenueChange} icon={DollarSign} />
            <StatCard label="Paid Orders" value={paidOrders.length.toString()} icon={ShoppingBag} />
            <StatCard label="Conversion Rate" value={pct(conversionRate)} icon={Target} />
            <StatCard label="Avg Order Value" value={fmt(Math.round(aov))} icon={BarChart3} />
            <StatCard label="Returning Rate" value={pct(returningCustomers)} icon={Repeat} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
                <button onClick={exportRevenue} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="biRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#biRevGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> By Country</h3>
              {revenueByCountry.length > 0 ? (
                <div className="space-y-2">
                  {revenueByCountry.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{c.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No data</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ══════════ GROWTH TAB ══════════ */}
        <TabsContent value="growth" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Customers" value={customerCount.toString()} icon={Users} />
            <StatCard label="New (Period)" value={cacLtv.uniqueCustomers.toString()} icon={ArrowUpRight} />
            <StatCard label="Products" value={products.length.toString()} icon={Package} />
            <StatCard label="Campaigns" value={campaigns.length.toString()} icon={Target} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Product Performance */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Product Performance</h3>
                <button onClick={exportProducts} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Revenue"]} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign ROI */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Campaign ROI</h3>
              {campaignROI.length > 0 ? (
                <div className="space-y-3">
                  {campaignROI.map(c => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{c.name}</span>
                        <span className={`font-semibold ${c.roi >= 0 ? "text-green-500" : "text-destructive"}`}>
                          {c.roi >= 0 ? "+" : ""}{c.roi.toFixed(0)}% ROI
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Spent: {fmt(c.spent)}</span>
                        <span>Rev: {fmt(c.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No campaign data</p>
              )}
            </div>
          </div>

          {/* Inventory Turnover */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Inventory Turnover Rate</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Sold</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Stock</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.slice(0, 8).map(p => (
                    <tr key={p.name} className="border-b border-border/50">
                      <td className="py-2 text-foreground">{p.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{p.sold}</td>
                      <td className="py-2 text-right text-muted-foreground">{p.stock}</td>
                      <td className="py-2 text-right font-semibold text-foreground">{p.turnover.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ══════════ PROFIT TAB ══════════ */}
        <TabsContent value="profit" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total Revenue" value={fmt(profitData.totalRevenue)} icon={DollarSign} />
            <StatCard label="Total COGS" value={fmt(profitData.totalCost)} icon={Package} />
            <StatCard label="Shipping Costs" value={fmt(profitData.totalShipping)} icon={Globe} />
            <StatCard label="Net Profit" value={fmt(profitData.netProfit)} icon={TrendingUp} />
            <StatCard label="Overall Margin" value={pct(profitData.overallMargin)} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Profit by Product</h3>
                <button onClick={exportProfit} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productProfit} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), "Profit"]} />
                    <Bar dataKey="profit" fill="hsl(142, 55%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Margin Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Net Profit", value: Math.max(0, profitData.netProfit) },
                        { name: "COGS", value: profitData.totalCost },
                        { name: "Shipping", value: profitData.totalShipping },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    >
                      <Cell fill="hsl(142, 55%, 50%)" />
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(38, 92%, 55%)" />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v)]} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ══════════ CAC / LTV TAB ══════════ */}
        <TabsContent value="cac-ltv" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="CAC" value={fmt(cacLtv.cac)} icon={Target} sub="Cost per Acquisition" />
            <StatCard label="LTV" value={fmt(cacLtv.ltv)} icon={DollarSign} sub="Lifetime Value" />
            <StatCard label="LTV:CAC Ratio" value={`${cacLtv.ltvCacRatio.toFixed(1)}x`} icon={BarChart3} sub={cacLtv.ltvCacRatio >= 3 ? "Healthy" : "Needs work"} />
            <StatCard label="Retention Rate" value={pct(cacLtv.retentionRate)} icon={Repeat} />
            <StatCard label="Avg Orders/User" value={cacLtv.avgOrdersPerCustomer} icon={ShoppingBag} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Cohort Analysis</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cacLtv.cohortData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar yAxisId="left" dataKey="customers" fill="hsl(var(--primary))" name="New Customers" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(142, 55%, 50%)" name="Revenue" strokeWidth={2} dot={false} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth Forecast */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Growth Forecast (Next 6 Months)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => {
                const growthRate = 1 + (cacLtv.retentionRate / 100) * 0.1;
                const projected = revenue * Math.pow(growthRate, i + 1) / (period === "30d" ? 1 : period === "7d" ? 4.3 : period === "90d" ? 0.33 : 0.083);
                const d = new Date(now);
                d.setMonth(d.getMonth() + i + 1);
                return (
                  <div key={i} className="text-center p-3 bg-secondary/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground">{d.toLocaleString("en", { month: "short", year: "2-digit" })}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{fmt(Math.round(projected))}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-muted-foreground mt-2">* Based on current retention rate and revenue trajectory</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligence;
