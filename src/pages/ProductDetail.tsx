import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, ArrowLeft, Minus, Plus, Loader2, Share2, Zap } from "lucide-react";
import { ShareButtons } from "@/components/SocialLinks";
import { useState, useEffect } from "react";
import { useProduct } from "@/hooks/useProductData";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTracking } from "@/context/TrackingContext";
import { QuickOrderModal } from "@/components/QuickOrderModal";
import { SEOHead } from "@/components/SEOHead";
import { productSchema, breadcrumbSchema } from "@/lib/seoSchemas";
import { ProductReviews } from "@/components/ProductReviews";
import { VariantSelector } from "@/components/VariantSelector";
import { RelatedProducts } from "@/components/RelatedProducts";

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: variants = [] } = useProductVariants(id || "");
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { trackViewContent } = useTracking();
  const [qty, setQty] = useState(1);
  const [quickOrder, setQuickOrder] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (product) {
      trackViewContent({ id: product.id, title: product.title, price: product.price, category: product.category, currency: product.currency });
    }
  }, [product, trackViewContent]);

  // Auto-select first variant
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

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

  const effectivePrice = product.price + (selectedVariant?.price_delta || 0);
  const effectiveComparePrice = product.compare_at_price
    ? product.compare_at_price + (selectedVariant?.price_delta || 0)
    : null;

  const handleAdd = () => {
    const variantData = selectedVariant
      ? { id: selectedVariant.id, label: selectedVariant.variant_label || [selectedVariant.size, selectedVariant.color].filter(Boolean).join(" / "), priceDelta: selectedVariant.price_delta }
      : undefined;
    for (let i = 0; i < qty; i++) addToCart(product, variantData);
  };

  const isOutOfStock = selectedVariant ? selectedVariant.stock_quantity <= 0 : product.stock_quantity <= 0;

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
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="eager" decoding="async" fetchPriority="high" />
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
              {formatPrice(effectivePrice)}
            </span>
            {effectiveComparePrice && (
              <span className="text-base sm:text-lg text-muted-foreground line-through">
                {formatPrice(effectiveComparePrice)}
              </span>
            )}
            {effectiveComparePrice && (
              <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                -{Math.round(((effectiveComparePrice - effectivePrice) / effectiveComparePrice) * 100)}%
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selectedVariant={selectedVariant}
              onSelect={setSelectedVariant}
              basePrice={product.price}
            />
          )}

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
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" /> {isOutOfStock ? "Out of Stock" : t("addToCart")}
            </button>
            <button
              onClick={() => setQuickOrder(true)}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation disabled:opacity-50"
            >
              <Zap className="w-4 h-4" /> Order in 1-Click
            </button>
            <button className="p-3.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors touch-manipulation">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Share Buttons */}
          <ShareButtons url={`/products/${product.slug}`} title={product.title} />

          {product && (
            <QuickOrderModal
              open={quickOrder}
              onClose={() => setQuickOrder(false)}
              product={{ id: product.id, title: product.title, price: effectivePrice, image: product.image }}
            />
          )}
        </motion.div>
      </div>

      {/* Related Products / Cross-sell */}
      <RelatedProducts productId={product.id} categoryId={product.category_id} />

      {/* Product Reviews */}
      <ProductReviews productId={product.id} />
    </div>
  );
};

export default ProductDetail;
