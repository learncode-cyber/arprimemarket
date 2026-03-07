import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useProductData";
import { useCurrency } from "@/context/CurrencyContext";

export const AdvancedSearch = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { formatPrice } = useCurrency();

  const results = query.length >= 2
    ? products
        .filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  const trending = products
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 4);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search products..."
            className="w-full pl-10 pr-8 py-2 rounded-xl border border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </form>

      <AnimatePresence>
        {open && (query.length >= 2 || query.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-2 w-full bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {results.length > 0 ? (
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1 font-semibold">Results</p>
                {results.map(p => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <img src={p.image || "/placeholder.svg"} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-border/50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-primary font-semibold">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No products found</div>
            ) : (
              <div className="p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Trending
                </p>
                {trending.map(p => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <img src={p.image || "/placeholder.svg"} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-border/50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-primary font-semibold">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
