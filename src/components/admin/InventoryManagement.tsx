import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Warehouse, AlertTriangle, Search, Plus, Save, Loader2,
  BarChart3, MapPin, History, ArrowUpDown, ChevronDown, ChevronUp, X, Edit2, Minus, PlusCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  is_default: boolean;
}

interface StockItem {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  bin_location: string | null;
  products?: { title: string; sku: string | null; image_url: string | null; stock_quantity: number };
  warehouses?: { name: string; code: string };
}

interface Adjustment {
  id: string;
  warehouse_id: string;
  product_id: string;
  adjustment_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  created_at: string;
  products?: { title: string };
  warehouses?: { name: string };
}

type Tab = "dashboard" | "warehouses" | "stock" | "adjust" | "history" | "analytics";

const InventoryManagement = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // Warehouse form
  const [showWHForm, setShowWHForm] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", code: "", address: "", city: "", country: "Bangladesh" });
  const [whSaving, setWhSaving] = useState(false);

  // Adjust form
  const [adjustForm, setAdjustForm] = useState({ warehouse_id: "", product_id: "", quantity_change: 0, reason: "" });
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [products, setProducts] = useState<{ id: string; title: string; sku: string | null }[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [whRes, stockRes, adjRes, prodRes] = await Promise.all([
      supabase.from("warehouses").select("*").order("created_at"),
      supabase.from("warehouse_stock").select("*, products(title, sku, image_url, stock_quantity), warehouses(name, code)").order("updated_at", { ascending: false }),
      supabase.from("stock_adjustments").select("*, products(title), warehouses(name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("products").select("id, title, sku").eq("is_active", true).order("title"),
    ]);
    if (whRes.data) setWarehouses(whRes.data);
    if (stockRes.data) setStock(stockRes.data as StockItem[]);
    if (adjRes.data) setAdjustments(adjRes.data as Adjustment[]);
    if (prodRes.data) setProducts(prodRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime stock updates
  useEffect(() => {
    const channel = supabase
      .channel("warehouse-stock-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "warehouse_stock" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // ─── Warehouse CRUD ───
  const saveWarehouse = async () => {
    if (!whForm.name || !whForm.code) return toast.error("Name and code required");
    setWhSaving(true);
    const { error } = await supabase.from("warehouses").insert({
      name: whForm.name, code: whForm.code.toUpperCase(),
      address: whForm.address || null, city: whForm.city || null, country: whForm.country,
    });
    if (error) toast.error(error.message);
    else { toast.success("Warehouse added"); setShowWHForm(false); setWhForm({ name: "", code: "", address: "", city: "", country: "Bangladesh" }); fetchAll(); }
    setWhSaving(false);
  };

  // ─── Stock Adjustment ───
  const submitAdjustment = async () => {
    if (!adjustForm.warehouse_id || !adjustForm.product_id || adjustForm.quantity_change === 0) {
      return toast.error("Select warehouse, product and quantity");
    }
    setAdjustSaving(true);

    // Get current stock
    const { data: current } = await supabase.from("warehouse_stock")
      .select("id, quantity")
      .eq("warehouse_id", adjustForm.warehouse_id)
      .eq("product_id", adjustForm.product_id)
      .maybeSingle();

    const prevQty = current?.quantity || 0;
    const newQty = Math.max(0, prevQty + adjustForm.quantity_change);

    // Upsert warehouse stock
    if (current) {
      await supabase.from("warehouse_stock").update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("id", current.id);
    } else {
      await supabase.from("warehouse_stock").insert({
        warehouse_id: adjustForm.warehouse_id, product_id: adjustForm.product_id,
        quantity: newQty,
      });
    }

    // Update main product stock (sum across all warehouses)
    const { data: allStock } = await supabase.from("warehouse_stock")
      .select("quantity").eq("product_id", adjustForm.product_id);
    const totalStock = (allStock || []).reduce((s, i) => s + i.quantity, 0) + (current ? 0 : newQty);
    await supabase.from("products").update({ stock_quantity: totalStock }).eq("id", adjustForm.product_id);

    // Log adjustment
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("stock_adjustments").insert({
      warehouse_id: adjustForm.warehouse_id,
      product_id: adjustForm.product_id,
      adjustment_type: "manual",
      quantity_change: adjustForm.quantity_change,
      previous_quantity: prevQty,
      new_quantity: newQty,
      reason: adjustForm.reason || null,
      adjusted_by: user?.id || null,
    });

    toast.success(`Stock adjusted: ${prevQty} → ${newQty}`);
    setAdjustForm({ warehouse_id: "", product_id: "", quantity_change: 0, reason: "" });
    setAdjustSaving(false);
    fetchAll();
  };

  // ─── Computed stats ───
  const totalStock = stock.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = stock.reduce((s, i) => s + i.reserved_quantity, 0);
  const lowStockItems = stock.filter(s => s.quantity <= s.reorder_level && s.quantity > 0);
  const outOfStockItems = stock.filter(s => s.quantity === 0);

  const filteredStock = stock.filter(s => {
    const matchSearch = !search || (s.products?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.products?.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.bin_location || "").toLowerCase().includes(search.toLowerCase());
    const matchWH = selectedWarehouse === "all" || s.warehouse_id === selectedWarehouse;
    return matchSearch && matchWH;
  });

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "warehouses", icon: Warehouse, label: "Warehouses" },
    { id: "stock", icon: Package, label: "Stock" },
    { id: "adjust", icon: ArrowUpDown, label: "Adjust" },
    { id: "history", icon: History, label: "History" },
  ];

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors touch-manipulation ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-border"
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab === "dashboard" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Stock", value: totalStock.toLocaleString(), color: "text-foreground", icon: Package },
              { label: "Reserved", value: totalReserved.toLocaleString(), color: "text-primary", icon: MapPin },
              { label: "Low Stock", value: lowStockItems.length, color: "text-amber-500", icon: AlertTriangle },
              { label: "Out of Stock", value: outOfStockItems.length, color: "text-destructive", icon: AlertTriangle },
            ].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Alerts ({lowStockItems.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-card rounded-xl p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.products?.image_url && <img src={item.products.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.products?.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.warehouses?.name} · {item.bin_location || "No bin"}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warehouse Overview */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-primary" /> Warehouses ({warehouses.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {warehouses.map(wh => {
                const whStock = stock.filter(s => s.warehouse_id === wh.id);
                const totalInWH = whStock.reduce((s, i) => s + i.quantity, 0);
                const skuCount = whStock.length;
                return (
                  <div key={wh.id} className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{wh.name}</p>
                      <p className="text-[10px] text-muted-foreground">{wh.code} · {wh.city || wh.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{totalInWH.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{skuCount} SKUs</p>
                    </div>
                  </div>
                );
              })}
              {warehouses.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-2 text-center py-4">No warehouses yet. Add one in the Warehouses tab.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WAREHOUSES ═══ */}
      {tab === "warehouses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">Manage Warehouses</h3>
            <button onClick={() => setShowWHForm(!showWHForm)}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 touch-manipulation">
              <Plus className="w-3 h-3" /> Add Warehouse
            </button>
          </div>

          <AnimatePresence>
            {showWHForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "name", label: "Name", placeholder: "Main Warehouse" },
                      { key: "code", label: "Code", placeholder: "WH-01" },
                      { key: "address", label: "Address", placeholder: "123 Street" },
                      { key: "city", label: "City", placeholder: "Dhaka" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                        <input value={(whForm as any)[f.key]} onChange={e => setWhForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ))}
                  </div>
                  <button onClick={saveWarehouse} disabled={whSaving}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 touch-manipulation">
                    {whSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Warehouse
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {warehouses.map(wh => (
              <div key={wh.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">{wh.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">{wh.code}</span>
                    {wh.is_default && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">Default</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{[wh.address, wh.city, wh.country].filter(Boolean).join(", ") || "No address"}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${wh.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STOCK ═══ */}
      {tab === "stock" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product, SKU, bin..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Warehouse</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Reserved</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Available</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Bin</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredStock.map(item => {
                    const available = item.quantity - item.reserved_quantity;
                    const isLow = item.quantity <= item.reorder_level && item.quantity > 0;
                    const isOut = item.quantity === 0;
                    return (
                      <tr key={item.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.products?.image_url && <img src={item.products.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                            <div>
                              <p className="font-medium text-foreground truncate max-w-[180px]">{item.products?.title}</p>
                              <p className="text-[10px] text-muted-foreground">{item.products?.sku || "No SKU"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.warehouses?.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.reserved_quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{available}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.bin_location || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isOut ? "bg-destructive/10 text-destructive" :
                            isLow ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                            "bg-green-500/10 text-green-600 dark:text-green-400"
                          }`}>
                            {isOut ? "Out" : isLow ? "Low" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStock.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No stock records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADJUST ═══ */}
      {tab === "adjust" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4 text-primary" /> Manual Stock Adjustment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Warehouse</label>
              <select value={adjustForm.warehouse_id} onChange={e => setAdjustForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Product</label>
              <select value={adjustForm.product_id} onChange={e => setAdjustForm(prev => ({ ...prev, product_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.title} {p.sku ? `(${p.sku})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantity Change</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setAdjustForm(prev => ({ ...prev, quantity_change: prev.quantity_change - 1 }))}
                  className="p-2.5 rounded-xl border border-border hover:bg-secondary touch-manipulation">
                  <Minus className="w-4 h-4" />
                </button>
                <input type="number" value={adjustForm.quantity_change}
                  onChange={e => setAdjustForm(prev => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={() => setAdjustForm(prev => ({ ...prev, quantity_change: prev.quantity_change + 1 }))}
                  className="p-2.5 rounded-xl border border-border hover:bg-secondary touch-manipulation">
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-[10px] mt-1 ${adjustForm.quantity_change > 0 ? "text-green-500" : adjustForm.quantity_change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {adjustForm.quantity_change > 0 ? `+${adjustForm.quantity_change} (restock)` : adjustForm.quantity_change < 0 ? `${adjustForm.quantity_change} (remove)` : "No change"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason</label>
              <input value={adjustForm.reason} onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Restock, damaged, correction..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <button onClick={submitAdjustment} disabled={adjustSaving}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 touch-manipulation">
            {adjustSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Apply Adjustment
          </button>
        </div>
      )}

      {/* ═══ HISTORY ═══ */}
      {tab === "history" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-primary" /> Stock Adjustment History
            </h4>
          </div>
          <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
            {adjustments.map(adj => (
              <div key={adj.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{adj.products?.title || "Unknown"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {adj.warehouses?.name} · {adj.adjustment_type} · {adj.reason || "No reason"}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{new Date(adj.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={`text-sm font-bold ${adj.quantity_change > 0 ? "text-green-500" : "text-destructive"}`}>
                    {adj.quantity_change > 0 ? "+" : ""}{adj.quantity_change}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{adj.previous_quantity} → {adj.new_quantity}</p>
                </div>
              </div>
            ))}
            {adjustments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs">No adjustments yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
