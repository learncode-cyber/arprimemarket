import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export const CurrencySelector = () => {
  const { currency, currencies, setCurrencyByCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all touch-manipulation"
      >
        <span className="font-semibold text-foreground">{currency.code}</span>
        <span className="text-muted-foreground hidden sm:inline">{currency.symbol}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1.5 w-52 bg-popover border border-border rounded-xl shadow-xl z-[60] overflow-hidden py-1 max-h-80 overflow-y-auto scrollbar-hide"
          >
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => { setCurrencyByCode(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs transition-colors touch-manipulation ${
                  currency.code === c.code
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <span className="font-bold w-8 text-left">{c.code}</span>
                <span className="flex-1 text-left text-muted-foreground">{c.name}</span>
                <span className="text-muted-foreground opacity-70">{c.symbol}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
