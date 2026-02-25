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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group glass rounded-2xl overflow-hidden flex flex-col"
    >
      <Link to={`/products/${product.id}`} className="block" aria-label={`View ${product.title}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
            {product.category}
          </span>
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-tight hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{product.rating}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-display font-bold text-base sm:text-lg text-foreground">
            ৳{product.price.toLocaleString()}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addToCart(product)}
            className="p-2.5 sm:p-2.5 rounded-xl bg-primary text-primary-foreground active:scale-95 transition-transform touch-manipulation"
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingCart className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
});

ProductCard.displayName = "ProductCard";
