import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, useProducts } from "@/hooks/useProductData";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface RelatedProductsProps {
  productId: string;
  categoryId?: string;
  title?: string;
  type?: "related" | "upsell";
}

export const RelatedProducts = ({ productId, categoryId, title, type = "related" }: RelatedProductsProps) => {
  const { data: allProducts = [] } = useProducts();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  // Filter related products: same category, exclude current product
  const related = allProducts
    .filter(p => p.id !== productId && (categoryId ? p.category_id === categoryId : true))
    .sort((a, b) => (b.rating * b.review_count) - (a.rating * a.review_count))
    .slice(0, 6);

  // Track impressions
  useEffect(() => {
    if (related.length === 0) return;
    const newIds = related.filter(p => !tracked.has(p.id)).map(p => p.id);
    if (newIds.length === 0) return;

    const events = newIds.map(id => ({
      source_product_id: productId,
      suggested_product_id: id,
      event_type: "impression" as const,
    }));

    supabase.from("upsell_events").insert(events).then(() => {
      setTracked(prev => {
        const next = new Set(prev);
        newIds.forEach(id => next.add(id));
        return next;
      });
    });
  }, [related.length, productId]);

  const trackClick = (suggestedId: string) => {
    supabase.from("upsell_events").insert({
      source_product_id: productId,
      suggested_product_id: suggestedId,
      event_type: "click",
    });
  };

  const trackAddToCart = (suggestedId: string, product: Product) => {
    supabase.from("upsell_events").insert({
      source_product_id: productId,
      suggested_product_id: suggestedId,
      event_type: "add_to_cart",
    });
    addToCart(product);
  };

  if (related.length === 0) return null;

  const heading = title || (type === "upsell" ? "You might also like" : "Customers also bought");

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-12 sm:mt-16"
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">{heading}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {related.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl overflow-hidden group"
          >
            <Link
              to={`/products/${product.slug || product.id}`}
              onClick={() => trackClick(product.id)}
              className="block"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            </Link>
            <div className="p-2.5">
              <Link
                to={`/products/${product.slug || product.id}`}
                onClick={() => trackClick(product.id)}
                className="text-xs font-medium text-foreground line-clamp-2 hover:text-primary transition-colors"
              >
                {product.title}
              </Link>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-muted-foreground">{product.rating}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="font-display font-bold text-sm text-foreground">
                  {formatPrice(product.price)}
                </span>
                <button
                  onClick={() => trackAddToCart(product.id, product)}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors touch-manipulation"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
