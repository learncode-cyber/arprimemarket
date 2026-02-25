import { memo } from "react";
import { motion } from "framer-motion";
import { Product } from "@/hooks/useProductData";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group bg-card border border-border rounded-2xl overflow-hidden card-hover"
    >
      <Link to={`/products/${product.id}`} className="block" aria-label={`View ${product.title}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider">
            {product.category}
          </span>
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{product.rating}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1.5">
          <span className="font-display font-bold text-sm sm:text-base text-foreground">
            ৳{product.price.toLocaleString()}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="p-2 sm:p-2.5 rounded-lg bg-primary text-primary-foreground active:scale-90 transition-all touch-manipulation hover:brightness-105"
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
});

ProductCard.displayName = "ProductCard";
