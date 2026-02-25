import { useState } from "react";
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
}

const PaymentMethodSelector = ({ selectedKey, onSelect }: Props) => {
  const { data: methods = [], isLoading } = usePaymentMethods(true);
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

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

  if (methods.length === 0) {
    return <p className="text-sm text-muted-foreground">No payment methods available.</p>;
  }

  const selected = methods.find(m => m.method_key === selectedKey);

  // Group methods by type for display
  const grouped: Record<string, PaymentMethod[]> = {};
  methods.forEach(m => {
    const type = m.method_type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(m);
  });

  return (
    <div className="space-y-4">
      {/* Payment method buttons */}
      <div className="space-y-1.5">
        {methods.map(method => {
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
