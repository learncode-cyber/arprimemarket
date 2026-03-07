import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Product } from "@/hooks/useProductData";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslatedText } from "@/hooks/useTranslatedText";
import { ShoppingCart, Star, Zap, GitCompare } from "lucide-react";
import { Link } from "react-router-dom";
import { WishlistButton } from "@/components/WishlistButton";
import { performanceUtils } from "@/lib/services";
import { QuickOrderModal } from "@/components/QuickOrderModal";

interface ProductCardProps {
  product: Product;
  index?: number;
  onCompare?: (product: Product) => void;
  isComparing?: boolean;
}

export const ProductCard = memo(({ product, index = 0, onCompare, isComparing }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const translatedTitle = useTranslatedText(product.title);
  const [quickOrder, setQuickOrder] = useState(false);
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="group bg-card border border-border rounded-2xl overflow-hidden card-hover flex flex-col"
    >
      <Link to={`/products/${product.id}`} className="block" aria-label={`View ${product.title}`}>
        <div className="relative aspect-square overflow-hidden bg-white">
          <div className="absolute inset-0 bg-muted animate-pulse" />
          <img
            src={performanceUtils.optimizeImageUrl(product.image, 400)}
            srcSet={performanceUtils.generateSrcSet(product.image) || undefined}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-110 relative z-[1]"
            loading="lazy"
            decoding="async"
            onLoad={(e) => { (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add('hidden'); }}
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add('hidden'); }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] font-bold">
                -{discount}%
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {onCompare && (
              <button
                onClick={(e) => { e.preventDefault(); onCompare(product); }}
                className={`p-1.5 rounded-lg backdrop-blur-sm transition-all ${isComparing ? "bg-primary text-primary-foreground" : "bg-card/80 text-muted-foreground hover:text-foreground"}`}
                aria-label="Compare"
              >
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            )}
            <WishlistButton productId={product.id} className="bg-card/80 backdrop-blur-sm rounded-lg" />
          </div>
        </div>
      </Link>

      <div className="p-2.5 sm:p-3.5 flex flex-col gap-1 flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-[11px] sm:text-sm text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
            {translatedTitle}
          </h3>
        </Link>

        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/15"}`}
            />
          ))}
          <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-0.5">({product.review_count})</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-sm sm:text-base text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); setQuickOrder(true); }}
              className="p-2 sm:p-2.5 rounded-lg bg-accent text-accent-foreground active:scale-90 transition-all touch-manipulation hover:brightness-110"
              aria-label="Order in 1-Click"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product); }}
              className="p-2 sm:p-2.5 rounded-lg bg-primary text-primary-foreground active:scale-90 transition-all touch-manipulation hover:brightness-110"
              aria-label={t("addToCart")}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <QuickOrderModal open={quickOrder} onClose={() => setQuickOrder(false)} product={{ id: product.id, title: product.title, price: product.price, image: product.image }} />
    </motion.article>
  );
});

ProductCard.displayName = "ProductCard";
