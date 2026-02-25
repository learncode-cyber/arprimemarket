import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LayoutDashboard, Package, ShoppingBag, Plus, Trash2, Tag, Users, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCategories } from "@/hooks/useProductData";
import { toast } from "sonner";
import PaymentSettings from "@/components/admin/PaymentSettings";
import OrderManagement from "@/components/admin/OrderManagement";

const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "add", label: "Add Product", icon: Plus },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const { data: categories = [] } = useCategories();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  const [newProduct, setNewProduct] = useState({ title: "", price: "", category_id: "", image_url: "", description: "" });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
      toast.error("Admin access required");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
      supabase.from("profiles").select("*").then(({ data }) => setCustomers(data || []));
      supabase.from("coupons").select("*").order("created_at", { ascending: false }).then(({ data }) => setCoupons(data || []));
    }
  }, [isAdmin]);

  const handleAddProduct = async () => {
    if (!newProduct.title || !newProduct.price) { toast.error("Title and price are required"); return; }
    const slug = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("products").insert({
      title: newProduct.title, slug: slug + "-" + Date.now(), price: parseFloat(newProduct.price),
      category_id: newProduct.category_id || null, image_url: newProduct.image_url || null,
      description: newProduct.description || null, is_active: true,
    });
    if (error) { toast.error(error.message); } else {
      toast.success("Product added!"); setNewProduct({ title: "", price: "", category_id: "", image_url: "", description: "" }); refetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Product deleted"); refetchProducts(); }
  };

  if (loading || !isAdmin) return null;

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-8">
        Admin Panel
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-3 h-fit space-y-1">
          {adminTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, color: "text-primary" },
                { label: "Total Orders", value: `${orders.length}`, color: "text-accent" },
                { label: "Products", value: `${products.length}`, color: "text-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`font-display text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "products" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-right px-6 py-4 font-medium text-muted-foreground">Action</th>
                  </tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-medium text-foreground">{p.title}</span>
                        </td>
                        <td className="px-6 py-4 text-foreground font-medium">৳{p.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-muted-foreground">{p.stock_quantity}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <OrderManagement />
          )}

          {activeTab === "customers" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">City</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Country</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Joined</th>
                  </tr></thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{c.full_name || "—"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{c.city || "—"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{c.country || "—"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No customers yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Value</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Used</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                  </tr></thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{c.code}</td>
                        <td className="px-6 py-4 text-muted-foreground">{c.discount_type}</td>
                        <td className="px-6 py-4 text-foreground">{c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${Number(c.discount_value).toLocaleString()}`}</td>
                        <td className="px-6 py-4 text-muted-foreground">{c.used_count}/{c.max_uses || "∞"}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>{c.is_active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                    {coupons.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No coupons yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <PaymentSettings />
            </div>
          )}

          {activeTab === "add" && (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Add New Product</h2>
              <div className="space-y-4">
                <div><label className="text-sm text-muted-foreground">Product Name</label><input value={newProduct.title} onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} placeholder="Product title" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-sm text-muted-foreground">Price</label><input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                  <div><label className="text-sm text-muted-foreground">Category</label>
                    <select value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))} className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="text-sm text-muted-foreground">Image URL</label><input value={newProduct.image_url} onChange={e => setNewProduct(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">Description</label><textarea rows={4} value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddProduct} type="button" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
                  Add Product
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
