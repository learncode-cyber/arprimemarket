import { motion, AnimatePresence } from "framer-motion";
import { User, Package, Settings, LogOut, ChevronRight, Clock, Truck, CheckCircle, XCircle, Eye, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
  shipped: { icon: Truck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  delivered: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  cancelled: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const tabs = [
  { id: "profile", label: "Profile", labelBn: "প্রোফাইল", labelAr: "الملف الشخصي", icon: User },
  { id: "orders", label: "Orders", labelBn: "অর্ডার", labelAr: "الطلبات", icon: Package },
  { id: "settings", label: "Settings", labelBn: "সেটিংস", labelAr: "الإعدادات", icon: Settings },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, signOut, loading } = useAuth();
  const { t, lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
    }
  }, [user]);

  const viewOrderDetails = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  const getTabLabel = (tab: typeof tabs[0]) => {
    if (lang.code === "bn") return tab.labelBn;
    if (lang.code === "ar") return tab.labelAr;
    return tab.label;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      pending: { en: "Pending", bn: "অপেক্ষমাণ", ar: "قيد الانتظار" },
      processing: { en: "Processing", bn: "প্রক্রিয়াধীন", ar: "قيد المعالجة" },
      shipped: { en: "Shipped", bn: "শিপ করা হয়েছে", ar: "تم الشحن" },
      delivered: { en: "Delivered", bn: "ডেলিভারি হয়েছে", ar: "تم التوصيل" },
      cancelled: { en: "Cancelled", bn: "বাতিল", ar: "ملغي" },
    };
    return labels[status]?.[lang.code] || status;
  };

  const getPaymentLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      unpaid: { en: "Unpaid", bn: "অপরিশোধিত", ar: "غير مدفوع" },
      pending: { en: "Pending", bn: "অপেক্ষমাণ", ar: "قيد الانتظار" },
      paid: { en: "Paid", bn: "পরিশোধিত", ar: "مدفوع" },
    };
    return labels[status]?.[lang.code] || status;
  };

  if (loading || !user) return null;

  const config = statusConfig[selectedOrder?.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Order detail view
  const renderOrderDetail = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <button onClick={() => setSelectedOrder(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
        <ArrowLeft className="w-4 h-4" /> {t("backToProducts").replace("Products", "Orders")}
      </button>

      {/* Status header */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{lang.code === "bn" ? "অর্ডার নম্বর" : lang.code === "ar" ? "رقم الطلب" : "Order Number"}</p>
            <h3 className="font-display font-bold text-lg text-foreground">{selectedOrder.order_number}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(selectedOrder.created_at).toLocaleDateString(lang.code === "bn" ? "bn-BD" : lang.code === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
              <StatusIcon className="w-3.5 h-3.5" /> {getStatusLabel(selectedOrder.status)}
            </span>
          </div>
        </div>

        {/* Order timeline */}
        {selectedOrder.tracking_number && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">{lang.code === "bn" ? "ট্র্যাকিং নম্বর" : lang.code === "ar" ? "رقم التتبع" : "Tracking Number"}</p>
            <p className="text-sm font-mono font-semibold text-foreground">{selectedOrder.tracking_number}</p>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <h4 className="font-display font-semibold text-sm text-foreground mb-3">{lang.code === "bn" ? "অর্ডার আইটেম" : lang.code === "ar" ? "عناصر الطلب" : "Order Items"}</h4>
        {loadingItems ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2.5">
            {orderItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                {item.image_url && <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity}x {formatPrice(Number(item.price))}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatPrice(Number(item.total))}</span>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span className="text-foreground">{formatPrice(Number(selectedOrder.subtotal))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("shipping")}</span><span className="text-foreground">{Number(selectedOrder.shipping_cost) > 0 ? formatPrice(Number(selectedOrder.shipping_cost)) : t("free")}</span></div>
          {Number(selectedOrder.discount_amount) > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">{lang.code === "bn" ? "ছাড়" : lang.code === "ar" ? "خصم" : "Discount"}</span><span className="text-green-500">-{formatPrice(Number(selectedOrder.discount_amount))}</span></div>
          )}
          <div className="flex justify-between pt-2 border-t border-border font-semibold">
            <span className="text-foreground">{t("total")}</span>
            <span className="font-display text-foreground">{formatPrice(Number(selectedOrder.total))}</span>
          </div>
        </div>
      </div>

      {/* Shipping & Payment info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h4 className="font-display font-semibold text-sm text-foreground mb-2">{lang.code === "bn" ? "শিপিং তথ্য" : lang.code === "ar" ? "معلومات الشحن" : "Shipping Info"}</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{selectedOrder.shipping_name}</p>
            <p>{selectedOrder.shipping_phone}</p>
            <p>{selectedOrder.shipping_email}</p>
            <p>{selectedOrder.shipping_address}</p>
            <p>{selectedOrder.shipping_city}{selectedOrder.shipping_postal_code ? `, ${selectedOrder.shipping_postal_code}` : ""}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h4 className="font-display font-semibold text-sm text-foreground mb-2">{lang.code === "bn" ? "পেমেন্ট তথ্য" : lang.code === "ar" ? "معلومات الدفع" : "Payment Info"}</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{lang.code === "bn" ? "পদ্ধতি" : lang.code === "ar" ? "الطريقة" : "Method"}: <span className="text-foreground font-medium capitalize">{selectedOrder.payment_method || "—"}</span></p>
            <p>{lang.code === "bn" ? "স্ট্যাটাস" : lang.code === "ar" ? "الحالة" : "Status"}: <span className="text-foreground font-medium">{getPaymentLabel(selectedOrder.payment_status)}</span></p>
            {selectedOrder.payment_reference && <p>Ref: <span className="font-mono text-foreground">{selectedOrder.payment_reference}</span></p>}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-8">
        {t("dashboard")}
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-3 h-fit space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {getTabLabel(tab)}
            </button>
          ))}
          <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all touch-manipulation">
            <LogOut className="w-4 h-4" /> {t("signOut")}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {lang.code === "bn" ? "প্রোফাইল তথ্য" : lang.code === "ar" ? "معلومات الملف الشخصي" : "Profile Information"}
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{profile?.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: lang.code === "bn" ? "পূর্ণ নাম" : lang.code === "ar" ? "الاسم الكامل" : "Full Name", value: profile?.full_name },
                  { label: lang.code === "bn" ? "ইমেইল" : lang.code === "ar" ? "البريد الإلكتروني" : "Email", value: user.email, disabled: true },
                  { label: lang.code === "bn" ? "ফোন" : lang.code === "ar" ? "الهاتف" : "Phone", value: profile?.phone },
                  { label: lang.code === "bn" ? "শহর" : lang.code === "ar" ? "المدينة" : "City", value: profile?.city },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input defaultValue={f.value || ""} disabled={f.disabled} className={`w-full mt-1 px-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${f.disabled ? "opacity-50" : ""}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "orders" && !selectedOrder && (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {lang.code === "bn" ? "অর্ডার ইতিহাস" : lang.code === "ar" ? "سجل الطلبات" : "Order History"}
              </h2>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">{lang.code === "bn" ? "কোনো অর্ডার নেই।" : lang.code === "ar" ? "لا توجد طلبات." : "No orders yet."}</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => {
                    const sc = statusConfig[order.status] || statusConfig.pending;
                    const Icon = sc.icon;
                    return (
                      <button
                        key={order.id}
                        onClick={() => viewOrderDetails(order)}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${sc.color}`} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm text-foreground block">{order.order_number}</span>
                            <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${sc.bg} ${sc.color} hidden sm:inline-flex`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="font-display font-semibold text-sm text-foreground">{formatPrice(Number(order.total))}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && selectedOrder && renderOrderDetail()}

          {activeTab === "settings" && (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {lang.code === "bn" ? "সেটিংস" : lang.code === "ar" ? "الإعدادات" : "Settings"}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div>
                    <span className="text-sm font-medium text-foreground">{lang.code === "bn" ? "ইমেইল নোটিফিকেশন" : lang.code === "ar" ? "إشعارات البريد" : "Email Notifications"}</span>
                    <p className="text-xs text-muted-foreground">{lang.code === "bn" ? "অর্ডার আপডেট ইমেইলে পান" : lang.code === "ar" ? "تلقي تحديثات الطلب بالبريد" : "Receive order updates via email"}</p>
                  </div>
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
