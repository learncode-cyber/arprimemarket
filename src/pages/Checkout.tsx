import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle, MapPin, ShieldCheck, Truck, RotateCcw, Lock, Tag, X, Package, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import ShippingMethodSelector from "@/components/checkout/ShippingMethodSelector";
import CountrySelector from "@/components/checkout/CountrySelector";
import InternationalPhoneInput from "@/components/InternationalPhoneInput";
import PhoneVerification from "@/components/PhoneVerification";
import { useTracking } from "@/context/TrackingContext";
import { securityService } from "@/lib/services";
import { useShipping } from "@/hooks/useShipping";
import { api } from "@/lib/api";
import { InvoiceDownload } from "@/components/InvoiceDownload";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

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

const steps = [
  { id: 0, icon: Package, labelEn: "Cart", labelBn: "কার্ট", labelAr: "السلة" },
  { id: 1, icon: MapPin, labelEn: "Address", labelBn: "ঠিকানা", labelAr: "العنوان" },
  { id: 2, icon: Lock, labelEn: "Payment", labelBn: "পেমেন্ট", labelAr: "الدفع" },
  { id: 3, icon: CheckCircle, labelEn: "Confirm", labelBn: "নিশ্চিত", labelAr: "تأكيد" },
];

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { formatPrice, currency, convertPrice } = useCurrency();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackInitiateCheckout, trackPurchase } = useTracking();

  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState<ShippingForm>({
    name: "", phone: "", email: "", address: "", city: "", postalCode: "", country: "Bangladesh",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [txReference, setTxReference] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [placedOrderData, setPlacedOrderData] = useState<any>(null);
  const [placedOrderItems, setPlacedOrderItems] = useState<any[]>([]);
  const affiliateRef = sessionStorage.getItem("affiliate_ref") || null;

  const { options: shippingOptions, selected: selectedShipping, selectedType: shippingType, setSelectedType: setShippingType, loading: shippingLoading } = useShipping(form.country, subtotal);
  const shippingCost = selectedShipping?.totalCost ?? 0;
  const total = subtotal - couponDiscount + shippingCost;

  // Load user profile data
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm(prev => ({
          ...prev,
          name: data.full_name || prev.name,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          city: data.city || prev.city,
          country: data.country || prev.country,
          email: user.email || prev.email,
        }));
      }
    };
    loadProfile();
  }, [user]);

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
    // Strict phone validation with libphonenumber-js
    const countryCode = (COUNTRY_NAME_TO_CODE[form.country] || "BD") as CountryCode;
    const parsed = parsePhoneNumberFromString(form.phone, countryCode);
    if (!parsed || !parsed.isValid()) {
      setErrors(prev => ({ ...prev, phone: `Invalid phone number for ${form.country}` }));
      return false;
    }
    setErrors({});
    return true;
  };

  // Country name to code map for validation
  const COUNTRY_NAME_TO_CODE: Record<string, string> = {
    "Bangladesh": "BD", "India": "IN", "Pakistan": "PK", "United States": "US",
    "United Kingdom": "GB", "United Arab Emirates": "AE", "Saudi Arabia": "SA",
    "Qatar": "QA", "Kuwait": "KW", "Malaysia": "MY", "Singapore": "SG",
    "Australia": "AU", "Canada": "CA", "Germany": "DE", "France": "FR",
    "Italy": "IT", "Spain": "ES", "Turkey": "TR", "Egypt": "EG",
    "Nigeria": "NG", "Japan": "JP", "South Korea": "KR", "China": "CN",
    "Indonesia": "ID", "Thailand": "TH", "Brazil": "BR", "Mexico": "MX",
    "Nepal": "NP", "Sri Lanka": "LK", "Philippines": "PH", "Vietnam": "VN",
    "Bahrain": "BH", "Oman": "OM", "Kenya": "KE", "Myanmar": "MM",
    "Iraq": "IQ", "Jordan": "JO", "Lebanon": "LB",
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.coupons.validate(couponCode.trim(), subtotal);

      if (res.error || !res.data?.valid) {
        toast({ title: res.error || (lang.code === "bn" ? "কুপন পাওয়া যায়নি" : "Invalid coupon"), variant: "destructive" });
        setCouponLoading(false);
        return;
      }

      setCouponDiscount(res.data.calculated_discount);
      setAppliedCoupon(res.data.code);
      toast({ title: lang.code === "bn" ? "কুপন প্রয়োগ হয়েছে!" : "Coupon applied!" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const goToPayment = () => {
    if (!validate()) return;
    trackInitiateCheckout(subtotal, items.map(i => ({
      id: i.product.id, title: i.product.title, price: i.product.price,
      category: i.product.category, quantity: i.quantity,
    })));
    setActiveStep(2);
  };

  const goToConfirm = () => {
    setActiveStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (!user) {
      toast({ title: lang.code === "bn" ? "লগইন করুন" : "Please login", description: lang.code === "bn" ? "অর্ডার দিতে লগইন প্রয়োজন।" : "You need to be logged in.", variant: "destructive" });
      navigate("/login");
      return;
    }
    // Strict email verification enforcement
    if (!user.email_confirmed_at) {
      toast({
        title: lang.code === "bn" ? "ইমেইল ভেরিফাই করুন" : "Email not verified",
        description: lang.code === "bn" ? "অর্ডার দিতে আপনার ইমেইল ভেরিফাই করতে হবে। ইনবক্স চেক করুন।" : "You must verify your email before placing an order. Please check your inbox.",
        variant: "destructive",
      });
      return;
    }
    if (items.length === 0) return;

    // Check email verification status
    const isEmailVerified = user.email_confirmed_at != null;
    const isFullyVerified = isEmailVerified && phoneVerified;

    setLoading(true);
    try {
      // Fraud detection check
      const fraudCheck = await securityService.checkFraud({
        total,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        shippingName: form.name,
      });

      if (fraudCheck.action === "block") {
        toast({ title: "Order could not be processed", description: "Please contact support.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (fraudCheck.action === "review") {
        console.info("Order flagged for review:", fraudCheck.flags);
      }

      const isCOD = paymentMethod === "cod";
      // Order locking: unverified users get "awaiting_verification" status
      const orderStatus = !isFullyVerified ? "awaiting_verification" : (isCOD ? "pending" : "awaiting_payment");
      const orderPaymentStatus = isCOD ? "unpaid" : "unpaid";

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          subtotal,
          shipping_cost: shippingCost,
          discount_amount: couponDiscount,
          total,
          currency: "BDT",
          order_number: "TEMP",
          payment_method: paymentMethod,
          payment_status: orderPaymentStatus,
          status: orderStatus,
          payment_reference: txReference.trim() || null,
          shipping_name: form.name,
          shipping_phone: form.phone,
          shipping_email: form.email,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_postal_code: form.postalCode || null,
          shipping_country: form.country,
          shipping_method: selectedShipping?.rate.shipping_type || shippingType || null,
        })
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;

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

      if (paymentMethod !== "cod") {
        await supabase.from("payment_transactions").insert({
          order_id: order.id,
          payment_method_key: paymentMethod,
          amount: total,
          currency: "BDT",
          status: "pending",
          transaction_reference: txReference.trim() || null,
        });
      }

      // Track purchase conversion
      trackPurchase(order.order_number, total, items.map(i => ({
        id: i.product.id, title: i.product.title, price: i.product.price,
        category: i.product.category, quantity: i.quantity,
      })));

      // Credit affiliate commission if referred
      if (affiliateRef) {
        Promise.resolve(supabase.rpc("credit_affiliate_commission", {
          _affiliate_code: affiliateRef,
          _order_id: order.id,
          _order_total: total,
        })).then(() => {
          sessionStorage.removeItem("affiliate_ref");
        }).catch(err => console.warn("Affiliate credit failed (non-blocking):", err));
      }

      // Only auto-forward verified COD orders (non-COD must wait for payment, unverified must wait for verification)
      if (isCOD && isFullyVerified) {
        supabase.functions.invoke("order-processor", {
          body: { action: "process_order", order_id: order.id },
        }).catch(err => console.warn("Auto-forward failed (non-blocking):", err));
      }

      // Send order confirmation email (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          action: "order_confirmation",
          order: {
            id: order.id,
            order_number: order.order_number,
            name: form.name,
            email: form.email,
            items: orderItems.map(i => ({ title: i.title, quantity: i.quantity, total: i.total })),
            subtotal,
            shipping_cost: shippingCost,
            total,
          },
        },
      }).catch(err => console.warn("Email failed (non-blocking):", err));

      clearCart();
      setOrderPlaced(order.order_number);
      // Store order data for invoice download on success page
      setPlacedOrderData({
        order_number: order.order_number,
        created_at: new Date().toISOString(),
        status: orderStatus,
        payment_status: orderPaymentStatus,
        shipping_name: form.name,
        shipping_phone: form.phone,
        shipping_email: form.email,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_country: form.country,
        subtotal,
        discount_amount: couponDiscount,
        shipping_cost: shippingCost,
        tax_amount: 0,
        total,
        tracking_number: null,
        payment_method: paymentMethod,
      });
      setPlacedOrderItems(orderItems.map(i => ({ title: i.title, quantity: i.quantity, price: i.price, total: i.total })));
      toast({ title: lang.code === "bn" ? "অর্ডার সম্পন্ন!" : "Order placed!", description: `${order.order_number}` });
    } catch (err: any) {
      console.error("Order error:", err);
      toast({ title: lang.code === "bn" ? "অর্ডার ব্যর্থ" : "Order failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tx = (en: string, bn: string, ar: string) => {
    if (lang.code === "bn") return bn;
    if (lang.code === "ar" || lang.code === "sa") return ar;
    return en;
  };

  // ─── ORDER SUCCESS ───
  if (orderPlaced) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {paymentMethod === "cod"
              ? tx("Order Confirmed!", "অর্ডার নিশ্চিত!", "تم تأكيد الطلب!")
              : tx("Order Placed — Awaiting Payment", "অর্ডার দেওয়া হয়েছে — পেমেন্ট অপেক্ষায়", "تم تقديم الطلب — في انتظار الدفع")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tx("Your order", "আপনার অর্ডার", "طلبك")}{" "}
            <span className="font-bold text-foreground">{orderPlaced}</span>{" "}
            {paymentMethod === "cod"
              ? tx("has been confirmed successfully.", "সফলভাবে নিশ্চিত হয়েছে।", "تم تأكيده بنجاح.")
              : tx("will be processed after payment verification.", "পেমেন্ট যাচাইয়ের পর প্রসেস করা হবে।", "ستتم معالجته بعد التحقق من الدفع.")}
          </p>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="w-4 h-4 text-primary" />
              <span>{tx("Estimated delivery: 3-7 business days", "আনুমানিক ডেলিভারি: ৩-৭ কার্যদিবস", "التسليم المتوقع: ٣-٧ أيام عمل")}</span>
            </div>
            {paymentMethod !== "cod" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" />
                <span>{tx("Order will process after payment confirmation", "পেমেন্ট কনফার্ম হলে অর্ডার প্রসেস হবে", "سيتم معالجة الطلب بعد تأكيد الدفع")}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm touch-manipulation hover:brightness-105 transition-all">
              {t("dashboard")}
            </Link>
            <Link to="/products" className="px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold text-sm touch-manipulation hover:bg-secondary transition-all">
              {t("continueShopping")}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── EMPTY CART ───
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">{t("emptyCart")}</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm touch-manipulation">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  const needsReference = paymentMethod !== "cod" && paymentMethod !== "visa_mastercard";

  const formFields: { key: keyof ShippingForm; label: string; span: number; type?: string }[] = [
    { key: "name", label: tx("Full Name", "পূর্ণ নাম", "الاسم الكامل"), span: 1 },
    { key: "email", label: tx("Email", "ইমেইল", "البريد الإلكتروني"), span: 1, type: "email" },
    { key: "address", label: tx("Address", "ঠিকানা", "العنوان"), span: 2 },
    { key: "city", label: tx("City", "শহর", "المدينة"), span: 1 },
    { key: "postalCode", label: tx("Postal Code", "পোস্টাল কোড", "الرمز البريدي"), span: 1 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-28 lg:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link to="/cart" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 touch-manipulation">
          <ArrowLeft className="w-3.5 h-3.5" /> {tx("Back to Cart", "কার্টে ফিরুন", "العودة للسلة")}
        </Link>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("checkout")}</h1>
      </motion.div>

      {/* Step Indicator */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = activeStep >= step.id;
            const isCurrent = activeStep === step.id;
            const label = lang.code === "bn" ? step.labelBn : (lang.code === "ar" || lang.code === "sa") ? step.labelAr : step.labelEn;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ scale: isCurrent ? 1.1 : 1 }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {activeStep > step.id ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </motion.div>
                  <span className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 sm:mx-3 rounded-full transition-colors duration-300 ${
                    activeStep > step.id ? "bg-primary" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Guest notice */}
          {!user && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-xs text-foreground">
                {tx("Log in for a faster checkout experience", "দ্রুত চেকআউটের জন্য লগইন করুন", "سجّل الدخول لتجربة أسرع")}
              </p>
              <Link to="/login" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap ml-3">
                {t("login")} →
              </Link>
            </motion.div>
          )}

          {/* Step 1: Address */}
          <AnimatePresence mode="wait">
            {activeStep === 1 && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {tx("Shipping Address", "শিপিং ঠিকানা", "عنوان الشحن")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formFields.map(field => (
                    <div key={field.key} className={field.span === 2 ? "sm:col-span-2" : ""}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
                      <input
                        type={field.type || "text"}
                        value={form[field.key] || ""}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all touch-manipulation ${
                          errors[field.key] ? "border-destructive ring-1 ring-destructive/20" : "border-border"
                        }`}
                      />
                      {errors[field.key] && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-destructive mt-1">
                          {errors[field.key]}
                        </motion.p>
                      )}
                    </div>
                  ))}

                  {/* International Phone Input */}
                  <div className="sm:col-span-2">
                    <InternationalPhoneInput
                      value={form.phone}
                      onChange={(val) => handleChange("phone", val)}
                      country={form.country}
                      label={tx("Phone Number", "ফোন নম্বর", "رقم الهاتف")}
                      error={errors.phone}
                      placeholder="1XXXXXXXXX"
                    />
                    {/* Phone Verification */}
                    <div className="mt-2">
                      <PhoneVerification
                        phone={form.phone}
                        isVerified={phoneVerified}
                        onVerified={() => setPhoneVerified(true)}
                      />
                    </div>
                  </div>

                  {/* Country selector */}
                  <div>
                    <CountrySelector
                      value={form.country}
                      onChange={(val) => handleChange("country", val)}
                      label={tx("Country", "দেশ", "البলد")}
                    />
                  </div>
                </div>

                {/* Email verification notice */}
                {user && !user.email_confirmed_at && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[11px] text-foreground">
                      {tx(
                        "Please verify your email to ensure faster order processing. Check your inbox for a verification link.",
                        "দ্রুত অর্ডার প্রসেসিংয়ের জন্য আপনার ইমেইল ভেরিফাই করুন। ভেরিফিকেশন লিংকের জন্য ইনবক্স চেক করুন।",
                        "يرجى التحقق من بريدك الإلكتروني لضمان معالجة أسرع للطلب."
                      )}
                    </p>
                  </motion.div>
                )}

                {/* Shipping Method */}
                <div className="mt-2">
                  <ShippingMethodSelector options={shippingOptions} selectedType={shippingType} onSelect={setShippingType} tx={tx} />
                </div>

                <button
                  onClick={goToPayment}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2 mt-2"
                >
                  {tx("Continue to Payment", "পেমেন্টে যান", "متابعة الدفع")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {activeStep === 2 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      {tx("Payment Method", "পেমেন্ট পদ্ধতি", "طريقة الدفع")}
                    </h2>
                    <button onClick={() => setActiveStep(1)} className="text-xs text-primary hover:underline touch-manipulation">
                      {tx("Edit Address", "ঠিকানা পরিবর্তন", "تعديل العنوان")}
                    </button>
                  </div>
                  <PaymentMethodSelector selectedKey={paymentMethod} onSelect={setPaymentMethod} shippingCountry={form.country} />

                  {needsReference && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {tx("Transaction Reference (optional)", "ট্রানজেকশন রেফারেন্স (ঐচ্ছিক)", "مرجع المعاملة (اختياري)")}
                      </label>
                      <input
                        value={txReference}
                        onChange={e => setTxReference(e.target.value)}
                        placeholder={tx("TxID or reference number", "TxID বা রেফারেন্স নম্বর", "معرف المعاملة أو الرقم المرجعي")}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
                      />
                    </div>
                  )}
                </div>

                {/* Coupon */}
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                  <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-primary" />
                    {tx("Discount Code", "ডিসকাউন্ট কোড", "رمز الخصم")}
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl px-4 py-3 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">{appliedCoupon}</span>
                      <span className="text-xs">(-{formatPrice(couponDiscount)})</span>
                      <button onClick={removeCoupon} className="ml-auto p-1 hover:bg-green-500/20 rounded-lg touch-manipulation">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder={tx("Enter code", "কোড দিন", "أدخل الرمز")}
                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-5 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-40"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : tx("Apply", "প্রয়োগ", "تطبيق")}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={goToConfirm}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2"
                >
                  {tx("Review Order", "অর্ডার রিভিউ", "مراجعة الطلب")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {activeStep === 3 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {/* Address summary */}
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {tx("Shipping To", "শিপিং করা হবে", "الشحن إلى")}
                    </h3>
                    <button onClick={() => setActiveStep(1)} className="text-xs text-primary hover:underline touch-manipulation">
                      {tx("Edit", "পরিবর্তন", "تعديل")}
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p className="font-medium text-foreground">{form.name}</p>
                    <p>{form.address}, {form.city}</p>
                    <p>{form.phone} · {form.email}</p>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { icon: ShieldCheck, en: "Secure Payment", bn: "নিরাপদ পেমেন্ট", ar: "دفع آمن" },
                    { icon: Truck, en: "3-7 Day Delivery", bn: "৩-৭ দিনে ডেলিভারি", ar: "تسليم ٣-٧ أيام" },
                    { icon: RotateCcw, en: "30-Day Returns", bn: "৩০ দিনে রিটার্ন", ar: "إرجاع ٣٠ يوم" },
                    { icon: Lock, en: "SSL Encrypted", bn: "SSL এনক্রিপ্টেড", ar: "مشفر SSL" },
                  ].map((badge, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
                      <badge.icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{tx(badge.en, badge.bn, badge.ar)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 lg:sticky lg:top-20">
            <h2 className="font-display font-semibold text-base text-foreground">{t("orderSummary")}</h2>

            {/* Items */}
            <div className="space-y-3 max-h-56 overflow-y-auto scrollbar-hide">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="relative">
                    <img src={item.product.image} alt={item.product.title} className="w-14 h-14 rounded-xl object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{item.product.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{formatPrice(item.product.price)} × {item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap self-center">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{tx("Discount", "ডিসকাউন্ট", "الخصم")}</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("shipping")}
                  {selectedShipping && (
                    <span className="text-[10px] ml-1">({selectedShipping.rate.shipping_type})</span>
                  )}
                </span>
                <span className="text-foreground">{shippingCost === 0 ? t("free") : formatPrice(shippingCost)}</span>
              </div>
              {selectedShipping?.isFree && (
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  {tx("Free standard shipping applied!", "ফ্রি স্ট্যান্ডার্ড শিপিং প্রয়োগ হয়েছে!", "تم تطبيق الشحن المجاني!")}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-3 flex justify-between items-end">
              <span className="font-display font-semibold text-foreground">{t("total")}</span>
              <div className="text-right">
                <span className="font-display font-bold text-lg text-foreground">{formatPrice(total)}</span>
                {currency.code !== "BDT" && (
                  <p className="text-[10px] text-muted-foreground">≈ ৳{Math.round(total).toLocaleString()} BDT</p>
                )}
              </div>
            </div>

            {/* Delivery estimate */}
            <div className="bg-muted/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">
                {selectedShipping ? tx(
                  `Estimated delivery: ${selectedShipping.estimatedDays} business days`,
                  `আনুমানিক ডেলিভারি: ${selectedShipping.estimatedDays} কার্যদিবস`,
                  `التسليم المتوقع: ${selectedShipping.estimatedDays} أيام عمل`
                ) : tx("Estimated delivery: 3-7 business days", "আনুমানিক ডেলিভারি: ৩-৭ কার্যদিবস", "التسليم المتوقع: ٣-٧ أيام عمل")}
              </span>
            </div>

            {/* Desktop place order (step 3 only) */}
            {activeStep === 3 && (
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="hidden lg:flex w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation disabled:opacity-60 items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {tx("Processing...", "প্রসেসিং...", "جاري المعالجة...")}</>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {tx("Place Order", "অর্ডার করুন", "تأكيد الطلب")}
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Mobile Sticky Button */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-card/95 backdrop-blur-xl border-t border-border px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{t("total")}</span>
          <span className="font-display font-bold text-foreground">{formatPrice(total)}</span>
        </div>
        {activeStep === 1 && (
          <button
            onClick={goToPayment}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2"
          >
            {tx("Continue to Payment", "পেমেন্টে যান", "متابعة الدفع")}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {activeStep === 2 && (
          <button
            onClick={goToConfirm}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation flex items-center justify-center gap-2"
          >
            {tx("Review Order", "অর্ডার রিভিউ", "مراجعة الطلب")}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {activeStep === 3 && (
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {tx("Processing...", "প্রসেসিং...", "جاري المعالجة...")}</>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {tx("Place Order", "অর্ডার করুন", "تأكيد الطلب")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Checkout;