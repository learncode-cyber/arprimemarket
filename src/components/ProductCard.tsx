import { memo } from "react";
import { motion } from "framer-motion";
import { Product } from "@/hooks/useProductData";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { WishlistButton } from "@/components/WishlistButton";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
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
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] font-bold">
                -{discount}%
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <WishlistButton productId={product.id} className="bg-card/80 backdrop-blur-sm rounded-lg" />
          </div>
        </div>
      </Link>

      <div className="p-2.5 sm:p-3.5 flex flex-col gap-1 flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-[11px] sm:text-sm text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
            {product.title}
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
          <button
            onClick={(e) => { e.preventDefault(); addToCart(product); }}
            className="p-2 sm:p-2.5 rounded-lg bg-primary text-primary-foreground active:scale-90 transition-all touch-manipulation hover:brightness-110"
            aria-label={t("addToCart")}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
});

ProductCard.displayName = "ProductCard";
