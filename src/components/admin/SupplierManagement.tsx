import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Package, ShoppingCart, Plus, Trash2, RefreshCw, Upload, ExternalLink, Loader2, ChevronDown, Settings, Zap } from "lucide-react";
import { useSuppliers, useSupplierProducts, useSupplierOrders, Supplier, SupplierProduct } from "@/hooks/useSupplier";
import { useCategories } from "@/hooks/useProductData";
import { toast } from "sonner";

type SubTab = "suppliers" | "products" | "orders";

const SupplierManagement = () => {
  const [subTab, setSubTab] = useState<SubTab>("suppliers");
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>();

  return (
    <div className="space-y-5">
      {/* Sub tabs */}
      <div className="flex gap-2">
        {([
          { id: "suppliers" as SubTab, label: "Suppliers", icon: Store },
          { id: "products" as SubTab, label: "Products", icon: Package },
          { id: "orders" as SubTab, label: "Supplier Orders", icon: ShoppingCart },
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
      </AnimatePresence>
    </div>
  );
};

// ─── Suppliers Tab ───
const SuppliersTab = ({ onSelectSupplier }: { onSelectSupplier: (id: string) => void }) => {
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", api_type: "manual", api_url: "", base_url: "", markup_percentage: "30", notes: "" });

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
      });
      toast.success("Supplier added");
      setForm({ name: "", api_type: "manual", api_url: "", base_url: "", markup_percentage: "30", notes: "" });
      setShowAdd(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (s: Supplier) => {
    await updateSupplier(s.id, { is_active: !s.is_active });
    toast.success(`${s.name} ${s.is_active ? "disabled" : "enabled"}`);
  };

  const handleToggleSync = async (s: Supplier) => {
    await updateSupplier(s.id, { auto_sync: !s.auto_sync });
    toast.success(`Auto-sync ${s.auto_sync ? "disabled" : "enabled"} for ${s.name}`);
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

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Supplier Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="AliExpress, CJ Dropshipping..." className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">API Type</label>
                  <select value={form.api_type} onChange={e => setForm(p => ({ ...p, api_type: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="manual">Manual</option>
                    <option value="aliexpress">AliExpress API</option>
                    <option value="cj">CJ Dropshipping</option>
                    <option value="custom">Custom API</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">API / Base URL</label>
                  <input value={form.api_url} onChange={e => setForm(p => ({ ...p, api_url: e.target.value }))} placeholder="https://api.supplier.com" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Markup %</label>
                  <input type="number" value={form.markup_percentage} onChange={e => setForm(p => ({ ...p, markup_percentage: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
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

      {/* Suppliers List */}
      <div className="space-y-3">
        {suppliers.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground">{s.name}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground">
                  {s.api_type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Markup: {Number(s.markup_percentage)}% · 
                {s.auto_sync ? ` Auto-sync every ${s.sync_interval_hours}h` : " Manual sync"} ·
                {s.last_synced_at ? ` Last: ${new Date(s.last_synced_at).toLocaleDateString()}` : " Never synced"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => onSelectSupplier(s.id)} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation flex items-center gap-1">
                <Package className="w-3 h-3" /> Products
              </button>
              <button onClick={() => handleToggleSync(s)} className={`p-1.5 rounded-lg transition-colors touch-manipulation ${s.auto_sync ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`} title="Toggle auto-sync">
                <Zap className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleToggle(s)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors touch-manipulation" title="Toggle active">
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { deleteSupplier(s.id); toast.success("Deleted"); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors touch-manipulation">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
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
  const { data: categories = [] } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [form, setForm] = useState({ external_id: "", external_title: "", external_price: "", external_stock: "0", external_url: "", external_image_url: "" });

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
      });
      toast.success("Product added to import queue");
      setForm({ external_id: "", external_title: "", external_price: "", external_stock: "0", external_url: "", external_image_url: "" });
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
    if (!supplier) return;
    const pending = products.filter(p => !p.is_imported);
    if (pending.length === 0) { toast.info("No products to import"); return; }
    for (const sp of pending) {
      try {
        await importProduct(sp, Number(supplier.markup_percentage));
      } catch {}
    }
    toast.success(`${pending.length} products imported!`);
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
          <button onClick={handleBulkImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-border transition-colors touch-manipulation">
            <Upload className="w-3 h-3" /> Bulk Import
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium touch-manipulation">
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {/* Add Product Form */}
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
              <div className="flex gap-2">
                <button onClick={handleAddProduct} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">Add to Queue</button>
                <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products List */}
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
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">৳{Number(sp.external_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sp.external_stock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        sp.is_imported ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                      }`}>
                        {sp.is_imported ? "Imported" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!sp.is_imported && (
                          <button
                            onClick={() => handleImport(sp)}
                            disabled={importing === sp.id}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors touch-manipulation disabled:opacity-50"
                          >
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
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No supplier products. Add products above or sync from supplier API.</td></tr>
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
  const { orders, loading, updateSupplierOrder } = useSupplierOrders();
  const { suppliers } = useSuppliers();

  const statusOptions = ["pending", "forwarded", "processing", "shipped", "delivered", "cancelled"];

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-primary" /> Supplier Orders ({orders.length})
      </h3>

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
                      <input
                        defaultValue={o.external_order_id || ""}
                        onBlur={e => updateSupplierOrder(o.id, { external_order_id: e.target.value || null })}
                        placeholder="Enter ID"
                        className="w-28 px-2 py-1 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={o.status}
                        onChange={e => { updateSupplierOrder(o.id, { status: e.target.value }); toast.success("Status updated"); }}
                        className="px-2 py-1 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        defaultValue={o.tracking_number || ""}
                        onBlur={e => updateSupplierOrder(o.id, { tracking_number: e.target.value || null })}
                        placeholder="Tracking #"
                        className="w-28 px-2 py-1 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
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

export default SupplierManagement;
