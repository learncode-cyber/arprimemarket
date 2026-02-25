import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/hooks/useProductData";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { useLanguage } from "@/context/LanguageContext";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  scrollable?: boolean;
  loading?: boolean;
}

export const ProductSection = ({
  title,
  subtitle,
  products,
  viewAllLink = "/products",
  scrollable = false,
  loading = false,
}: ProductSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {scrollable && (
            <div className="hidden sm:flex gap-1">
              <button onClick={() => scroll("left")} className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors touch-manipulation">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => scroll("right")} className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors touch-manipulation">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <Link to={viewAllLink} className="flex items-center gap-1 text-xs text-primary font-semibold hover:gap-1.5 transition-all touch-manipulation">
            {t("viewAll")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>

      {loading ? (
        scrollable ? (
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-[45%] sm:min-w-[30%] lg:min-w-[23%] xl:min-w-[19%]">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )
      ) : scrollable ? (
        <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-0 sm:px-0 snap-x snap-mandatory">
          {products.map((p, i) => (
            <div key={p.id} className="min-w-[45%] sm:min-w-[30%] lg:min-w-[23%] xl:min-w-[19%] snap-start">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};
