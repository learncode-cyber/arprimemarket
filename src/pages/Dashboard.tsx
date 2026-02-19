import { motion } from "framer-motion";
import { User, Package, Settings, LogOut } from "lucide-react";
import { useState } from "react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "settings", label: "Settings", icon: Settings },
];

const dummyOrders = [
  { id: "ORD-001", date: "2026-02-15", status: "Delivered", total: 249.99 },
  { id: "ORD-002", date: "2026-02-10", status: "Shipped", total: 189.99 },
  { id: "ORD-003", date: "2026-01-28", status: "Processing", total: 399.98 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="container max-w-6xl mx-auto px-6 py-12">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold text-foreground mb-10">
        Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-4 h-fit space-y-1 float-shadow">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Profile Information</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">John Doe</h3>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm text-muted-foreground">First Name</label><input defaultValue="John" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">Last Name</label><input defaultValue="Doe" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">Email</label><input defaultValue="john@example.com" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">Phone</label><input defaultValue="+1 234 567 890" className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="glass rounded-2xl p-8 space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Order History</h2>
              <div className="space-y-3">
                {dummyOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <span className="font-medium text-sm text-foreground">{order.id}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === "Delivered" ? "bg-green-500/10 text-green-500" :
                      order.status === "Shipped" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-display font-semibold text-foreground">${order.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div><span className="text-sm font-medium text-foreground">Email Notifications</span><p className="text-xs text-muted-foreground">Receive order updates via email</p></div>
                  <div className="w-11 h-6 rounded-full bg-primary relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-primary-foreground" /></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div><span className="text-sm font-medium text-foreground">Marketing Emails</span><p className="text-xs text-muted-foreground">Get deals and promotions</p></div>
                  <div className="w-11 h-6 rounded-full bg-muted relative cursor-pointer"><div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-muted-foreground/50" /></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
