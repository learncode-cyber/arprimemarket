import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Package, ShoppingCart, Plus, Trash2, RefreshCw, Upload, ExternalLink, Loader2, Settings, Zap, Clock, AlertTriangle, CheckCircle, Key, ArrowUpDown, Wifi, WifiOff, BarChart3, Globe, Shield } from "lucide-react";
import { useSuppliers, useSupplierProducts, useSupplierOrders, useSyncLogs, invokeSupplierSync, Supplier, SupplierProduct } from "@/hooks/useSupplier";
import { toast } from "sonner";

type SubTab = "overview" | "suppliers" | "products" | "orders" | "logs";

const platformInfo: Record<string, { label: string; color: string; guide: string }> = {
  manual: { label: "Manual", color: "bg-muted text-muted-foreground", guide: "Add products manually. No API connection needed." },
  cj: { label: "CJ Dropshipping", color: "bg-blue-500/10 text-blue-600", guide: "Enter your CJ API URL (https://developers.cjdropshipping.com/api2.0) and set your API key secret name." },
  aliexpress: { label: "AliExpress", color: "bg-orange-500/10 text-orange-600", guide: "Use AliExpress API endpoint and your app key as the API secret." },
  custom: { label: "Custom API", color: "bg-purple-500/10 text-purple-600", guide: "Any REST API with /products and /orders endpoints. Bearer token auth." },
};

const SupplierManagement = () => {
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>();

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {([
          { id: "overview" as SubTab, label: "Overview", icon: BarChart3 },
          { id: "suppliers" as SubTab, label: "Suppliers", icon: Store },
          { id: "products" as SubTab, label: "Products", icon: Package },
          { id: "orders" as SubTab, label: "Orders", icon: ShoppingCart },
          { id: "logs" as SubTab, label: "Sync Logs", icon: Clock },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all touch-manipulation ${
              subTab === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <HealthOverview onNavigate={(tab) => setSubTab(tab)} />
          </motion.div>
        )}
        {subTab === "suppliers" && (
          <motion.div key="suppliers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SuppliersTab onSelectSupplier={(id) => { setSelectedSupplier(id); setSubTab("products"); }} />
          </motion.div>
        )}
        {subTab === "products" && (
          <motion.div key="products" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SupplierProductsTab supplierId={selectedSupplier} />
          </motion.div>
        )}
        {subTab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SupplierOrdersTab />
          </motion.div>
        )}
        {subTab === "logs" && (
          <motion.div key="logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SyncLogsTab supplierId={selectedSupplier} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Health Overview ───
const HealthOverview = ({ onNavigate }: { onNavigate: (tab: SubTab) => void }) => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await invokeSupplierSync("get_health");
        setHealth(data);
      } catch { setHealth(null); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const stats = [
    { label: "Suppliers", value: health?.suppliers || 0, active: health?.activeSuppliers || 0, icon: Store, tab: "suppliers" as SubTab },
    { label: "Total Products", value: health?.totalProducts || 0, sub: `${health?.importedProducts || 0} imported`, icon: Package, tab: "products" as SubTab },
    { label: "Errors", value: health?.errorProducts || 0, sub: "products with errors", icon: AlertTriangle, tab: "products" as SubTab },
    { label: "Pending Orders", value: health?.pendingOrders || 0, sub: "awaiting forwarding", icon: ShoppingCart, tab: "orders" as SubTab },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Dropshipping Overview
        </h3>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-xs">
          <Shield className="w-3 h-3 text-primary" />
          Success Rate: <span className="font-bold text-foreground">{health?.syncSuccessRate || 100}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <button key={s.label} onClick={() => onNavigate(s.tab)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
            {"active" in s && s.active !== undefined && <p className="text-[10px] text-primary mt-0.5">{s.active} active</p>}
          </button>
        ))}
      </div>

      {health?.platforms?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Platforms:</span>
          {health.platforms.map((p: string) => (
            <span key={p} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${platformInfo[p]?.color || "bg-muted text-muted-foreground"}`}>
              {platformInfo[p]?.label || p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Suppliers Tab ───
const SuppliersTab = ({ onSelectSupplier }: { onSelectSupplier: (id: string) => void }) => {
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [form, setForm] = useState({
    name: "", api_type: "manual", api_url: "", base_url: "",
    markup_percentage: "30", notes: "", api_key_secret: "", auto_forward_orders: false,
  });

  const handleAdd = async () => {
    if (!form.name) { toast.error("Supplier name required"); return; }
    try {
      await addSupplier({
        name: form.name,
        api_type: form.api_type,
        api_url: form.api_url || null,
        base_url: form.base_url || null,
        markup_percentage: parseFloat(form.markup_percentage) || 30,
        notes: form.notes || null,
        api_key_secret: form.api_key_secret || null,
        auto_forward_orders: form.auto_forward_orders,
      });
      toast.success("Supplier added");
      setForm({ name: "", api_type: "manual", api_url: "", base_url: "", markup_percentage: "30", notes: "", api_key_secret: "", auto_forward_orders: false });
      setShowAdd(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleTestConnection = async (supplier: Supplier) => {
    setTesting(supplier.id);
    try {
      const result = await invokeSupplierSync("test_connection", { supplier_id: supplier.id });
      setConnectionResults(prev => ({ ...prev, [supplier.id]: result }));
      if (result.ok) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (err: any) {
      setConnectionResults(prev => ({ ...prev, [supplier.id]: { ok: false, message: err.message } }));
      toast.error(err.message);
    }
    setTesting(null);
  };

  const handleAutoImport = async (supplier: Supplier) => {
    if (!supplier.api_url) { toast.error("No API URL configured"); return; }
    setSyncing(supplier.id);
    try {
      const result = await invokeSupplierSync("auto_import", { supplier_id: supplier.id });
      toast.success(`Imported ${result.processed} products${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
    } catch (err: any) { toast.error(err.message); }
    setSyncing(null);
  };

  const handleSyncAll = async (supplier: Supplier, action: string) => {
    setSyncing(supplier.id);
    try {
      const result = await invokeSupplierSync(action, { supplier_id: supplier.id });
      toast.success(`${action.replace(/_/g, " ")}: ${result.synced || result.imported || 0} items processed`);
    } catch (err: any) { toast.error(err.message); }
    setSyncing(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" /> Suppliers ({suppliers.length})
        </h3>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium touch-manipulation">
          <Plus className="w-3.5 h-3.5" /> Add Supplier
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-3">
              {/* Platform guide */}
              {form.api_type !== "manual" && platformInfo[form.api_type] && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{platformInfo[form.api_type].label} Setup</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{platformInfo[form.api_type].guide}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Supplier Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="AliExpress, CJ Dropshipping..." className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Platform Type</label>
                  <select value={form.api_type} onChange={e => setForm(p => ({ ...p, api_type: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="manual">Manual (No API)</option>
                    <option value="cj">CJ Dropshipping</option>
                    <option value="aliexpress">AliExpress</option>
                    <option value="custom">Custom REST API</option>
                  </select>
                </div>
                {form.api_type !== "manual" && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">API URL *</label>
                      <input value={form.api_url} onChange={e => setForm(p => ({ ...p, api_url: e.target.value }))}
                        placeholder={form.api_type === "cj" ? "https://developers.cjdropshipping.com/api2.0" : "https://api.supplier.com"}
                        className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground flex items-center gap-1"><Key className="w-3 h-3" /> API Key Secret Name</label>
                      <input value={form.api_key_secret} onChange={e => setForm(p => ({ ...p, api_key_secret: e.target.value }))} placeholder="SUPPLIER_API_KEY"
                        className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">Secret stored securely in backend environment</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs text-muted-foreground">Markup %</label>
                  <input type="number" value={form.markup_percentage} onChange={e => setForm(p => ({ ...p, markup_percentage: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input type="checkbox" checked={form.auto_forward_orders} onChange={e => setForm(p => ({ ...p, auto_forward_orders: e.target.checked }))} className="rounded" />
                  <label className="text-xs text-muted-foreground">Auto-forward orders to supplier</label>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">Save Supplier</button>
                <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {suppliers.map(s => {
          const connResult = connectionResults[s.id];
          const pInfo = platformInfo[s.api_type] || platformInfo.custom;

          return (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm text-foreground">{s.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${pInfo.color}`}>{pInfo.label}</span>
                    {s.api_key_secret && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent-foreground"><Key className="w-2.5 h-2.5 inline mr-0.5" />API Key Set</span>}
                    {s.auto_forward_orders && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">Auto-Forward</span>}
                    {connResult && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5 ${
                        connResult.ok ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                      }`}>
                        {connResult.ok ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                        {connResult.ok ? "Connected" : "Failed"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Markup: {Number(s.markup_percentage)}% ·
                    {s.auto_sync ? ` Auto-sync ${s.sync_interval_hours}h` : " Manual"} ·
                    {s.last_synced_at ? ` Last: ${new Date(s.last_synced_at).toLocaleDateString()}` : " Never synced"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* Test Connection */}
                  {s.api_type !== "manual" && (
                    <button
                      onClick={() => handleTestConnection(s)}
                      disabled={testing === s.id}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation disabled:opacity-50 flex items-center gap-1"
                    >
                      {testing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                      Test
                    </button>
                  )}
                  {s.api_url && (
                    <>
                      <button onClick={() => handleAutoImport(s)} disabled={syncing === s.id}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors touch-manipulation disabled:opacity-50 flex items-center gap-1">
                        {syncing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Fetch
                      </button>
                      <button onClick={() => handleSyncAll(s, "sync_stock")} disabled={syncing === s.id}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation disabled:opacity-50 flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3" /> Stock
                      </button>
                      <button onClick={() => handleSyncAll(s, "sync_prices")} disabled={syncing === s.id}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation disabled:opacity-50 flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3" /> Prices
                      </button>
                    </>
                  )}
                  <button onClick={() => onSelectSupplier(s.id)} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation flex items-center gap-1">
                    <Package className="w-3 h-3" /> Products
                  </button>
                  <button onClick={() => updateSupplier(s.id, { auto_sync: !s.auto_sync })} className={`p-1.5 rounded-lg transition-colors touch-manipulation ${s.auto_sync ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`} title="Toggle auto-sync">
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => updateSupplier(s.id, { is_active: !s.is_active })} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors touch-manipulation" title="Toggle active">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { deleteSupplier(s.id); toast.success("Deleted"); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors touch-manipulation">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Webhook URL info for API suppliers */}
              {s.api_type !== "manual" && s.webhook_url && (
                <div className="text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5">
                  Webhook: <code className="text-foreground">{s.webhook_url}</code>
                </div>
              )}
            </div>
          );
        })}
        {suppliers.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No suppliers yet. Add your first supplier above.</div>
        )}
      </div>
    </div>
  );
};

// ─── Supplier Products Tab ───
const SupplierProductsTab = ({ supplierId }: { supplierId?: string }) => {
  const { suppliers } = useSuppliers();
  const [activeSupplier, setActiveSupplier] = useState(supplierId || "");
  const { products, loading, importProduct, addSupplierProduct, deleteSupplierProduct } = useSupplierProducts(activeSupplier || undefined);
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [form, setForm] = useState({ external_id: "", external_title: "", external_price: "", external_stock: "0", external_url: "", external_image_url: "", external_description: "" });

  const supplier = suppliers.find(s => s.id === activeSupplier);

  const handleAddProduct = async () => {
    if (!activeSupplier || !form.external_id || !form.external_title) { toast.error("Supplier, ID and title required"); return; }
    try {
      await addSupplierProduct({
        supplier_id: activeSupplier,
        external_id: form.external_id,
        external_title: form.external_title,
        external_price: parseFloat(form.external_price) || 0,
        external_stock: parseInt(form.external_stock) || 0,
        external_url: form.external_url || null,
        external_image_url: form.external_image_url || null,
        external_description: form.external_description || null,
      });
      toast.success("Product added");
      setForm({ external_id: "", external_title: "", external_price: "", external_stock: "0", external_url: "", external_image_url: "", external_description: "" });
      setShowAdd(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleImport = async (sp: SupplierProduct) => {
    if (!supplier) return;
    setImporting(sp.id);
    try {
      await importProduct(sp, Number(supplier.markup_percentage));
      toast.success(`"${sp.external_title}" imported!`);
    } catch (err: any) { toast.error(err.message); }
    setImporting(null);
  };

  const handleBulkImport = async () => {
    if (!activeSupplier) { toast.error("Select a supplier"); return; }
    setBulkImporting(true);
    try {
      const result = await invokeSupplierSync("bulk_import", { supplier_id: activeSupplier });
      toast.success(`Imported ${result.imported}/${result.total} products${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
    } catch (err: any) { toast.error(err.message); }
    setBulkImporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Supplier Products
          </h3>
          <select value={activeSupplier} onChange={e => setActiveSupplier(e.target.value)} className="px-3 py-1.5 rounded-xl bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
            <option value="">All suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBulkImport} disabled={bulkImporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation disabled:opacity-50">
            {bulkImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Bulk Import
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium touch-manipulation">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">External ID *</label>
                  <input value={form.external_id} onChange={e => setForm(p => ({ ...p, external_id: e.target.value }))} placeholder="SKU or product ID" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Title *</label>
                  <input value={form.external_title} onChange={e => setForm(p => ({ ...p, external_title: e.target.value }))} placeholder="Product title" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Supplier Price</label>
                  <input type="number" value={form.external_price} onChange={e => setForm(p => ({ ...p, external_price: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Stock</label>
                  <input type="number" value={form.external_stock} onChange={e => setForm(p => ({ ...p, external_stock: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Product URL</label>
                  <input value={form.external_url} onChange={e => setForm(p => ({ ...p, external_url: e.target.value }))} placeholder="https://..." className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Image URL</label>
                  <input value={form.external_image_url} onChange={e => setForm(p => ({ ...p, external_image_url: e.target.value }))} placeholder="https://..." className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <textarea value={form.external_description} onChange={e => setForm(p => ({ ...p, external_description: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddProduct} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">Add to Queue</button>
                <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Supplier ৳</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(sp => (
                  <tr key={sp.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {sp.external_image_url && <img src={sp.external_image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{sp.external_title}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {sp.external_id}</p>
                          {sp.import_errors && (
                            <p className="text-[10px] text-destructive flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> {sp.import_errors?.error}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">৳{Number(sp.external_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sp.external_stock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        sp.sync_status === "error" ? "bg-destructive/10 text-destructive" :
                        sp.is_imported ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
                      }`}>
                        {sp.sync_status === "error" ? "Error" : sp.is_imported ? "Imported" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!sp.is_imported && (
                          <button onClick={() => handleImport(sp)} disabled={importing === sp.id}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors touch-manipulation disabled:opacity-50">
                            {importing === sp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Import"}
                          </button>
                        )}
                        {sp.external_url && (
                          <a href={sp.external_url} target="_blank" rel="noopener" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        )}
                        <button onClick={() => { deleteSupplierProduct(sp.id); toast.success("Removed"); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No supplier products. Add products above or fetch from supplier API.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Supplier Orders Tab ───
const SupplierOrdersTab = () => {
  const { orders, loading, updateSupplierOrder, syncOrderStatuses } = useSupplierOrders();
  const { suppliers } = useSuppliers();
  const [syncing, setSyncing] = useState(false);

  const statusOptions = ["pending", "forwarded", "processing", "shipped", "delivered", "cancelled", "failed"];

  const handleSyncStatuses = async () => {
    setSyncing(true);
    try {
      const result = await syncOrderStatuses();
      toast.success(`Synced ${result.synced} order statuses`);
    } catch (err: any) { toast.error(err.message); }
    setSyncing(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" /> Supplier Orders ({orders.length})
        </h3>
        <button onClick={handleSyncStatuses} disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation disabled:opacity-50">
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync Statuses
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">External ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const supplier = suppliers.find(s => s.id === o.supplier_id);
                return (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{o.order_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{supplier?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <input defaultValue={o.external_order_id || ""} onBlur={e => updateSupplierOrder(o.id, { external_order_id: e.target.value || null })}
                        placeholder="Enter ID" className="w-28 px-2 py-1 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </td>
                    <td className="px-4 py-3">
                      <select defaultValue={o.status} onChange={e => { updateSupplierOrder(o.id, { status: e.target.value }); toast.success("Updated"); }}
                        className="px-2 py-1 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input defaultValue={o.tracking_number || ""} onBlur={e => updateSupplierOrder(o.id, { tracking_number: e.target.value || null })}
                        placeholder="Tracking #" className="w-28 px-2 py-1 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No supplier orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Sync Logs Tab ───
const SyncLogsTab = ({ supplierId }: { supplierId?: string }) => {
  const { logs, loading, fetchLogs } = useSyncLogs(supplierId);

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case "partial": return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
      case "failed": return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
      default: return <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />;
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Sync Logs
        </h3>
        <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
            <div className="mt-0.5">{statusIcon(log.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">{log.action.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-muted-foreground">{(log as any).suppliers?.name || ""}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  log.status === "success" ? "bg-green-500/10 text-green-600" :
                  log.status === "partial" ? "bg-yellow-500/10 text-yellow-600" :
                  log.status === "failed" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{log.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {log.items_processed} processed · {log.items_failed} failed ·
                {log.started_at && ` ${new Date(log.started_at).toLocaleString()}`}
                {log.completed_at && ` → ${new Date(log.completed_at).toLocaleTimeString()}`}
              </p>
              {log.error_details && Array.isArray(log.error_details) && log.error_details.length > 0 && (
                <div className="mt-1 text-[10px] text-destructive/80 bg-destructive/5 rounded p-1.5 max-h-20 overflow-auto">
                  {log.error_details.slice(0, 5).map((e: any, i: number) => (
                    <p key={i}>{e.externalId || e.product_id || e.order_id || ""}: {e.error}</p>
                  ))}
                  {log.error_details.length > 5 && <p>...and {log.error_details.length - 5} more</p>}
                </div>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No sync logs yet. Run a sync operation to see logs here.</div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;
