import { motion } from "framer-motion";
import { useState } from "react";
import { LayoutDashboard, Package, ShoppingBag, Plus, Trash2 } from "lucide-react";
import { products as dummyProducts } from "@/lib/dummyData";

const adminTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "add", label: "Add Product", icon: Plus },
];

const dummyAdminOrders = [
  { id: "ORD-001", customer: "John Doe", total: 249.99, status: "Delivered", date: "2026-02-15" },
  { id: "ORD-002", customer: "Jane Smith", total: 189.99, status: "Shipped", date: "2026-02-14" },
  { id: "ORD-003", customer: "Bob Wilson", total: 399.98, status: "Processing", date: "2026-02-13" },
  { id: "ORD-004", customer: "Alice Brown", total: 129.99, status: "Pending", date: "2026-02-12" },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container max-w-6xl mx-auto px-6 py-12">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold text-foreground mb-10">
        Admin Panel
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-4 h-fit space-y-1 float-shadow">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Revenue", value: "$12,459.00", color: "text-primary" },
                  { label: "Total Orders", value: "156", color: "text-accent" },
                  { label: "Products", value: `${dummyProducts.length}`, color: "text-foreground" },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-2xl p-6">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`font-display text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-right px-6 py-4 font-medium text-muted-foreground">Action</th>
                  </tr></thead>
                  <tbody>
                    {dummyProducts.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-medium text-foreground">{p.title}</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{p.category}</td>
                        <td className="px-6 py-4 text-foreground font-medium">${p.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-muted-foreground">{p.rating}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-6 py-4 font-medium text-muted-foreground">Total</th>
                  </tr></thead>
                  <tbody>
                    {dummyAdminOrders.map((o) => (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{o.id}</td>
                        <td className="px-6 py-4 text-muted-foreground">{o.customer}</td>
                        <td className="px-6 py-4 text-muted-foreground">{o.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            o.status === "Delivered" ? "bg-green-500/10 text-green-500" :
                            o.status === "Shipped" ? "bg-blue-500/10 text-blue-500" :
                            o.status === "Processing" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                          }`}>{o.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">${o.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "add" && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Add New Product</h2>
              <form className="space-y-4">
                <div><label className="text-sm text-muted-foreground">Product Name</label><input placeholder="Product title" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-sm text-muted-foreground">Price</label><input type="number" placeholder="0.00" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                  <div><label className="text-sm text-muted-foreground">Category</label><select className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"><option>Electronics</option><option>Fashion</option><option>Accessories</option><option>Home</option></select></div>
                </div>
                <div><label className="text-sm text-muted-foreground">Image URL</label><input placeholder="https://..." className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">Description</label><textarea rows={4} placeholder="Product description..." className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary">
                  Add Product
                </motion.button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
