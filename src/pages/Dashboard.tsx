import { motion } from "framer-motion";
import { User, Package, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "settings", label: "Settings", icon: Settings },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="container max-w-6xl mx-auto px-6 py-12">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold text-foreground mb-10">
        Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-4 h-fit space-y-1 float-shadow">
          {tabs.map((tab) => (
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
          <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Profile Information</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{profile?.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm text-muted-foreground">Full Name</label><input defaultValue={profile?.full_name || ""} className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">Email</label><input defaultValue={user.email || ""} disabled className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none opacity-50" /></div>
                <div><label className="text-sm text-muted-foreground">Phone</label><input defaultValue={profile?.phone || ""} className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div><label className="text-sm text-muted-foreground">City</label><input defaultValue={profile?.city || ""} className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="glass rounded-2xl p-8 space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Order History</h2>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div>
                        <span className="font-medium text-sm text-foreground">{order.order_number}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "delivered" ? "bg-green-500/10 text-green-500" :
                        order.status === "shipped" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {order.status}
                      </span>
                      <span className="font-display font-semibold text-foreground">${Number(order.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
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
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
