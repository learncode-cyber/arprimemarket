import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Wallet, Truck, Store,
  Menu, X, ChevronRight, Activity, Globe, Zap, Gift, Megaphone, Database, Warehouse,
  BookOpen, HelpCircle, MessageCircle, Ticket, Brain, PanelLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ProductManagement from "@/components/admin/ProductManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import CustomerManagement from "@/components/admin/CustomerManagement";
import CouponManagement from "@/components/admin/CouponManagement";
import PaymentSettings from "@/components/admin/PaymentSettings";
import ShippingManagement from "@/components/admin/ShippingManagement";
import SupplierManagement from "@/components/admin/SupplierManagement";
import TrackingManagement from "@/components/admin/TrackingManagement";
import SEOManagement from "@/components/admin/SEOManagement";
import PromotionManagement from "@/components/admin/PromotionManagement";
import ReferralManagement from "@/components/admin/ReferralManagement";
import CampaignManagement from "@/components/admin/CampaignManagement";
import BackupManagement from "@/components/admin/BackupManagement";
import APIHealthDashboard from "@/components/admin/APIHealthDashboard";
import InventoryManagement from "@/components/admin/InventoryManagement";
import BlogManagement from "@/components/admin/BlogManagement";
import HelpCenterManagement from "@/components/admin/HelpCenterManagement";
import FAQManagement from "@/components/admin/FAQManagement";
import ChatManagement from "@/components/admin/ChatManagement";
import TicketManagement from "@/components/admin/TicketManagement";
import AIAssistantDashboard from "@/components/admin/AIAssistantDashboard";
import SiteContentManagement from "@/components/admin/SiteContentManagement";
import AdminARChat from "@/components/admin/AdminARChat";
import BusinessIntelligence from "@/components/admin/BusinessIntelligence";

const adminTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "site-content", label: "Site Content", icon: PanelLeft },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "promotions", label: "Promotions", icon: Zap },
  { id: "referrals", label: "Referrals", icon: Gift },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "suppliers", label: "Suppliers", icon: Store },
  { id: "inventory", label: "Inventory", icon: Warehouse },
  { id: "blog", label: "Blog", icon: BookOpen },
  { id: "helpcenter", label: "Help Center", icon: HelpCircle },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "chat", label: "Live Chat", icon: MessageCircle },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "tracking", label: "Tracking", icon: Activity },
  { id: "seo", label: "SEO", icon: Globe },
  { id: "ai-assistant", label: "AI Assistant", icon: Brain },
  { id: "backup", label: "System", icon: Database },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/login");
      toast.error("Admin access required");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
    </div>
  );
  if (!user || !isAdmin) return null;

  const handleTabClick = (id: string) => {
    setActiveTab(id);
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
          <nav className="space-y-1 flex-1">
            {adminTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 z-50 lg:hidden"
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
                      onClick={() => handleTabClick(tab.id)}
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "dashboard" && <AdminDashboard />}
              {activeTab === "site-content" && <SiteContentManagement />}
              {activeTab === "products" && <ProductManagement />}
              {activeTab === "orders" && <OrderManagement />}
              {activeTab === "customers" && <CustomerManagement />}
              {activeTab === "coupons" && <CouponManagement />}
              {activeTab === "promotions" && <PromotionManagement />}
              {activeTab === "referrals" && <ReferralManagement />}
              {activeTab === "campaigns" && <CampaignManagement />}
              {activeTab === "payments" && (
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                  <PaymentSettings />
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                  <ShippingManagement />
                </div>
              )}
              {activeTab === "suppliers" && <SupplierManagement />}
              {activeTab === "inventory" && <InventoryManagement />}
              {activeTab === "blog" && <BlogManagement />}
              {activeTab === "helpcenter" && <HelpCenterManagement />}
              {activeTab === "faq" && <FAQManagement />}
              {activeTab === "chat" && <ChatManagement />}
              {activeTab === "tickets" && <TicketManagement />}
              {activeTab === "tracking" && <TrackingManagement />}
              {activeTab === "seo" && <SEOManagement />}
              {activeTab === "ai-assistant" && <AIAssistantDashboard />}
              {activeTab === "backup" && (
                <div className="space-y-6">
                  <APIHealthDashboard />
                  <BackupManagement />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Admin AR Floating Chat */}
      <AdminARChat />
    </div>
  );
};

export default Admin;
