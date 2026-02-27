import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Coins, Smartphone, Banknote, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { usePaymentMethods, PaymentMethod } from "@/hooks/usePaymentMethods";
import { useLanguage } from "@/context/LanguageContext";
import { QRCodeSVG } from "qrcode.react";

const iconMap: Record<string, any> = {
  Banknote, Smartphone, CreditCard, Coins,
};

interface Props {
  selectedKey: string;
  onSelect: (key: string) => void;
  shippingCountry?: string;
}

const PaymentMethodSelector = ({ selectedKey, onSelect, shippingCountry }: Props) => {
  const { data: allMethods = [], isLoading, isError } = usePaymentMethods(true);
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Filter COD: only show for Bangladesh
  const isBangladesh = !shippingCountry || shippingCountry.toLowerCase().includes("bangladesh") || shippingCountry === "BD";
  const methods = allMethods.filter(m => {
    if (m.method_type === "cod" && !isBangladesh) return false;
    return true;
  });

  // Auto-switch away from COD if not Bangladesh
  useEffect(() => {
    if (!isBangladesh && selectedKey === "cod" && methods.length > 0) {
      onSelect(methods[0].method_key);
    }
  }, [isBangladesh, selectedKey, methods.length]);

  const getName = (m: PaymentMethod) => {
    if (lang.code === "bn" && m.display_name_bn) return m.display_name_bn;
    if (lang.code === "ar" && m.display_name_ar) return m.display_name_ar;
    return m.display_name;
  };

  const getInstructions = (m: PaymentMethod) => {
    if (lang.code === "bn" && m.instructions_bn) return m.instructions_bn;
    if (lang.code === "ar" && m.instructions_ar) return m.instructions_ar;
    return m.instructions;
  };

  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />)}</div>;
  }

  // Fallback payment methods when DB returns empty (e.g. anon/guest users)
  const fallbackMethods: PaymentMethod[] = (() => {
    const base: PaymentMethod[] = [
      { id: "fb-binance", method_type: "crypto", method_key: "binance_pay", display_name: "⭐ Binance Pay (Recommended)", display_name_bn: "⭐ বাইন্যান্স পে (প্রস্তাবিত)", display_name_ar: "⭐ بينانس باي (موصى به)", icon_name: "Coins", is_active: true, wallet_address: null, deposit_link: null, instructions: "Pay via Binance Pay — fast, secure, zero fees", instructions_bn: "বাইন্যান্স পে দিয়ে পেমেন্ট করুন — দ্রুত, নিরাপদ, শূন্য ফি", instructions_ar: "ادفع عبر بينانس باي — سريع وآمن وبدون رسوم", network: null, sort_order: 3 },
      { id: "fb-visa", method_type: "card", method_key: "visa_mastercard", display_name: "Visa / Mastercard", display_name_bn: "ভিসা / মাস্টারকার্ড", display_name_ar: "فيزا / ماستركارد", icon_name: "CreditCard", is_active: true, wallet_address: null, deposit_link: null, instructions: "Pay with card", instructions_bn: "কার্ড দিয়ে পেমেন্ট করুন", instructions_ar: "ادفع بالبطاقة", network: null, sort_order: 4 },
    ];
    if (isBangladesh) {
      base.unshift(
        { id: "fb-bkash", method_type: "mobile", method_key: "bkash", display_name: "bKash", display_name_bn: "বিকাশ", display_name_ar: "بي كاش", icon_name: "Smartphone", is_active: true, wallet_address: null, deposit_link: null, instructions: "Send payment to bKash", instructions_bn: "বিকাশে পেমেন্ট পাঠান", instructions_ar: "أرسل الدفعة عبر بي كاش", network: null, sort_order: 1 },
        { id: "fb-nagad", method_type: "mobile", method_key: "nagad", display_name: "Nagad", display_name_bn: "নগদ", display_name_ar: "ناجاد", icon_name: "Smartphone", is_active: true, wallet_address: null, deposit_link: null, instructions: "Send payment to Nagad", instructions_bn: "নগদে পেমেন্ট পাঠান", instructions_ar: "أرسل الدفعة عبر ناجاد", network: null, sort_order: 2 },
      );
      base.push(
        { id: "fb-cod", method_type: "cod", method_key: "cod", display_name: "Cash on Delivery", display_name_bn: "ক্যাশ অন ডেলিভারি", display_name_ar: "الدفع عند الاستلام", icon_name: "Banknote", is_active: true, wallet_address: null, deposit_link: null, instructions: "Pay when you receive the product", instructions_bn: "পণ্য পাওয়ার সময় পেমেন্ট করুন", instructions_ar: "ادفع عند استلام المنتج", network: null, sort_order: 5 },
      );
    }
    return base;
  })();

  const finalMethods = methods.length > 0 ? methods : fallbackMethods;

  if (finalMethods.length === 0) {
    return <p className="text-sm text-muted-foreground">No payment methods available.</p>;
  }

  const selected = finalMethods.find(m => m.method_key === selectedKey);

  // Group methods by type for display
  const grouped: Record<string, PaymentMethod[]> = {};
  finalMethods.forEach(m => {
    const type = m.method_type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(m);
  });

  return (
    <div className="space-y-4">
      {/* Payment method buttons */}
      <div className="space-y-1.5">
        {finalMethods.map(method => {
          const Icon = iconMap[method.icon_name || ""] || Coins;
          const isSelected = selectedKey === method.method_key;

          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.method_key)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all touch-manipulation text-left ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block">{getName(method)}</span>
                {method.network && <span className="text-[10px] opacity-70">{method.network}</span>}
              </div>
              {method.method_type === "crypto" && <Coins className="w-4 h-4 opacity-40" />}
            </button>
          );
        })}
      </div>

      {/* Selected payment details */}
      <AnimatePresence mode="wait">
        {selected && (selected.wallet_address || selected.instructions) && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-muted/30 border border-border rounded-xl p-4 space-y-3"
          >
            {/* Instructions */}
            {getInstructions(selected) && (
              <p className="text-xs text-muted-foreground">{getInstructions(selected)}</p>
            )}

            {/* Wallet / Address with QR */}
            {selected.wallet_address && (
              <div className="space-y-3">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QRCodeSVG
                      value={selected.deposit_link || selected.wallet_address}
                      size={140}
                      level="M"
                    />
                  </div>
                </div>

                {/* Address with copy */}
                <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-2.5">
                  <code className="flex-1 text-xs text-foreground break-all font-mono">{selected.wallet_address}</code>
                  <button
                    onClick={() => copyAddress(selected.wallet_address!)}
                    className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors touch-manipulation"
                    title="Copy address"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>

                {/* Deposit link */}
                {selected.deposit_link && (
                  <a
                    href={selected.deposit_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {lang.code === "bn" ? "ডিপোজিট লিঙ্কে যান" : lang.code === "ar" ? "انتقل إلى رابط الإيداع" : "Open deposit link"}
                  </a>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentMethodSelector;
