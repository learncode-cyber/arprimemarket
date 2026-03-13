import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Wallet, Truck, Store,
  Menu, X, ChevronRight, Activity, Globe, Zap, Gift, Megaphone, Database, Warehouse,
  BookOpen, HelpCircle, MessageCircle, Ticket, Brain, PanelLeft, RotateCcw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { toast } from "sonner";
import AdminARChat from "@/components/admin/AdminARChat";

const adminTabs = [
  { id: "dashboard", path: "/ar", label: "Dashboard", icon: LayoutDashboard },
  { id: "bi", path: "/ar/bi", label: "Analytics BI", icon: Activity },
  { id: "site-content", path: "/ar/site-content", label: "Site Content", icon: PanelLeft },
  { id: "products", path: "/ar/products", label: "Products", icon: Package },
  { id: "categories", path: "/ar/categories", label: "Categories", icon: Store },
  { id: "orders", path: "/ar/orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", path: "/ar/customers", label: "Customers", icon: Users },
  { id: "coupons", path: "/ar/coupons", label: "Coupons", icon: Tag },
  { id: "promotions", path: "/ar/promotions", label: "Promotions", icon: Zap },
  { id: "referrals", path: "/ar/referrals", label: "Referrals", icon: Gift },
  { id: "campaigns", path: "/ar/campaigns", label: "Campaigns", icon: Megaphone },
  { id: "affiliates", path: "/ar/affiliates", label: "Affiliates", icon: Users },
  { id: "payments", path: "/ar/payments", label: "Payments", icon: Wallet },
  { id: "shipping", path: "/ar/shipping", label: "Shipping", icon: Truck },
  { id: "suppliers", path: "/ar/suppliers", label: "Suppliers", icon: Store },
  { id: "inventory", path: "/ar/inventory", label: "Inventory", icon: Warehouse },
  { id: "blog", path: "/ar/blog", label: "Blog", icon: BookOpen },
  { id: "helpcenter", path: "/ar/helpcenter", label: "Help Center", icon: HelpCircle },
  { id: "faq", path: "/ar/faq", label: "FAQ", icon: HelpCircle },
  { id: "chat", path: "/ar/chat", label: "Live Chat", icon: MessageCircle },
  { id: "tickets", path: "/ar/tickets", label: "Tickets", icon: Ticket },
  { id: "returns", path: "/ar/returns", label: "Returns", icon: RotateCcw },
  { id: "tracking", path: "/ar/tracking", label: "Tracking", icon: Activity },
  { id: "seo", path: "/ar/seo", label: "SEO", icon: Globe },
  { id: "ai-assistant", path: "/ar/ai-assistant", label: "AI Assistant", icon: Brain },
  { id: "api-keys", path: "/ar/api-keys", label: "API Keys", icon: Zap },
  { id: "webhooks", path: "/ar/webhooks", label: "Webhooks", icon: Globe },
  { id: "backup", path: "/ar/backup", label: "System", icon: Database },
  { id: "account", path: "/ar/account", label: "Account & Security", icon: KeyRound },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login");
      toast.error("Admin access required");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying admin session…</p>
      </div>
    </div>
  );
  if (!user || !isAdmin) return null;

  const activeTab = adminTabs.find(t => {
    if (t.path === "/ar") return location.pathname === "/ar" || location.pathname === "/ar/";
    return location.pathname.startsWith(t.path);
  })?.id || "dashboard";

  const handleNav = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-sm font-bold text-foreground">AR Prime Admin</h1>
        <div className="w-9" />
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen sticky top-0 bg-card border-r border-border p-4">
          <div className="mb-8">
            <h1 className="font-display text-lg font-bold text-foreground">AR Prime</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admin Panel</p>
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {adminTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground">v2.0 · Enterprise</p>
          </div>
        </aside>

        {/* Sidebar - Mobile Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 z-50 lg:hidden overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="font-display text-lg font-bold text-foreground">AR Prime</h1>
                    <p className="text-[10px] text-muted-foreground">Admin Panel</p>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {adminTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleNav(tab.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {activeTab === tab.id && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>

      <AdminARChat />
    </div>
  );
};

export default AdminLayout;
