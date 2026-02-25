import { motion } from "framer-motion";
import { Truck, Zap } from "lucide-react";
import { ShippingOption } from "@/hooks/useShipping";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  options: ShippingOption[];
  selectedType: string;
  onSelect: (type: string) => void;
  tx: (en: string, bn: string, ar: string) => string;
}

const typeConfig: Record<string, { icon: typeof Truck; labelEn: string; labelBn: string; labelAr: string }> = {
  standard: { icon: Truck, labelEn: "Standard Shipping", labelBn: "স্ট্যান্ডার্ড শিপিং", labelAr: "الشحن العادي" },
  express: { icon: Zap, labelEn: "Express Shipping", labelBn: "এক্সপ্রেস শিপিং", labelAr: "الشحن السريع" },
};

const ShippingMethodSelector = ({ options, selectedType, onSelect, tx }: Props) => {
  const { formatPrice } = useCurrency();

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">
        {tx("Shipping Method", "শিপিং পদ্ধতি", "طريقة الشحن")}
      </h3>
      {options.map((opt) => {
        const config = typeConfig[opt.rate.shipping_type] || typeConfig.standard;
        const Icon = config.icon;
        const isSelected = selectedType === opt.rate.shipping_type;

        return (
          <motion.button
            key={opt.rate.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt.rate.shipping_type)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all touch-manipulation text-left ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {tx(config.labelEn, config.labelBn, config.labelAr)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {tx(
                  `${opt.estimatedDays} business days`,
                  `${opt.estimatedDays} কার্যদিবস`,
                  `${opt.estimatedDays} أيام عمل`
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              {opt.isFree ? (
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {tx("Free", "ফ্রি", "مجاني")}
                </span>
              ) : (
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(opt.totalCost)}
                </span>
              )}
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              isSelected ? "border-primary" : "border-muted-foreground/30"
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ShippingMethodSelector;
