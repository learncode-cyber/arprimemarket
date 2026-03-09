import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import { X, Zap, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { useShipping } from "@/hooks/useShipping";
import ShippingMethodSelector from "@/components/checkout/ShippingMethodSelector";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import CountrySelector from "@/components/checkout/CountrySelector";
import {
  getCountryCodeFromName,
  getCountryNameFromCode,
  getDialPrefixForCountry,
  isValidPhoneForCountry,
  normalizePhoneForCountry,
} from "@/lib/phoneUtils";
import PhoneVerification from "@/components/PhoneVerification";
import "react-phone-input-2/lib/style.css";

interface QuickOrderProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

interface QuickOrderModalProps {
  open: boolean;
  onClose: () => void;
  product: QuickOrderProduct;
}

interface PhoneInputCountryData {
  countryCode?: string;
}

export const QuickOrderModal = ({ open, onClose, product }: QuickOrderModalProps) => {
  const { formatPrice } = useCurrency();
  const { lang } = useLanguage();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", country: "Bangladesh" });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [txReference, setTxReference] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const selectedCountryCode = useMemo(() => getCountryCodeFromName(form.country), [form.country]);
  const phoneInputValue = useMemo(() => form.phone.replace(/^\+/, ""), [form.phone]);
  const hasPhoneDigits = useMemo(() => form.phone.replace(/\D/g, "").length >= 6, [form.phone]);
  const isPhoneValid = useMemo(
    () => isValidPhoneForCountry(form.phone, selectedCountryCode),
    [form.phone, selectedCountryCode],
  );

  const { options: shippingOptions, selected: selectedShipping, selectedType: shippingType, setSelectedType: setShippingType } = useShipping(form.country, product.price);
  const shippingCost = selectedShipping?.totalCost ?? 0;
  const total = product.price + shippingCost;

  const tx = (en: string, bn: string, ar: string) => {
    if (lang.code === "bn") return bn;
    if (lang.code === "ar" || lang.code === "sa") return ar;
    return en;
  };

  // Auto-detect country from localStorage (set by CurrencyContext geo-detection)
  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem("arp-detected-country");
      if (saved) {
        setForm((f) => ({ ...f, country: saved }));
      }
    } catch {
      // no-op
    }
  }, [open]);

  // Keep phone prefix in sync with selected country
  useEffect(() => {
    if (!open) return;

    setForm((prev) => {
      const nextPhone = normalizePhoneForCountry(prev.phone, selectedCountryCode);
      if (nextPhone === prev.phone) return prev;
      return { ...prev, phone: nextPhone };
    });
  }, [open, selectedCountryCode]);

  const handlePhoneChange = (value: string, data: PhoneInputCountryData) => {
    const nextCode = getCountryCodeFromName(getCountryNameFromCode(data?.countryCode));
    const nextPhone = value ? `+${value}` : getDialPrefixForCountry(nextCode);

    setForm((f) => ({
      ...f,
      country: getCountryNameFromCode(nextCode),
      phone: nextPhone,
    }));
  };

  const requiredFieldsFilled = Boolean(
    form.name.trim() && form.email.trim() && form.address.trim() && form.phone.trim(),
  );

  const canSubmit =
    requiredFieldsFilled &&
    isPhoneValid &&
    phoneVerified &&
    Boolean(paymentMethod) &&
    (shippingOptions.length === 0 || Boolean(selectedShipping)) &&
    !sending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneVerified) {
      toast.error("Please verify your phone number before placing an order.");
      return;
    }

    if (!requiredFieldsFilled) {
      toast.error("Name, Phone, Email and Address are required");
      return;
    }

    if (!isPhoneValid) {
      toast.error(tx("Please enter a valid phone number for the selected country.", "নির্বাচিত দেশের জন্য সঠিক ফোন নম্বর দিন।", "يرجى إدخال رقم هاتف صالح للبلد المحدد."));
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (shippingOptions.length > 0 && !selectedShipping) {
      toast.error("Please select a shipping method");
      return;
    }

    const normalizedTxReference = txReference.trim();
    const shippingMethod = selectedShipping?.rate.shipping_type || shippingType || null;
    const phoneForOrder = normalizePhoneForCountry(form.phone, selectedCountryCode);

    setSending(true);
    try {
      const orderNumber = "ARP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          order_number: orderNumber,
          status: "pending",
          payment_status: "unpaid",
          payment_method: paymentMethod,
          payment_reference: normalizedTxReference || null,
          subtotal: product.price,
          shipping_cost: shippingCost,
          total,
          shipping_name: form.name.trim(),
          shipping_phone: phoneForOrder,
          shipping_email: form.email.trim(),
          shipping_address: form.address.trim(),
          shipping_country: form.country,
          shipping_method: shippingMethod,
          notes: "1-Click Quick Order (Guest)",
        });

      if (orderError) throw orderError;

      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        total: product.price,
        image_url: product.image,
      });

      if (itemError) throw itemError;

      // Create payment transaction for non-COD (best-effort for guest)
      if (paymentMethod !== "cod") {
        try {
          await supabase.from("payment_transactions").insert({
            order_id: orderId,
            payment_method_key: paymentMethod,
            amount: total,
            currency: "BDT",
            status: "pending",
            transaction_reference: normalizedTxReference || null,
          });
        } catch {
          // non-blocking for guest
        }
      }

      setDone(true);
      toast.success(tx("Order placed successfully!", "অর্ডার সফলভাবে দেওয়া হয়েছে!", "تم تقديم الطلب بنجاح!"));
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setForm({ name: "", phone: "", email: "", address: "", country: "Bangladesh" });
    setPaymentMethod("cod");
    setTxReference("");
    setPhoneVerified(false);
    onClose();
  };

  const needsReference = paymentMethod !== "cod" && paymentMethod !== "visa_mastercard";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl z-10 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm">
                  {tx("Order in 1-Click", "১-ক্লিকে অর্ডার", "اطلب بنقرة واحدة")}
                </span>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-foreground mb-1">
                  {tx("Order Placed!", "অর্ডার সম্পন্ন!", "تم الطلب!")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {tx("We'll contact you shortly to confirm.", "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।", "سنتواصل معك قريبًا للتأكيد.")}
                </p>
                <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                  {tx("Close", "বন্ধ", "إغلاق")}
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {/* Product summary */}
                <div className="px-5 py-3 flex items-center gap-3 bg-secondary/50">
                  <img src={product.image} alt={product.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{product.title}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(product.price)}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                  {/* Contact fields */}
                  <input
                    type="text"
                    placeholder={tx("Your Name *", "আপনার নাম *", "اسمك *")}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    maxLength={100}
                  />

                  <div className="space-y-1">
                    <PhoneInput
                      country={selectedCountryCode.toLowerCase()}
                      value={phoneInputValue}
                      onChange={(value, data) => handlePhoneChange(value, (data || {}) as PhoneInputCountryData)}
                      enableSearch
                      disableSearchIcon
                      countryCodeEditable={false}
                      placeholder={tx("Phone Number *", "ফোন নম্বর *", "رقم الهاتف *")}
                      inputProps={{
                        name: "quick-order-phone",
                        required: true,
                        autoComplete: "tel",
                      }}
                      containerClass="arp-phone-input-container"
                      inputClass="arp-phone-input-field"
                      buttonClass="arp-phone-input-button"
                      dropdownClass="arp-phone-input-dropdown"
                      searchClass="arp-phone-input-search"
                    />
                    {hasPhoneDigits && !isPhoneValid && (
                      <p className="text-[11px] text-destructive px-1">
                        {tx(
                          "Please enter a valid phone number for the selected country.",
                          "নির্বাচিত দেশের জন্য সঠিক ফোন নম্বর দিন।",
                          "يرجى إدخال رقم هاتف صالح للبلد المحدد.",
                        )}
                      </p>
                    )}
                    {isPhoneValid && (
                      <PhoneVerification
                        phone={form.phone}
                        isVerified={phoneVerified}
                        onVerified={() => setPhoneVerified(true)}
                      />
                    )}
                  </div>

                  <input
                    type="email"
                    placeholder={tx("Email *", "ইমেইল *", "البريد الإلكتروني *")}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    maxLength={255}
                  />
                  <textarea
                    placeholder={tx("Delivery Address *", "ডেলিভারি ঠিকানা *", "عنوان التوصيل *")}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full h-16 rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    required
                    maxLength={500}
                  />

                  {/* Country Selector */}
                  <CountrySelector
                    value={form.country}
                    onChange={(val) => {
                      const nextCode = getCountryCodeFromName(val);
                      setForm((f) => ({
                        ...f,
                        country: val,
                        phone: normalizePhoneForCountry(f.phone, nextCode),
                      }));
                    }}
                    label={tx("Country", "দেশ", "البلد")}
                  />

                  {/* Shipping Method */}
                  {shippingOptions.length > 0 && (
                    <ShippingMethodSelector
                      options={shippingOptions}
                      selectedType={shippingType}
                      onSelect={setShippingType}
                      tx={tx}
                    />
                  )}

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground">
                      {tx("Payment Method", "পেমেন্ট পদ্ধতি", "طريقة الدفع")}
                    </h3>
                    <PaymentMethodSelector
                      selectedKey={paymentMethod}
                      onSelect={setPaymentMethod}
                      shippingCountry={form.country}
                    />
                  </div>

                  {/* Transaction reference for digital payments */}
                  {needsReference && (
                    <input
                      type="text"
                      placeholder={tx("Transaction Reference (optional)", "ট্রানজেকশন রেফারেন্স (ঐচ্ছিক)", "مرجع المعاملة (اختياري)")}
                      value={txReference}
                      onChange={(e) => setTxReference(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  {/* Order Summary */}
                  <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{tx("Subtotal", "সাবটোটাল", "المجموع الفرعي")}</span>
                      <span>{formatPrice(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{tx("Shipping", "শিপিং", "الشحن")}</span>
                      <span>{shippingCost === 0 ? tx("Free", "ফ্রি", "مجاني") : formatPrice(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-border">
                      <span>{tx("Total", "মোট", "الإجمالي")}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {sending ? tx("Placing Order...", "অর্ডার হচ্ছে...", "جارٍ تقديم الطلب...") : tx("Place Order", "অর্ডার দিন", "تقديم الطلب")}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
