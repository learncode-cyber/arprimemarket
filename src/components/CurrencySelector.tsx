import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export const CurrencySelector = () => {
  const { currency, currencies, setCurrencyByCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return currencies;
    const q = search.toLowerCase();
    return currencies.filter(
      c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.includes(q)
    );
  }, [search, currencies]);

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
            className="absolute top-full right-0 mt-1.5 w-60 bg-popover border border-border rounded-xl shadow-xl z-[60] overflow-hidden"
          >
            {/* Search bar */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search currency..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-hide py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No currency found</p>
              ) : (
                filtered.map((c) => (
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
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
