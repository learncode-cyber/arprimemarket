import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export const CurrencySelector = () => {
  const { currency, currencies, setCurrencyByCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click (desktop only)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open) {
      setSearch("");
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
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
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all touch-manipulation"
      >
        <span className="font-semibold text-foreground text-[11px] sm:text-xs">{currency.code}</span>
        <span className="text-muted-foreground hidden sm:inline">{currency.symbol}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile: full-screen overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 z-[99] sm:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Mobile: bottom sheet */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-2 right-2 bottom-2 z-[100] sm:hidden bg-popover border border-border rounded-2xl shadow-2xl"
              style={{ maxHeight: "75vh" }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h3 className="text-sm font-semibold text-foreground">Select Currency</h3>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary touch-manipulation">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {/* Search */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search currency..."
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              {/* List */}
              <div className="overflow-y-auto scrollbar-hide pb-6" style={{ maxHeight: "calc(75vh - 140px)" }}>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No currency found</p>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrencyByCode(c.code); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors touch-manipulation ${
                        currency.code === c.code
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary active:bg-secondary"
                      }`}
                    >
                      <span className="font-bold w-12 text-left">{c.code}</span>
                      <span className="flex-1 text-left text-muted-foreground">{c.name}</span>
                      <span className="text-muted-foreground opacity-70 text-base">{c.symbol}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>

            {/* Desktop: dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="hidden sm:block absolute top-full right-0 mt-1.5 w-64 bg-popover border border-border rounded-xl shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
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
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs transition-colors ${
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
