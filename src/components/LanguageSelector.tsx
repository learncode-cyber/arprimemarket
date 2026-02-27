import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Search, X } from "lucide-react";
import { useLanguage, languages } from "@/context/LanguageContext";

export const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();
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
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return languages;
    const q = search.toLowerCase();
    return languages.filter(
      l => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all touch-manipulation"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-medium">{lang.nativeName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 z-[99] sm:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Mobile bottom sheet */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[100] sm:hidden bg-popover border-t border-border rounded-t-2xl shadow-2xl"
              style={{ maxHeight: "80vh" }}
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <h3 className="text-sm font-semibold text-foreground">Select Language</h3>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary touch-manipulation">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search language..."
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="overflow-y-auto scrollbar-hide pb-6" style={{ maxHeight: "calc(80vh - 140px)" }}>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No language found</p>
                ) : (
                  filtered.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors touch-manipulation ${
                        lang.code === l.code
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary active:bg-secondary"
                      }`}
                    >
                      <span className="font-medium flex-1 text-left">{l.nativeName}</span>
                      <span className="text-muted-foreground text-xs uppercase">{l.code}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>

            {/* Desktop dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="hidden sm:block absolute top-full right-0 mt-1.5 w-60 bg-popover border border-border rounded-xl shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search language..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-hide py-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No language found</p>
                ) : (
                  filtered.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs transition-colors ${
                        lang.code === l.code
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="font-medium flex-1 text-left">{l.nativeName}</span>
                      <span className="text-muted-foreground text-[10px] uppercase">{l.code}</span>
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
