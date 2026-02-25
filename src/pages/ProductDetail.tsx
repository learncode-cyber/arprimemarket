import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, ArrowLeft, Minus, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useProduct } from "@/hooks/useProductData";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTracking } from "@/context/TrackingContext";
import { SEOHead } from "@/components/SEOHead";
import { productSchema, breadcrumbSchema } from "@/lib/seoSchemas";

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || "");
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { trackViewContent } = useTracking();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      trackViewContent({ id: product.id, title: product.title, price: product.price, category: product.category, currency: product.currency });
    }
  }, [product, trackViewContent]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-muted-foreground text-sm">Product not found</p>
        <Link to="/products" className="text-primary text-sm mt-4 inline-block">← {t("backToProducts")}</Link>
      </div>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <SEOHead
        title={product.title}
        description={product.description || `Buy ${product.title} at AR Prime Market.`}
        image={product.image}
        url={`/products/${product.slug}`}
        type="product"
        jsonLd={productSchema(product)}
      />
      <SEOHead jsonLd={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        { name: product.title, url: `/products/${product.slug}` },
      ])} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link to="/products" className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 touch-manipulation">
          <ArrowLeft className="w-4 h-4" /> {t("backToProducts")}
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="bg-card border border-border rounded-2xl overflow-hidden aspect-square">
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="flex flex-col justify-center space-y-4 sm:space-y-5">
          <span className="inline-flex self-start px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider">
            {product.category}
          </span>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{product.title}</h1>

          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{product.rating} {t("rating")}</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-base sm:text-lg text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
            {product.compare_at_price && (
              <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 border border-border rounded-xl px-3 py-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 hover:bg-secondary rounded-md transition-colors touch-manipulation active:scale-90">
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-medium w-7 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-1 hover:bg-secondary rounded-md transition-colors touch-manipulation active:scale-90">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button onClick={handleAdd} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation">
              <ShoppingCart className="w-4 h-4" /> {t("addToCart")}
            </button>
            <button className="p-3.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors touch-manipulation">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
