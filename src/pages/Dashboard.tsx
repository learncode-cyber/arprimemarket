import { motion, AnimatePresence } from "framer-motion";
import { User, Package, Settings, LogOut, ChevronRight, Clock, Truck, CheckCircle, XCircle, ArrowLeft, MapPin, Download, PackageCheck, CreditCard, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const allStatuses = ["pending", "processing", "shipped", "out_for_delivery", "delivered"] as const;

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
  shipped: { icon: Truck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  out_for_delivery: { icon: MapPin, color: "text-orange-500", bg: "bg-orange-500/10" },
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

  const l = (en: string, bn: string, ar: string) => lang.code === "bn" ? bn : lang.code === "ar" || lang.code === "sa" ? ar : en;

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
    }
  }, [user]);

  // Real-time order updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-orders")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, (payload) => {
        const updated = payload.new as any;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
        if (selectedOrder?.id === updated.id) setSelectedOrder((prev: any) => prev ? { ...prev, ...updated } : prev);
        const statusLabel = statusConfig[updated.status] ? updated.status : "updated";
        toast.info(l(`Order ${updated.order_number} is now ${statusLabel}`, `অর্ডার ${updated.order_number} এখন ${statusLabel}`, `الطلب ${updated.order_number} أصبح ${statusLabel}`));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedOrder?.id]);

  const viewOrderDetails = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  const getTabLabel = (tab: typeof tabs[0]) => {
    if (lang.code === "bn") return tab.labelBn;
    if (lang.code === "ar" || lang.code === "sa") return tab.labelAr;
    return tab.label;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      pending: { en: "Pending", bn: "অপেক্ষমাণ", ar: "قيد الانتظار" },
      processing: { en: "Processing", bn: "প্রক্রিয়াধীন", ar: "قيد المعالجة" },
      shipped: { en: "Shipped", bn: "শিপ করা হয়েছে", ar: "تم الشحن" },
      out_for_delivery: { en: "Out for Delivery", bn: "ডেলিভারিতে আছে", ar: "في الطريق" },
      delivered: { en: "Delivered", bn: "ডেলিভারি হয়েছে", ar: "تم التوصيل" },
      cancelled: { en: "Cancelled", bn: "বাতিল", ar: "ملغي" },
    };
    return labels[status]?.[lang.code] || labels[status]?.en || status;
  };

  const getPaymentLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      unpaid: { en: "Unpaid", bn: "অপরিশোধিত", ar: "غير مدفوع" },
      pending: { en: "Pending", bn: "অপেক্ষমাণ", ar: "قيد الانتظار" },
      paid: { en: "Paid", bn: "পরিশোধিত", ar: "مدفوع" },
    };
    return labels[status]?.[lang.code] || labels[status]?.en || status;
  };

  const downloadInvoice = () => {
    if (!selectedOrder) return;
    const inv = [
      "═══════════════════════════════════════",
      "           AR PRIME MARKET - INVOICE",
      "═══════════════════════════════════════",
      "",
      `Order: ${selectedOrder.order_number}`,
      `Date: ${new Date(selectedOrder.created_at).toLocaleString()}`,
      `Status: ${getStatusLabel(selectedOrder.status)}`,
      `Payment: ${getPaymentLabel(selectedOrder.payment_status)}`,
      "",
      "───────────────────────────────────────",
      "SHIP TO:",
      `  ${selectedOrder.shipping_name}`,
      `  ${selectedOrder.shipping_phone}`,
      `  ${selectedOrder.shipping_email}`,
      `  ${selectedOrder.shipping_address}, ${selectedOrder.shipping_city}`,
      "",
      "───────────────────────────────────────",
      "ITEMS:",
      ...orderItems.map(i => `  ${i.quantity}x ${i.title} — ${formatPrice(Number(i.total))}`),
      "",
      "───────────────────────────────────────",
      `Subtotal:  ${formatPrice(Number(selectedOrder.subtotal))}`,
      Number(selectedOrder.discount_amount) > 0 ? `Discount: -${formatPrice(Number(selectedOrder.discount_amount))}` : null,
      `Shipping:  ${Number(selectedOrder.shipping_cost) > 0 ? formatPrice(Number(selectedOrder.shipping_cost)) : "Free"}`,
      `TOTAL:     ${formatPrice(Number(selectedOrder.total))}`,
      "",
      selectedOrder.tracking_number ? `Tracking: ${selectedOrder.tracking_number}` : null,
      "",
      "═══════════════════════════════════════",
      "Thank you for shopping with AR Prime Market!",
    ].filter(Boolean).join("\n");

    const blob = new Blob([inv], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${selectedOrder.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(l("Invoice downloaded!", "ইনভয়েস ডাউনলোড হয়েছে!", "تم تحميل الفاتورة!"));
  };

  if (loading || !user) return null;

  const config = statusConfig[selectedOrder?.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const currentIdx = selectedOrder ? allStatuses.indexOf(selectedOrder.status) : -1;
  const isCancelled = selectedOrder?.status === "cancelled";

  const renderOrderDetail = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedOrder(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
          <ArrowLeft className="w-4 h-4" /> {l("Back", "ফিরে যান", "رجوع")}
        </button>
        <button onClick={downloadInvoice} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors touch-manipulation">
          <Download className="w-3.5 h-3.5" /> {l("Invoice", "ইনভয়েস", "فاتورة")}
        </button>
      </div>

      {/* Status header */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">{l("Order Number", "অর্ডার নম্বর", "رقم الطلب")}</p>
            <h3 className="font-display font-bold text-lg text-foreground">{selectedOrder.order_number}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(selectedOrder.created_at).toLocaleDateString(lang.code === "bn" ? "bn-BD" : lang.code === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            <StatusIcon className="w-3.5 h-3.5" /> {getStatusLabel(selectedOrder.status)}
          </span>
        </div>

        {/* Order Timeline */}
        {!isCancelled && (
          <div className="relative">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />
              <div className="absolute top-5 left-[10%] h-1 bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.max(0, currentIdx) / (allStatuses.length - 1) * 80}%` }} />
              {allStatuses.map((s, i) => {
                const meta = statusConfig[s] || statusConfig.pending;
                const Icon = meta.icon;
                const isActive = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex flex-col items-center z-10 w-1/5">
                    <motion.div
                      initial={false}
                      animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive ? `${meta.bg.replace("/10", "")} border-transparent text-white` : "bg-card border-border text-muted-foreground"
                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.div>
                    <span className={`text-[9px] sm:text-[10px] mt-1.5 font-medium text-center leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {getStatusLabel(s)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedOrder.tracking_number && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">{l("Tracking Number", "ট্র্যাকিং নম্বর", "رقم التتبع")}</p>
            <p className="text-sm font-mono font-bold text-primary">{selectedOrder.tracking_number}</p>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <h4 className="font-display font-semibold text-sm text-foreground mb-3">{l("Order Items", "অর্ডার আইটেম", "عناصر الطلب")}</h4>
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

        <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span className="text-foreground">{formatPrice(Number(selectedOrder.subtotal))}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("shipping")}</span><span className="text-foreground">{Number(selectedOrder.shipping_cost) > 0 ? formatPrice(Number(selectedOrder.shipping_cost)) : t("free")}</span></div>
          {Number(selectedOrder.discount_amount) > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">{l("Discount", "ছাড়", "خصم")}</span><span className="text-green-500">-{formatPrice(Number(selectedOrder.discount_amount))}</span></div>
          )}
          <div className="flex justify-between pt-2 border-t border-border font-semibold">
            <span className="text-foreground">{t("total")}</span>
            <span className="font-display text-foreground">{formatPrice(Number(selectedOrder.total))}</span>
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h4 className="font-display font-semibold text-sm text-foreground mb-2">{l("Shipping Info", "শিপিং তথ্য", "معلومات الشحن")}</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{selectedOrder.shipping_name}</p>
            <p>{selectedOrder.shipping_phone}</p>
            <p>{selectedOrder.shipping_email}</p>
            <p>{selectedOrder.shipping_address}</p>
            <p>{selectedOrder.shipping_city}{selectedOrder.shipping_postal_code ? `, ${selectedOrder.shipping_postal_code}` : ""}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h4 className="font-display font-semibold text-sm text-foreground mb-2">{l("Payment Info", "পেমেন্ট তথ্য", "معلومات الدفع")}</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{l("Method", "পদ্ধতি", "الطريقة")}: <span className="text-foreground font-medium capitalize">{selectedOrder.payment_method || "—"}</span></p>
            <p>{l("Status", "স্ট্যাটাস", "الحالة")}: <span className="text-foreground font-medium">{getPaymentLabel(selectedOrder.payment_status)}</span></p>
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
                {l("Profile Information", "প্রোফাইল তথ্য", "معلومات الملف الشخصي")}
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
                  { label: l("Full Name", "পূর্ণ নাম", "الاسم الكامل"), value: profile?.full_name },
                  { label: l("Email", "ইমেইল", "البريد الإلكتروني"), value: user.email, disabled: true },
                  { label: l("Phone", "ফোন", "الهاتف"), value: profile?.phone },
                  { label: l("City", "শহর", "المدينة"), value: profile?.city },
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
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {l("Order History", "অর্ডার ইতিহাস", "سجل الطلبات")}
                </h2>
                <button onClick={() => navigate("/track-order")} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5" /> {l("Track Order", "অর্ডার ট্র্যাক", "تتبع الطلب")}
                </button>
              </div>

              {/* Quick stats */}
              {orders.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: l("Total", "মোট", "الكل"), count: orders.length, color: "text-foreground" },
                    { label: l("Active", "সক্রিয়", "نشط"), count: orders.filter(o => ["pending", "processing", "shipped", "out_for_delivery"].includes(o.status)).length, color: "text-blue-500" },
                    { label: l("Delivered", "ডেলিভারি", "تم التوصيل"), count: orders.filter(o => o.status === "delivered").length, color: "text-green-500" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2.5 rounded-xl bg-muted/30">
                      <p className={`font-display text-lg font-bold ${s.color}`}>{s.count}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">{l("No orders yet.", "কোনো অর্ডার নেই।", "لا توجد طلبات.")}</p>
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
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()} · {getPaymentLabel(order.payment_status)}
                            </p>
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
                {l("Settings", "সেটিংস", "الإعدادات")}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div>
                    <span className="text-sm font-medium text-foreground">{l("Email Notifications", "ইমেইল নোটিফিকেশন", "إشعارات البريد")}</span>
                    <p className="text-xs text-muted-foreground">{l("Receive order updates via email", "অর্ডার আপডেট ইমেইলে পান", "تلقي تحديثات الطلب بالبريد")}</p>
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
