import { motion } from "framer-motion";
import { Product } from "@/lib/dummyData";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -8 }}
      className="group glass rounded-2xl overflow-hidden float-shadow"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
            }}
            className="absolute top-3 right-3 p-2 rounded-full glass opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4 text-foreground" />
          </motion.button>
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
            {product.category}
          </span>
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">{product.rating}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-lg text-foreground">
            ${product.price.toFixed(2)}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => addToCart(product)}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:glow-primary transition-shadow"
          >
            <ShoppingCart className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
