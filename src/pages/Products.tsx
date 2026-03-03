import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Loader2, X, ArrowUpDown, ChevronDown, PackageX } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/useProductData";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { SEOHead } from "@/components/SEOHead";
import { collectionPageSchema } from "@/lib/seoSchemas";

const ITEMS_PER_PAGE = 12;

type SortOption = "newest" | "price-asc" | "price-desc" | "rating" | "name" | "popularity";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialSort = (searchParams.get("sort") as SortOption) || "newest";
  const initialMinPrice = Number(searchParams.get("min_price")) || 0;
  const initialMaxPrice = Number(searchParams.get("max_price")) || 0;
  const initialRating = Number(searchParams.get("rating")) || 0;
  const initialSearch = searchParams.get("q") || "";
  const initialInStock = searchParams.get("in_stock") === "true";

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMinPrice, initialMaxPrice]);
  const [showFilters, setShowFilters] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(initialRating);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const { data: products = [], isLoading } = useProducts();
  const { data: dbCategories = [] } = useCategories();
  const categories = useMemo(() => ["All", ...dbCategories.map(c => c.name)], [dbCategories]);

  const maxPrice = useMemo(() => Math.max(...products.map(p => p.price), 100000), [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesRating = p.rating >= ratingFilter;
      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "name": result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break; // newest is default from DB
    }

    return result;
  }, [search, category, products, sortBy, priceRange, ratingFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (cat === "All") params.delete("category");
    else params.set("category", cat);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const activeFilters = (category !== "All" ? 1 : 0) + (ratingFilter > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const clearAllFilters = () => {
    setCategory("All");
    setRatingFilter(0);
    setPriceRange([0, maxPrice]);
    setSearch("");
    setSortBy("newest");
    setPage(1);
    setSearchParams({});
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "rating", label: "Top Rated" },
    { value: "name", label: "Name A-Z" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <SEOHead
        title="Products"
        description="Browse premium curated products — electronics, fashion, accessories and more at AR Prime Market."
        url="/products"
        jsonLd={collectionPageSchema("Products", "Browse our curated collection of premium products")}
      />
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t("products")}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("browseCollection")}</p>
      </motion.header>

      {/* Search + Sort Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="flex flex-col gap-3 mb-5 sm:mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={t("searchProducts")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-md touch-manipulation">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all touch-manipulation whitespace-nowrap ${
              showFilters || activeFilters > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as SortOption); setPage(1); }}
              className="appearance-none px-3.5 pr-8 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation cursor-pointer"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
                category === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  {activeFilters > 0 && (
                    <button onClick={clearAllFilters} className="text-xs text-primary hover:underline touch-manipulation">
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Price Range: {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min={0}
                        max={maxPrice}
                        step={100}
                        value={priceRange[0]}
                        onChange={e => { setPriceRange([Number(e.target.value), priceRange[1]]); setPage(1); }}
                        className="flex-1 accent-[hsl(var(--primary))]"
                      />
                      <input
                        type="range"
                        min={0}
                        max={maxPrice}
                        step={100}
                        value={priceRange[1]}
                        onChange={e => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
                        className="flex-1 accent-[hsl(var(--primary))]"
                      />
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Minimum Rating
                    </label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4].map(r => (
                        <button
                          key={r}
                          onClick={() => { setRatingFilter(r); setPage(1); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation ${
                            ratingFilter === r
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {r === 0 ? "All" : `${r}+ ★`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "product" : "products"} found
        </p>
        {activeFilters > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-primary hover:underline touch-manipulation">
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : paginated.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {paginated.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">{t("noProductsFound")}</p>
          {activeFilters > 0 && (
            <button onClick={clearAllFilters} className="text-primary text-sm mt-2 hover:underline touch-manipulation">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center gap-1.5 mt-8 sm:mt-10" aria-label="Pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                page === i + 1 ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
              aria-current={page === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}
    </section>
  );
};

export default Products;