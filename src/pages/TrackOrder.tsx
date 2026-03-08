import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, ArrowRight, ShieldCheck, RotateCcw, Phone, Loader2, XCircle, PackageCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const allStatuses = ["pending", "processing", "shipped", "out_for_delivery", "delivered"] as const;

const statusMeta: Record<string, { icon: any; label: Record<string, string>; color: string; bg: string }> = {
  pending: { icon: Clock, label: { en: "Order Placed", bn: "অর্ডার সম্পন্ন", ar: "تم الطلب" }, color: "text-amber-500", bg: "bg-amber-500" },
  processing: { icon: Package, label: { en: "Processing", bn: "প্রক্রিয়াধীন", ar: "قيد المعالجة" }, color: "text-blue-500", bg: "bg-blue-500" },
  shipped: { icon: Truck, label: { en: "Shipped", bn: "শিপ করা হয়েছে", ar: "تم الشحن" }, color: "text-indigo-500", bg: "bg-indigo-500" },
  out_for_delivery: { icon: MapPin, label: { en: "Out for Delivery", bn: "ডেলিভারিতে আছে", ar: "في الطريق" }, color: "text-orange-500", bg: "bg-orange-500" },
  delivered: { icon: CheckCircle, label: { en: "Delivered", bn: "ডেলিভারি হয়েছে", ar: "تم التوصيل" }, color: "text-green-500", bg: "bg-green-500" },
  cancelled: { icon: XCircle, label: { en: "Cancelled", bn: "বাতিল", ar: "ملغي" }, color: "text-destructive", bg: "bg-destructive" },
};

const TrackOrder = () => {
  const { lang } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const l = (en: string, bn: string, ar: string) => lang.code === "bn" ? bn : lang.code === "ar" || lang.code === "sa" ? ar : en;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setSupplierOrders([]);

    const searchTerm = query.trim().toUpperCase();
    const isTrackingId = searchTerm.startsWith("ARP-TRK-");

    // Try authenticated user lookup first
    let data: any = null;
    if (user) {
      const res = await supabase
        .from("orders")
        .select("*")
        .or(isTrackingId ? `tracking_number.eq.${searchTerm}` : `order_number.eq.${searchTerm}`)
        .maybeSingle();
      data = res.data;
    }

    // If not found (guest order), try secure guest lookup
    if (!data) {
      // Try with email if provided
      if (email.trim()) {
        const res = await supabase.rpc("verify_guest_order", {
          _order_number: searchTerm,
          _email: email.trim(),
        });
        data = res.data?.[0] || null;
      }

      // Try with tracking token from URL
      if (!data) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        if (token) {
          const res = await supabase.rpc("get_guest_order", {
            _order_number: searchTerm,
            _tracking_token: token,
          });
          data = res.data?.[0] || null;
        }
      }
    }

    if (!data) {
      // If not logged in and no email provided, ask for email
      if (!user && !email.trim()) {
        setShowEmailField(true);
        setError(l("Please enter your email to verify the order.", "অর্ডার ভেরিফাই করতে আপনার ইমেইল দিন।", "أدخل بريدك الإلكتروني للتحقق من الطلب."));
        setLoading(false);
        return;
      }
      setError(l("Order not found. Please check the order number and email.", "অর্ডার পাওয়া যায়নি। অর্ডার নম্বর ও ইমেইল চেক করুন।", "لم يتم العثور على الطلب."));
      setLoading(false);
      return;
    }

    setOrder(data);
    setLastUpdate(new Date());

    const [itemsRes, supplierRes] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", data.id),
      supabase.from("supplier_orders").select("*, suppliers(name)").eq("order_id", data.id),
    ]);
    setItems(itemsRes.data || []);
    setSupplierOrders(supplierRes.data || []);
    setLoading(false);
  };

  // Real-time subscription for order updates
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`order-track-${order.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` }, (payload) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
        setLastUpdate(new Date());
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "supplier_orders", filter: `order_id=eq.${order.id}` }, async () => {
        const { data } = await supabase.from("supplier_orders").select("*, suppliers(name)").eq("order_id", order.id);
        setSupplierOrders(data || []);
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id]);

  const currentIdx = order ? allStatuses.indexOf(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  const estimatedDelivery = order ? (() => {
    const created = new Date(order.created_at);
    const method = order.shipping_method;
    const days = method === "express" ? 3 : method === "priority" ? 5 : 7;
    const est = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
    return est;
  })() : null;

  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <PackageCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
          {l("Track Your Order", "আপনার অর্ডার ট্র্যাক করুন", "تتبع طلبك")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {l("Enter your order number to see real-time status updates", "আপনার অর্ডার নম্বর দিয়ে রিয়েল-টাইম স্ট্যাটাস দেখুন", "أدخل رقم طلبك لمعرفة حالته")}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={l("Enter order number (e.g. ARP-20260225-1234)", "অর্ডার নম্বর দিন (যেমন ARP-20260225-1234)", "أدخل رقم الطلب")}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.97] transition-all touch-manipulation disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        {showEmailField && !user && (
          <div className="mt-3">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={l("Enter your email for verification", "ভেরিফিকেশনের জন্য ইমেইল দিন", "أدخل بريدك الإلكتروني للتحقق")}
              type="email"
              className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
            />
          </div>
        )}
        {user && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {l("Or ", "অথবা ", "أو ")}
            <button onClick={() => navigate("/dashboard")} className="text-primary hover:underline font-medium">
              {l("view all orders in your dashboard", "ড্যাশবোর্ডে সব অর্ডার দেখুন", "عرض جميع الطلبات في لوحتك")}
            </button>
          </p>
        )}
        {!user && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
              {l("Login to see all your orders", "সব অর্ডার দেখতে লগইন করুন", "سجل الدخول لعرض جميع طلباتك")}
            </button>
          </p>
        )}
        {error && <p className="text-sm text-destructive mt-3 text-center">{error}</p>}
      </motion.div>

      {/* Result */}
      <AnimatePresence mode="wait">
        {order && (
          <motion.div key={order.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Real-time indicator */}
            {lastUpdate && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {l("Live tracking", "লাইভ ট্র্যাকিং", "تتبع مباشر")} · {l("Updated", "আপডেট", "تحديث")} {lastUpdate.toLocaleTimeString()}
              </div>
            )}

            {/* Order Info Card */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">{l("Order Number", "অর্ডার নম্বর", "رقم الطلب")}</p>
                  <h2 className="font-display font-bold text-xl text-foreground">{order.order_number}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString(lang.code === "bn" ? "bn-BD" : lang.code === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold ${statusMeta[order.status]?.bg || "bg-muted"} text-white`}>
                    {(() => { const Icon = statusMeta[order.status]?.icon || Clock; return <Icon className="w-3.5 h-3.5" />; })()}
                    {statusMeta[order.status]?.label[lang.code] || statusMeta[order.status]?.label.en || order.status}
                  </span>
                  {estimatedDelivery && !isCancelled && order.status !== "delivered" && (
                    <p className="text-[10px] text-muted-foreground">
                      {l("Est. delivery", "আনুমানিক ডেলিভারি", "التسليم المتوقع")}: {estimatedDelivery.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              {!isCancelled && (
                <div className="relative">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />
                    <div
                      className="absolute top-5 left-[10%] h-1 bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(0, currentIdx) / (allStatuses.length - 1) * 80}%` }}
                    />
                    {allStatuses.map((s, i) => {
                      const meta = statusMeta[s];
                      const Icon = meta.icon;
                      const isActive = i <= currentIdx;
                      const isCurrent = i === currentIdx;
                      return (
                        <div key={s} className="flex flex-col items-center z-10 w-1/5">
                          <motion.div
                            initial={false}
                            animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isActive ? `${meta.bg} border-transparent text-white` : "bg-card border-border text-muted-foreground"
                            } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                          >
                            <Icon className="w-4 h-4" />
                          </motion.div>
                          <span className={`text-[10px] sm:text-xs mt-2 font-medium text-center ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                            {meta.label[lang.code] || meta.label.en}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="text-center py-4">
                  <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive font-medium">{l("This order has been cancelled", "এই অর্ডারটি বাতিল করা হয়েছে", "تم إلغاء هذا الطلب")}</p>
                </div>
              )}
            </div>

            {/* Supplier Shipping Updates */}
            {supplierOrders.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  {l("Shipping Updates", "শিপিং আপডেট", "تحديثات الشحن")}
                </h4>
                <div className="space-y-3">
                  {supplierOrders.map((so: any) => (
                    <div key={so.id} className="p-3 rounded-xl bg-muted/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{so.suppliers?.name || "Supplier"}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          so.status === "delivered" ? "bg-green-500/10 text-green-600" :
                          so.status === "shipped" || so.status === "in_transit" ? "bg-blue-500/10 text-blue-600" :
                          so.status === "failed" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {so.status}
                        </span>
                      </div>
                      {so.tracking_number && (
                        <div className="flex items-center gap-2">
                          <Truck className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{l("Tracking", "ট্র্যাকিং", "تتبع")}:</span>
                          <span className="font-mono text-xs font-bold text-primary">{so.tracking_number}</span>
                          {so.shipping_carrier && <span className="text-[10px] text-muted-foreground">({so.shipping_carrier})</span>}
                        </div>
                      )}
                      {so.forwarded_at && (
                        <p className="text-[10px] text-muted-foreground">
                          {l("Forwarded", "ফরোয়ার্ড", "تمت الإحالة")}: {new Date(so.forwarded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracking & Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-display font-semibold text-sm text-foreground mb-3">{l("Shipping Details", "শিপিং তথ্য", "تفاصيل الشحن")}</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground">{order.shipping_name}</p>
                  <p>{order.shipping_phone}</p>
                  <p>{order.shipping_address}, {order.shipping_city}</p>
                  {order.tracking_number && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[10px] text-muted-foreground">{l("Tracking Number", "ট্র্যাকিং নম্বর", "رقم التتبع")}</p>
                      <p className="font-mono font-bold text-sm text-primary">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-display font-semibold text-sm text-foreground mb-3">{l("Payment", "পেমেন্ট", "الدفع")}</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p>{l("Method", "পদ্ধতি", "الطريقة")}: <span className="text-foreground font-medium capitalize">{order.payment_method || "—"}</span></p>
                  <p>{l("Status", "স্ট্যাটাস", "الحالة")}: <span className={`font-medium ${order.payment_status === "paid" ? "text-green-500" : "text-amber-500"}`}>{order.payment_status}</span></p>
                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    <div className="flex justify-between"><span>{l("Subtotal", "সাবটোটাল", "المجموع الفرعي")}</span><span className="text-foreground">{formatPrice(Number(order.subtotal))}</span></div>
                    {Number(order.discount_amount) > 0 && <div className="flex justify-between"><span>{l("Discount", "ছাড়", "خصم")}</span><span className="text-green-500">-{formatPrice(Number(order.discount_amount))}</span></div>}
                    <div className="flex justify-between"><span>{l("Shipping", "শিপিং", "الشحن")}</span><span className="text-foreground">{Number(order.shipping_cost) > 0 ? formatPrice(Number(order.shipping_cost)) : l("Free", "ফ্রি", "مجاني")}</span></div>
                    <div className="flex justify-between pt-2 border-t border-border font-semibold text-foreground"><span>{l("Total", "মোট", "الإجمالي")}</span><span className="font-display">{formatPrice(Number(order.total))}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            {items.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="font-display font-semibold text-sm text-foreground mb-3">{l("Items", "আইটেম", "العناصر")} ({items.length})</h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      {item.image_url && <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity}x {formatPrice(Number(item.price))}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatPrice(Number(item.total))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: l("Secure", "নিরাপদ", "آمن") },
                { icon: RotateCcw, label: l("Easy Returns", "সহজ রিটার্ন", "إرجاع سهل") },
                { icon: Phone, label: l("24/7 Support", "২৪/৭ সাপোর্ট", "دعم ٢٤/٧") },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/30 text-center">
                  <b.icon className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackOrder;
