import { useMemo } from "react";
import { useProducts } from "@/hooks/useProductData";
import { useCart, CartItem } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ShoppingCart, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

export const CartUpsell = () => {
  const { items, addToCart } = useCart();
  const { data: allProducts = [] } = useProducts();
  const { formatPrice } = useCurrency();

  const suggestions = useMemo(() => {
    if (items.length === 0 || allProducts.length === 0) return [];

    const cartIds = new Set(items.map(i => i.product.id));
    const cartCategories = new Set(items.map(i => i.product.category_id).filter(Boolean));

    // Find products in same categories but not in cart, sorted by popularity
    return allProducts
      .filter(p => !cartIds.has(p.id) && cartCategories.has(p.category_id))
      .sort((a, b) => (b.rating * b.review_count) - (a.rating * a.review_count))
      .slice(0, 4);
  }, [items, allProducts]);

  if (suggestions.length === 0) return null;

  const handleAdd = (product: any) => {
    // Track upsell conversion
    const sourceId = items[0]?.product.id;
    if (sourceId) {
      supabase.from("upsell_events").insert({
        source_product_id: sourceId,
        suggested_product_id: product.id,
        event_type: "add_to_cart",
      });
    }
    addToCart(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">Frequently bought together</h3>
      </div>

      <div className="space-y-2.5">
        {suggestions.map(product => (
          <div key={product.id} className="flex items-center gap-3">
            <Link to={`/products/${product.slug || product.id}`} className="shrink-0">
              <img
                src={product.image}
                alt={product.title}
                className="w-12 h-12 rounded-lg object-cover"
                loading="lazy"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/products/${product.slug || product.id}`}
                className="text-xs font-medium text-foreground line-clamp-1 hover:text-primary transition-colors"
              >
                {product.title}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-display font-bold text-xs text-foreground">{formatPrice(product.price)}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] text-muted-foreground">{product.rating}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleAdd(product)}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors touch-manipulation shrink-0"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
