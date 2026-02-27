import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Phone, Mail, MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft, 
  Coins, Smartphone, Banknote, Copy, Check, ExternalLink, ChevronRight, Loader2, Package
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OrderFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

const CRYPTO_OPTIONS = [
  { key: "usdt", name: "USDT (Tether)", network: "TRC20", icon: "💵", color: "#26A17B", address: "TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW7" },
  { key: "btc", name: "Bitcoin (BTC)", network: "Bitcoin", icon: "₿", color: "#F7931A", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { key: "eth", name: "Ethereum (ETH)", network: "ERC20", icon: "⟠", color: "#627EEA", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
  { key: "sol", name: "Solana (SOL)", network: "Solana", icon: "◎", color: "#9945FF", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
  { key: "bnb", name: "BNB", network: "BEP20", icon: "🔶", color: "#F3BA2F", address: "bnb1grpf0955h0ber4j6v0ucy35asm3pyv9cl4y89w" },
  { key: "xrp", name: "XRP", network: "XRP Ledger", icon: "✕", color: "#00AAE4", address: "rN7gEqPJVMqrFzmo7rqcBf6sPj5MRDvXCi" },
  { key: "doge", name: "Dogecoin (DOGE)", network: "Dogecoin", icon: "🐕", color: "#C3A634", address: "DFabcd1234567890abcdefghijklmnop" },
  { key: "ada", name: "Cardano (ADA)", network: "Cardano", icon: "₳", color: "#0033AD", address: "addr1qy0x5sr...cardano_address" },
  { key: "avax", name: "Avalanche (AVAX)", network: "C-Chain", icon: "🔺", color: "#E84142", address: "0x1234...avax_address" },
  { key: "dot", name: "Polkadot (DOT)", network: "Polkadot", icon: "●", color: "#E6007A", address: "1FRMM8PEiWXYax7rpS6X4XZX1aAaxSWx1CrKTyrVYhV24fg" },
];

const ChatOrderForm = ({ onClose, onOrderComplete }: { onClose: () => void; onOrderComplete: (orderNumber: string) => void }) => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { lang } = useLanguage();
  const [step, setStep] = useState(1); // 1=info, 2=payment, 3=crypto-select, 4=qr, 5=done
  const [form, setForm] = useState<OrderFormData>({
    name: "", email: "", phone: "", address: "", city: "", country: "Bangladesh", postalCode: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState<typeof CRYPTO_OPTIONS[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [geoDetected, setGeoDetected] = useState(false);

  const isBangladesh = form.country.toLowerCase().includes("bangladesh") || form.country === "BD";

  const tx = (en: string, bn: string) => lang.code === "bn" ? bn : en;

  // Auto-detect country & load profile
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        if (data.country_name) {
          setForm(prev => ({ ...prev, country: data.country_name }));
          setGeoDetected(true);
        }
      } catch { /* use default */ }
    };
    if (!geoDetected) detectCountry();

    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
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
      });
    }
  }, [user]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = tx("Name required", "নাম দিন");
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = tx("Valid email required", "সঠিক ইমেইল দিন");
    if (!form.phone.trim() || form.phone.length < 6) errs.phone = tx("Phone required", "ফোন দিন");
    if (!form.address.trim()) errs.address = tx("Address required", "ঠিকানা দিন");
    if (!form.city.trim()) errs.city = tx("City required", "শহর দিন");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToPayment = () => {
    if (!validateForm()) return;
    setStep(2);
  };

  const selectPayment = (method: string) => {
    setPaymentMethod(method);
    if (method === "binance_pay") {
      setStep(3); // Show crypto options
    } else if (method === "cod") {
      placeOrder(method);
    } else {
      placeOrder(method);
    }
  };

  const selectCrypto = (crypto: typeof CRYPTO_OPTIONS[0]) => {
    setSelectedCrypto(crypto);
    setStep(4); // Show QR
  };

  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const placeOrder = async (method?: string) => {
    const pm = method || paymentMethod;
    setLoading(true);
    try {
      const orderNum = `ARP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const orderData: any = {
        subtotal,
        shipping_cost: isBangladesh ? 60 : 0,
        discount_amount: 0,
        total: subtotal + (isBangladesh ? 60 : 0),
        currency: "BDT",
        order_number: orderNum,
        payment_method: pm,
        payment_status: pm === "cod" ? "cod" : "unpaid",
        shipping_name: form.name,
        shipping_phone: form.phone,
        shipping_email: form.email,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_postal_code: form.postalCode || null,
        shipping_country: form.country,
      };

      if (user) {
        orderData.user_id = user.id;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;

      // Insert order items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          total: item.product.price * item.quantity,
          image_url: item.product.image || null,
        }));
        await supabase.from("order_items").insert(orderItems);
      }

      // Payment transaction
      if (pm !== "cod") {
        await supabase.from("payment_transactions").insert({
          order_id: order.id,
          payment_method_key: pm,
          amount: orderData.total,
          currency: "BDT",
          status: "pending",
          transaction_reference: selectedCrypto ? `${selectedCrypto.name} payment` : null,
        });
      }

      // Send confirmation email (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          action: "order_confirmation",
          to: form.email,
          orderNumber: order.order_number,
          customerName: form.name,
          items: items.map(i => ({ title: i.product.title, quantity: i.quantity, price: i.product.price, image: i.product.image })),
          total: orderData.total,
          paymentMethod: pm,
          shippingAddress: `${form.address}, ${form.city}, ${form.country}`,
        },
      }).catch(() => {});

      clearCart();
      setOrderNumber(order.order_number);
      setStep(5);
      onOrderComplete(order.order_number);
    } catch (err: any) {
      console.error("Order error:", err);
      setErrors({ _general: err.message || "Order failed" });
    } finally {
      setLoading(false);
    }
  };

  const confirmCryptoPayment = () => placeOrder("binance_pay");

  // ── STEP 5: Order Complete ──
  if (step === 5) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 p-3">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">{tx("Order Placed! 🎉", "অর্ডার সম্পন্ন! 🎉")}</h3>
          <p className="text-xs text-muted-foreground">
            {tx("Order", "অর্ডার")} <span className="font-bold text-foreground">{orderNumber}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {tx("A confirmation has been sent to your email.", "আপনার ইমেইলে কনফার্মেশন পাঠানো হয়েছে।")}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Step indicator */}
      <div className="flex items-center gap-1 px-1">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Info Form ── */}
        {step === 1 && (
          <motion.div key="form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-2 p-1">
            <p className="text-xs font-medium text-foreground">{tx("📋 Fill in your details", "📋 আপনার তথ্য দিন")}</p>
            
            {[
              { key: "name", icon: User, label: tx("Full Name", "পূর্ণ নাম"), type: "text" },
              { key: "email", icon: Mail, label: tx("Email", "ইমেইল"), type: "email" },
              { key: "phone", icon: Phone, label: tx("Phone", "ফোন"), type: "tel" },
              { key: "address", icon: MapPin, label: tx("Address", "ঠিকানা"), type: "text" },
              { key: "city", icon: MapPin, label: tx("City", "শহর"), type: "text" },
            ].map(field => (
              <div key={field.key} className="space-y-0.5">
                <div className="relative">
                  <field.icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type={field.type}
                    placeholder={field.label}
                    value={(form as any)[field.key]}
                    onChange={e => {
                      setForm(prev => ({ ...prev, [field.key]: e.target.value }));
                      if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" }));
                    }}
                    className={`pl-8 h-8 text-xs ${errors[field.key] ? "border-destructive" : ""}`}
                  />
                </div>
                {errors[field.key] && <p className="text-[10px] text-destructive pl-1">{errors[field.key]}</p>}
              </div>
            ))}

            {/* Country */}
            <div className="space-y-0.5">
              <Input
                placeholder={tx("Country", "দেশ")}
                value={form.country}
                onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <Button size="sm" className="w-full h-8 text-xs" onClick={goToPayment}>
              {tx("Continue to Payment", "পেমেন্টে যান")} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* ── STEP 2: Payment Selection ── */}
        {step === 2 && (
          <motion.div key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2 p-1">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="w-3.5 h-3.5" /></button>
              <p className="text-xs font-medium text-foreground">{tx("💳 Select Payment Method", "💳 পেমেন্ট পদ্ধতি নির্বাচন করুন")}</p>
            </div>

            {/* Cart summary */}
            {items.length > 0 && (
              <div className="bg-secondary/50 rounded-lg p-2 space-y-1">
                {items.slice(0, 3).map(item => (
                  <div key={item.product.id} className="flex justify-between text-[11px]">
                    <span className="truncate flex-1">{item.product.title} × {item.quantity}</span>
                    <span className="font-medium ml-2">৳{Math.floor(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                {items.length > 3 && <p className="text-[10px] text-muted-foreground">+{items.length - 3} more items</p>}
                <div className="border-t border-border pt-1 flex justify-between text-xs font-semibold">
                  <span>{tx("Total", "মোট")}</span>
                  <span>৳{Math.floor(subtotal + (isBangladesh ? 60 : 0))}</span>
                </div>
              </div>
            )}

            {/* Binance Pay - Recommended */}
            <button
              onClick={() => selectPayment("binance_pay")}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 border-[#F0B90B]/40 bg-[#F0B90B]/5 text-foreground hover:border-[#F0B90B] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/20 flex items-center justify-center text-sm font-bold">⭐</div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold block">{tx("Binance Pay (Recommended)", "বাইন্যান্স পে (রিকমেন্ডেড)")}</span>
                <span className="text-[10px] text-muted-foreground">{tx("10+ crypto options • Fast & Secure", "১০+ ক্রিপ্টো অপশন • দ্রুত ও নিরাপদ")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Other payment methods */}
            {[
              { key: "visa_mastercard", name: tx("Visa / Mastercard", "ভিসা / মাস্টারকার্ড"), icon: CreditCard, desc: tx("Pay with card", "কার্ডে পে করুন") },
              ...(isBangladesh ? [
                { key: "bkash", name: "bKash", icon: Smartphone, desc: tx("Mobile payment", "মোবাইল পেমেন্ট") },
                { key: "nagad", name: "Nagad", icon: Smartphone, desc: tx("Mobile payment", "মোবাইল পেমেন্ট") },
              ] : []),
            ].map(pm => (
              <button
                key={pm.key}
                onClick={() => selectPayment(pm.key)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-background hover:border-foreground/20 transition-all text-left"
              >
                <pm.icon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-xs font-medium block">{pm.name}</span>
                  <span className="text-[10px] text-muted-foreground">{pm.desc}</span>
                </div>
              </button>
            ))}

            {/* COD - Only Bangladesh */}
            {isBangladesh && (
              <button
                onClick={() => selectPayment("cod")}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-background hover:border-foreground/20 transition-all text-left"
              >
                <Banknote className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-xs font-medium block">{tx("Cash on Delivery", "ক্যাশ অন ডেলিভারি")}</span>
                  <span className="text-[10px] text-muted-foreground">{tx("Pay when delivered", "ডেলিভারিতে পে করুন")}</span>
                </div>
              </button>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">{tx("Processing...", "প্রসেসিং...")}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 3: Crypto Selection ── */}
        {step === 3 && (
          <motion.div key="crypto" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2 p-1">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="w-3.5 h-3.5" /></button>
              <p className="text-xs font-medium text-foreground">{tx("🪙 Select Cryptocurrency", "🪙 ক্রিপ্টোকারেন্সি নির্বাচন করুন")}</p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {CRYPTO_OPTIONS.map(crypto => (
                <button
                  key={crypto.key}
                  onClick={() => selectCrypto(crypto)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                >
                  <span className="text-base" style={{ filter: "none" }}>{crypto.icon}</span>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium block truncate">{crypto.name.split("(")[0].trim()}</span>
                    <span className="text-[9px] text-muted-foreground">{crypto.network}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: QR Code ── */}
        {step === 4 && selectedCrypto && (
          <motion.div key="qr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3 p-1">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(3)} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="w-3.5 h-3.5" /></button>
              <p className="text-xs font-medium text-foreground">
                {tx(`Pay with ${selectedCrypto.name}`, `${selectedCrypto.name} দিয়ে পে করুন`)}
              </p>
            </div>

            {/* Amount */}
            <div className="text-center bg-secondary/50 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">{tx("Amount to pay", "পরিশোধযোগ্য")}</p>
              <p className="text-lg font-bold text-foreground">৳{Math.floor(subtotal + (isBangladesh ? 60 : 0))}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl shadow-md border">
                <QRCodeSVG
                  value={selectedCrypto.address}
                  size={150}
                  level="M"
                  imageSettings={{
                    src: "/images/binance-qr.png",
                    x: undefined,
                    y: undefined,
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              {tx("Scan with Binance App to pay", "বাইন্যান্স অ্যাপ দিয়ে স্ক্যান করে পে করুন")}
            </p>

            {/* Address with copy */}
            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg border border-border p-2">
              <code className="flex-1 text-[10px] text-foreground break-all font-mono leading-tight">{selectedCrypto.address}</code>
              <button
                onClick={() => copyAddress(selectedCrypto.address)}
                className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>

            <Button size="sm" className="w-full h-8 text-xs" onClick={confirmCryptoPayment} disabled={loading}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {tx("I've completed the payment ✓", "আমি পেমেন্ট সম্পন্ন করেছি ✓")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {errors._general && (
        <p className="text-[10px] text-destructive text-center">{errors._general}</p>
      )}
    </div>
  );
};

export default ChatOrderForm;
