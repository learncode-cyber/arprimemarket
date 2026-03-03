import { motion, AnimatePresence } from "framer-motion";
import { User, Package, Settings, LogOut, ChevronRight, Clock, Truck, CheckCircle, XCircle, ArrowLeft, MapPin, Download, PackageCheck, CreditCard, Heart, MapPinned, Lock, Plus, Trash2, Star, ShoppingCart, Loader2, Bell, BellOff, KeyRound } from "lucide-react";
import { InvoiceDownload } from "@/components/InvoiceDownload";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWishlist, useAddresses, Address } from "@/hooks/useWishlist";
import { useProducts } from "@/hooks/useProductData";

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
  { id: "wishlist", label: "Wishlist", labelBn: "উইশলিস্ট", labelAr: "المفضلة", icon: Heart },
  { id: "addresses", label: "Addresses", labelBn: "ঠিকানা", labelAr: "العناوين", icon: MapPinned },
  { id: "settings", label: "Settings", labelBn: "সেটিংস", labelAr: "الإعدادات", icon: Settings },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, signOut, loading } = useAuth();
  const { t, lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", city: "", address: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true);

  const l = (en: string, bn: string, ar: string) => lang.code === "bn" ? bn : lang.code === "ar" || lang.code === "sa" ? ar : en;

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
        setProfile(data);
        if (data) setProfileForm({ full_name: data.full_name || "", phone: data.phone || "", city: data.city || "", address: data.address || "" });
      });
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
        toast.info(l(`Order ${updated.order_number} is now ${updated.status}`, `অর্ডার ${updated.order_number} এখন ${updated.status}`, `الطلب ${updated.order_number} أصبح ${updated.status}`));
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      city: profileForm.city,
      address: profileForm.address,
    }).eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success(l("Profile updated!", "প্রোফাইল আপডেট হয়েছে!", "تم تحديث الملف الشخصي!"));
  };

  const handleChangePassword = async () => {
    if (passwordForm.password.length < 6) { toast.error(l("Min 6 characters", "ন্যূনতম ৬ অক্ষর", "٦ أحرف على الأقل")); return; }
    if (passwordForm.password !== passwordForm.confirm) { toast.error(l("Passwords don't match", "পাসওয়ার্ড মিলছে না", "كلمات المرور غير متطابقة")); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    setChangingPassword(false);
    if (error) toast.error(error.message);
    else { toast.success(l("Password changed!", "পাসওয়ার্ড পরিবর্তন হয়েছে!", "تم تغيير كلمة المرور!")); setPasswordForm({ password: "", confirm: "" }); }
  };

  const downloadInvoice = () => {
    if (!selectedOrder) return;
    const inv = [
      "═══════════════════════════════════════",
      "           AR PRIME MARKET - INVOICE",
      "═══════════════════════════════════════",
      "", `Order: ${selectedOrder.order_number}`, `Date: ${new Date(selectedOrder.created_at).toLocaleString()}`,
      `Status: ${getStatusLabel(selectedOrder.status)}`, `Payment: ${getPaymentLabel(selectedOrder.payment_status)}`,
      "", "───────────────────────────────────────", "SHIP TO:",
      `  ${selectedOrder.shipping_name}`, `  ${selectedOrder.shipping_phone}`, `  ${selectedOrder.shipping_email}`,
      `  ${selectedOrder.shipping_address}, ${selectedOrder.shipping_city}`,
      "", "───────────────────────────────────────", "ITEMS:",
      ...orderItems.map(i => `  ${i.quantity}x ${i.title} — ${formatPrice(Number(i.total))}`),
      "", "───────────────────────────────────────",
      `Subtotal:  ${formatPrice(Number(selectedOrder.subtotal))}`,
      Number(selectedOrder.discount_amount) > 0 ? `Discount: -${formatPrice(Number(selectedOrder.discount_amount))}` : null,
      `Shipping:  ${Number(selectedOrder.shipping_cost) > 0 ? formatPrice(Number(selectedOrder.shipping_cost)) : "Free"}`,
      `TOTAL:     ${formatPrice(Number(selectedOrder.total))}`,
      "", selectedOrder.tracking_number ? `Tracking: ${selectedOrder.tracking_number}` : null,
      "", "═══════════════════════════════════════", "Thank you for shopping with AR Prime Market!",
    ].filter(Boolean).join("\n");
    const blob = new Blob([inv], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `invoice-${selectedOrder.order_number}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success(l("Invoice downloaded!", "ইনভয়েস ডাউনলোড হয়েছে!", "تم تحميل الفاتورة!"));
  };

  if (loading || !user) return null;

  const config = statusConfig[selectedOrder?.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const currentIdx = selectedOrder ? allStatuses.indexOf(selectedOrder.status) : -1;
  const isCancelled = selectedOrder?.status === "cancelled";

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-8">
        {t("dashboard")}
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-3 h-fit space-y-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <tab.icon className="w-4 h-4" /> {getTabLabel(tab)}
            </button>
          ))}
          <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all touch-manipulation">
            <LogOut className="w-4 h-4" /> {t("signOut")}
          </button>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {/* ─── Profile ─── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="font-display text-xl font-semibold text-foreground">{l("Profile Information", "প্রোফাইল তথ্য", "معلومات الملف الشخصي")}</h2>
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
                      { key: "full_name", label: l("Full Name", "পূর্ণ নাম", "الاسم الكامل") },
                      { key: "phone", label: l("Phone", "ফোন", "الهاتف") },
                      { key: "city", label: l("City", "শহর", "المدينة") },
                      { key: "address", label: l("Address", "ঠিকানা", "العنوان") },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-muted-foreground">{f.label}</label>
                        <input
                          value={(profileForm as any)[f.key] || ""}
                          onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full mt-1 px-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{l("Email", "ইমেইল", "البريد الإلكتروني")}</label>
                    <input value={user.email || ""} disabled className="w-full mt-1 px-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground opacity-50" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center gap-2">
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {l("Save Changes", "পরিবর্তন সংরক্ষণ", "حفظ التغييرات")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Orders ─── */}
            {activeTab === "orders" && !selectedOrder && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold text-foreground">{l("Order History", "অর্ডার ইতিহাস", "سجل الطلبات")}</h2>
                    <button onClick={() => navigate("/track-order")} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5" /> {l("Track Order", "অর্ডার ট্র্যাক", "تتبع الطلب")}
                    </button>
                  </div>
                  {orders.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
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
                          <button key={order.id} onClick={() => viewOrderDetails(order)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors touch-manipulation text-left">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center shrink-0`}><Icon className={`w-4 h-4 ${sc.color}`} /></div>
                              <div className="min-w-0">
                                <span className="font-medium text-sm text-foreground block">{order.order_number}</span>
                                <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {getPaymentLabel(order.payment_status)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${sc.bg} ${sc.color} hidden sm:inline-flex`}>{getStatusLabel(order.status)}</span>
                              <span className="font-display font-semibold text-sm text-foreground">{formatPrice(Number(order.total))}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "orders" && selectedOrder && (
              <OrderDetail
                order={selectedOrder}
                items={orderItems}
                loadingItems={loadingItems}
                config={config}
                StatusIcon={StatusIcon}
                currentIdx={currentIdx}
                isCancelled={isCancelled}
                onBack={() => setSelectedOrder(null)}
                onDownload={downloadInvoice}
                l={l}
                t={t}
                lang={lang}
                formatPrice={formatPrice}
                getStatusLabel={getStatusLabel}
                getPaymentLabel={getPaymentLabel}
              />
            )}

            {/* ─── Wishlist ─── */}
            {activeTab === "wishlist" && (
              <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WishlistTab l={l} formatPrice={formatPrice} addToCart={addToCart} />
              </motion.div>
            )}

            {/* ─── Addresses ─── */}
            {activeTab === "addresses" && (
              <motion.div key="addresses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AddressBookTab l={l} />
              </motion.div>
            )}

            {/* ─── Settings ─── */}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-5">
                  {/* Change Password */}
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
                    <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-primary" />
                      {l("Change Password", "পাসওয়ার্ড পরিবর্তন", "تغيير كلمة المرور")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">{l("New Password", "নতুন পাসওয়ার্ড", "كلمة المرور الجديدة")}</label>
                        <input type="password" value={passwordForm.password} onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
                          className="w-full mt-1 px-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">{l("Confirm Password", "পাসওয়ার্ড নিশ্চিত করুন", "تأكيد كلمة المرور")}</label>
                        <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                          className="w-full mt-1 px-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                    <button onClick={handleChangePassword} disabled={changingPassword}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center gap-2">
                      {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {l("Update Password", "পাসওয়ার্ড আপডেট", "تحديث كلمة المرور")}
                    </button>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
                    <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      {l("Notifications", "নোটিফিকেশন", "الإشعارات")}
                    </h2>
                    <div className="space-y-3">
                      {[
                        { key: "email", label: l("Email Notifications", "ইমেইল নোটিফিকেশন", "إشعارات البريد"), desc: l("Order updates via email", "অর্ডার আপডেট ইমেইলে", "تحديثات الطلب بالبريد") },
                        { key: "promo", label: l("Promotions", "প্রমোশন", "العروض"), desc: l("Deals & offers", "ডিল ও অফার", "الصفقات والعروض") },
                      ].map(n => (
                        <div key={n.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                          <div>
                            <span className="text-sm font-medium text-foreground">{n.label}</span>
                            <p className="text-xs text-muted-foreground">{n.desc}</p>
                          </div>
                          <button
                            onClick={() => { setEmailNotif(!emailNotif); toast.success(l("Setting updated", "সেটিং আপডেট", "تم التحديث")); }}
                            className={`w-11 h-6 rounded-full relative transition-colors ${emailNotif ? "bg-primary" : "bg-muted"}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground transition-all ${emailNotif ? "right-0.5" : "left-0.5"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Order Detail Component ───
const OrderDetail = ({ order, items, loadingItems, config, StatusIcon, currentIdx, isCancelled, onBack, onDownload, l, t, lang, formatPrice, getStatusLabel, getPaymentLabel }: any) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
        <ArrowLeft className="w-4 h-4" /> {l("Back", "ফিরে যান", "رجوع")}
      </button>
      <InvoiceDownload
        order={{
          order_number: order.order_number,
          created_at: order.created_at,
          status: order.status,
          payment_status: order.payment_status,
          shipping_name: order.shipping_name,
          shipping_phone: order.shipping_phone,
          shipping_email: order.shipping_email,
          shipping_address: order.shipping_address,
          shipping_city: order.shipping_city,
          shipping_country: order.shipping_country,
          subtotal: Number(order.subtotal),
          discount_amount: Number(order.discount_amount),
          shipping_cost: Number(order.shipping_cost),
          tax_amount: Number(order.tax_amount),
          total: Number(order.total),
          tracking_number: order.tracking_number,
          payment_method: order.payment_method,
        }}
        items={items.map((i: any) => ({ title: i.title, quantity: i.quantity, price: Number(i.price), total: Number(i.total) }))}
      />
    </div>
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs text-muted-foreground">{l("Order Number", "অর্ডার নম্বর", "رقم الطلب")}</p>
          <h3 className="font-display font-bold text-lg text-foreground">{order.order_number}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <StatusIcon className="w-3.5 h-3.5" /> {getStatusLabel(order.status)}
        </span>
      </div>
      {!isCancelled && (
        <div className="relative">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />
            <div className="absolute top-5 left-[10%] h-1 bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.max(0, currentIdx) / (allStatuses.length - 1) * 80}%` }} />
            {allStatuses.map((s, i) => {
              const meta = statusConfig[s]; const Icon = meta.icon; const isActive = i <= currentIdx; const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex flex-col items-center z-10 w-1/5">
                  <motion.div initial={false} animate={isCurrent ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? `${meta.bg.replace("/10", "")} border-transparent text-white` : "bg-card border-border text-muted-foreground"} ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </motion.div>
                  <span className={`text-[9px] sm:text-[10px] mt-1.5 font-medium text-center leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{getStatusLabel(s)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {order.tracking_number && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">{l("Tracking Number", "ট্র্যাকিং নম্বর", "رقم التتبع")}</p>
          <p className="text-sm font-mono font-bold text-primary">{order.tracking_number}</p>
        </div>
      )}
    </div>
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <h4 className="font-display font-semibold text-sm text-foreground mb-3">{l("Order Items", "অর্ডার আইটেম", "عناصر الطلب")}</h4>
      {loadingItems ? <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />)}</div> : (
        <div className="space-y-2.5">
          {items.map((item: any) => (
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
        <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span className="text-foreground">{formatPrice(Number(order.subtotal))}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("shipping")}</span><span className="text-foreground">{Number(order.shipping_cost) > 0 ? formatPrice(Number(order.shipping_cost)) : t("free")}</span></div>
        {Number(order.discount_amount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{l("Discount", "ছাড়", "خصم")}</span><span className="text-green-500">-{formatPrice(Number(order.discount_amount))}</span></div>}
        <div className="flex justify-between pt-2 border-t border-border font-semibold"><span className="text-foreground">{t("total")}</span><span className="font-display text-foreground">{formatPrice(Number(order.total))}</span></div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h4 className="font-display font-semibold text-sm text-foreground mb-2">{l("Shipping Info", "শিপিং তথ্য", "معلومات الشحن")}</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{order.shipping_name}</p>
          <p>{order.shipping_phone}</p><p>{order.shipping_email}</p><p>{order.shipping_address}</p>
          <p>{order.shipping_city}{order.shipping_postal_code ? `, ${order.shipping_postal_code}` : ""}</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5">
        <h4 className="font-display font-semibold text-sm text-foreground mb-2">{l("Payment Info", "পেমেন্ট তথ্য", "معلومات الدفع")}</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{l("Method", "পদ্ধতি", "الطريقة")}: <span className="text-foreground font-medium capitalize">{order.payment_method || "—"}</span></p>
          <p>{l("Status", "স্ট্যাটাস", "الحالة")}: <span className="text-foreground font-medium">{getPaymentLabel(order.payment_status)}</span></p>
          {order.payment_reference && <p>Ref: <span className="font-mono text-foreground">{order.payment_reference}</span></p>}
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── Wishlist Tab ───
const WishlistTab = ({ l, formatPrice, addToCart }: { l: any; formatPrice: any; addToCart: any }) => {
  const { items, loading: wLoading, toggleWishlist } = useWishlist();
  const { data: products = [] } = useProducts();

  const wishlistProducts = products.filter(p => items.some(w => w.product_id === p.id));

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" />
        {l("My Wishlist", "আমার উইশলিস্ট", "المفضلة")} ({wishlistProducts.length})
      </h2>
      {wLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : wishlistProducts.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{l("Your wishlist is empty", "আপনার উইশলিস্ট খালি", "قائمة المفضلة فارغة")}</p>
          <Link to="/products" className="inline-block mt-3 text-xs text-primary hover:underline font-medium">{l("Browse Products", "পণ্য দেখুন", "تصفح المنتجات")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wishlistProducts.map(p => (
            <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-muted/30">
              <Link to={`/products/${p.id}`}>
                <img src={p.image} alt={p.title} className="w-16 h-16 rounded-xl object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${p.id}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-2">{p.title}</Link>
                <p className="text-xs font-semibold text-primary mt-0.5">{formatPrice(p.price)}</p>
                <div className="flex gap-1.5 mt-1.5">
                  <button onClick={() => { addToCart(p); toast.success(l("Added to cart", "কার্টে যোগ হয়েছে", "تمت الإضافة للسلة")); }}
                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium flex items-center gap-1 touch-manipulation">
                    <ShoppingCart className="w-3 h-3" /> {l("Add to Cart", "কার্টে যোগ", "أضف للسلة")}
                  </button>
                  <button onClick={() => toggleWishlist(p.id)}
                    className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[10px] font-medium flex items-center gap-1 touch-manipulation">
                    <Trash2 className="w-3 h-3" /> {l("Remove", "সরান", "إزالة")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Address Book Tab ───
const AddressBookTab = ({ l }: { l: any }) => {
  const { addresses, loading: aLoading, addAddress, deleteAddress, setDefault } = useAddresses();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: "Home", full_name: "", phone: "", address: "", city: "", postal_code: "", country: "Bangladesh" });

  const handleAdd = async () => {
    if (!form.full_name || !form.phone || !form.address || !form.city) { toast.error(l("Fill required fields", "প্রয়োজনীয় ফিল্ড পূরণ করুন", "املأ الحقول المطلوبة")); return; }
    try {
      await addAddress({ ...form, postal_code: form.postal_code || null, is_default: addresses.length === 0 } as any);
      toast.success(l("Address added!", "ঠিকানা যোগ হয়েছে!", "تمت إضافة العنوان!"));
      setForm({ label: "Home", full_name: "", phone: "", address: "", city: "", postal_code: "", country: "Bangladesh" });
      setShowAdd(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-primary" />
          {l("Address Book", "ঠিকানা বই", "دفتر العناوين")} ({addresses.length})
        </h2>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium touch-manipulation">
          <Plus className="w-3.5 h-3.5" /> {l("Add", "যোগ", "إضافة")}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{l("Label", "লেবেল", "التسمية")}</label>
                  <select value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="Home">{l("Home", "বাড়ি", "المنزل")}</option>
                    <option value="Office">{l("Office", "অফিস", "المكتب")}</option>
                    <option value="Other">{l("Other", "অন্যান্য", "أخرى")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{l("Full Name", "পূর্ণ নাম", "الاسم")} *</label>
                  <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{l("Phone", "ফোন", "الهاتف")} *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{l("City", "শহর", "المدينة")} *</label>
                  <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground">{l("Address", "ঠিকানা", "العنوان")} *</label>
                  <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{l("Country", "দেশ", "البلد")}</label>
                  <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Arab Emirates">UAE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{l("Postal Code", "পোস্টাল কোড", "الرمز البريدي")}</label>
                  <input value={form.postal_code} onChange={e => setForm(p => ({ ...p, postal_code: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">{l("Save Address", "ঠিকানা সংরক্ষণ", "حفظ العنوان")}</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">{l("Cancel", "বাতিল", "إلغاء")}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {aLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8">
          <MapPinned className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{l("No saved addresses", "কোনো সংরক্ষিত ঠিকানা নেই", "لا توجد عناوين محفوظة")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{a.label}</span>
                  {a.is_default && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary">Default</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.full_name} · {a.phone}</p>
                <p className="text-xs text-muted-foreground">{a.address}, {a.city}, {a.country}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!a.is_default && (
                  <button onClick={() => { setDefault(a.id); toast.success(l("Set as default", "ডিফল্ট সেট", "تم التعيين")); }}
                    className="px-2 py-1 rounded-lg bg-secondary text-[10px] font-medium text-muted-foreground hover:text-foreground touch-manipulation">
                    {l("Default", "ডিফল্ট", "افتراضي")}
                  </button>
                )}
                <button onClick={() => { deleteAddress(a.id); toast.success(l("Deleted", "মুছে ফেলা হয়েছে", "تم الحذف")); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors touch-manipulation">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
