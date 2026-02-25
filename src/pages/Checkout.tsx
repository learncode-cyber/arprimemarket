import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";

const shippingSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  phone: z.string().trim().min(6, "Phone is required").max(20),
  email: z.string().trim().email("Invalid email").max(255),
  address: z.string().trim().min(5, "Address is required").max(500),
  city: z.string().trim().min(2, "City is required").max(100),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(100),
});

type ShippingForm = z.infer<typeof shippingSchema>;

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState<ShippingForm>({
    name: "", phone: "", email: "", address: "", city: "", postalCode: "", country: "Bangladesh",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [txReference, setTxReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  const handleChange = (field: keyof ShippingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const result = shippingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        const key = e.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to place an order.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal,
          total: subtotal,
          currency: "BDT",
          order_number: "TEMP",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "unpaid" : "pending",
          shipping_name: form.name,
          shipping_phone: form.phone,
          shipping_email: form.email,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_postal_code: form.postalCode || null,
          shipping_country: form.country,
        })
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
        image_url: item.product.image,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Create payment transaction record
      if (paymentMethod !== "cod") {
        await supabase.from("payment_transactions").insert({
          order_id: order.id,
          payment_method_key: paymentMethod,
          amount: subtotal,
          currency: "BDT",
          status: "pending",
          transaction_reference: txReference || null,
        });
      }

      clearCart();
      setOrderPlaced(order.order_number);
      toast({ title: "Order placed!", description: `Order ${order.order_number} confirmed.` });
    } catch (err: any) {
      console.error("Order error:", err);
      toast({ title: "Order failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {lang.code === "bn" ? "অর্ডার নিশ্চিত!" : lang.code === "ar" ? "تم تأكيد الطلب!" : "Order Confirmed!"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang.code === "bn" ? "আপনার অর্ডার" : lang.code === "ar" ? "طلبك" : "Your order"}{" "}
            <span className="font-semibold text-foreground">{orderPlaced}</span>{" "}
            {lang.code === "bn" ? "সফলভাবে দেওয়া হয়েছে।" : lang.code === "ar" ? "تم بنجاح." : "has been placed successfully."}
          </p>
          {paymentMethod !== "cod" && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2">
              {lang.code === "bn" ? "পেমেন্ট কনফার্ম হলে অর্ডার প্রসেস করা হবে।" : lang.code === "ar" ? "سيتم معالجة الطلب بعد تأكيد الدفع." : "Your order will be processed once payment is confirmed."}
            </p>
          )}
          <div className="flex gap-3 justify-center pt-4">
            <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm touch-manipulation">
              {t("dashboard")}
            </Link>
            <Link to="/products" className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm touch-manipulation">
              {t("continueShopping")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">{t("emptyCart")}</p>
        <Link to="/products" className="text-primary text-sm font-semibold">{t("continueShopping")}</Link>
      </div>
    );
  }

  const needsReference = paymentMethod !== "cod" && paymentMethod !== "visa_mastercard";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/cart" className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 touch-manipulation">
          <ArrowLeft className="w-4 h-4" /> {t("backToProducts")}
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">{t("checkout")}</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        {/* Shipping + Payment */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-3 space-y-5">
          {/* Shipping Form */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {lang.code === "bn" ? "শিপিং তথ্য" : lang.code === "ar" ? "معلومات الشحن" : "Shipping Information"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "name" as const, label: lang.code === "bn" ? "পূর্ণ নাম" : lang.code === "ar" ? "الاسم الكامل" : "Full Name", span: 1 },
                { key: "phone" as const, label: lang.code === "bn" ? "ফোন নম্বর" : lang.code === "ar" ? "رقم الهاتف" : "Phone Number", span: 1 },
                { key: "email" as const, label: lang.code === "bn" ? "ইমেইল" : lang.code === "ar" ? "البريد الإلكتروني" : "Email", span: 2 },
                { key: "address" as const, label: lang.code === "bn" ? "ঠিকানা" : lang.code === "ar" ? "العنوان" : "Address", span: 2 },
                { key: "city" as const, label: lang.code === "bn" ? "শহর" : lang.code === "ar" ? "المدينة" : "City", span: 1 },
                { key: "postalCode" as const, label: lang.code === "bn" ? "পোস্টাল কোড" : lang.code === "ar" ? "الرمز البريدي" : "Postal Code", span: 1 },
              ]).map(field => (
                <div key={field.key} className={field.span === 2 ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                  <input
                    type={field.key === "email" ? "email" : "text"}
                    value={form[field.key] || ""}
                    onChange={e => handleChange(field.key, e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                      errors[field.key] ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors[field.key] && <p className="text-[11px] text-destructive mt-0.5">{errors[field.key]}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method - now dynamic from DB */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
              {lang.code === "bn" ? "💳 পেমেন্ট পদ্ধতি" : lang.code === "ar" ? "💳 طريقة الدفع" : "💳 Payment Method"}
            </h2>
            <PaymentMethodSelector selectedKey={paymentMethod} onSelect={setPaymentMethod} />

            {/* Transaction reference for crypto/mobile */}
            {needsReference && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {lang.code === "bn" ? "ট্রানজেকশন রেফারেন্স (ঐচ্ছিক)" : lang.code === "ar" ? "مرجع المعاملة (اختياري)" : "Transaction Reference (optional)"}
                </label>
                <input
                  value={txReference}
                  onChange={e => setTxReference(e.target.value)}
                  placeholder={lang.code === "bn" ? "TxID বা রেফারেন্স নম্বর" : "TxID or reference number"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 sticky top-20">
            <h2 className="font-display font-semibold text-base text-foreground">{t("orderSummary")}</h2>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-2.5">
                  <img src={item.product.image} alt={item.product.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.product.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.quantity}x {formatPrice(item.product.price)}</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="text-foreground">{t("free")}</span>
              </div>
            </div>

            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-display font-semibold text-foreground">{t("total")}</span>
              <span className="font-display font-bold text-lg text-foreground">{formatPrice(subtotal)}</span>
            </div>

            {currency.code !== "BDT" && (
              <p className="text-[10px] text-muted-foreground text-center">
                ≈ ৳{subtotal.toLocaleString()} BDT
              </p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                lang.code === "bn" ? "অর্ডার করুন" : lang.code === "ar" ? "تأكيد الطلب" : "Place Order"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
