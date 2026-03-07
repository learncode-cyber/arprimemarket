import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { ProductSection } from "@/components/ProductSection";
import FlashSaleTimer from "@/components/FlashSaleTimer";
import { TrustBadges } from "@/components/TrustBadges";
import { CustomerReviews } from "@/components/CustomerReviews";
import PromotionsBanner from "@/components/PromotionsBanner";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useProducts } from "@/hooks/useProductData";
import { useLanguage } from "@/context/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema, websiteSchema } from "@/lib/seoSchemas";

const categoryImages = [
  { name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=85&auto=format&fit=crop" },
  { name: "Fashion", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=85&auto=format&fit=crop" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=85&auto=format&fit=crop" },
  { name: "Home", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=85&auto=format&fit=crop" },
];

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { t } = useLanguage();

  const featured = useMemo(() => products.filter(p => p.is_featured).slice(0, 10), [products]);
  const bestSelling = useMemo(() => products.filter(p => p.tags?.includes("best-selling")).slice(0, 10), [products]);
  const newArrivals = useMemo(() => products.filter(p => p.tags?.includes("new-arrival")).slice(0, 10), [products]);
  const trending = useMemo(() => products.filter(p => p.tags?.includes("trending")).slice(0, 10), [products]);

  return (
    <div className="relative">
      <SEOHead url="/" jsonLd={organizationSchema()} />
      <SEOHead jsonLd={websiteSchema()} />
      <HeroBanner />
      <PromotionsBanner />
      <FlashSaleTimer />
      <TrustBadges />

      <ProductSection title={t("featured")} products={featured} scrollable loading={isLoading} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">{t("shopByCategory")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("findWhatYouNeed")}</p>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {categoryImages.map((cat, i) => (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={`/products?category=${cat.name}`} className="group block relative aspect-[4/5] rounded-2xl overflow-hidden card-hover touch-manipulation">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <span className="font-display font-bold text-sm sm:text-base text-white drop-shadow-md">{cat.name}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <ProductSection title={t("bestSelling")} products={bestSelling} loading={isLoading} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-primary rounded-2xl p-6 sm:p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 sm:w-72 sm:h-72 rounded-full bg-primary-foreground/5 blur-3xl pointer-events-none" />
          <h2 className="font-display text-xl sm:text-3xl font-bold text-primary-foreground mb-2 relative">{t("megaSale")}</h2>
          <p className="text-xs sm:text-sm text-primary-foreground/80 mb-5 max-w-md mx-auto relative">{t("megaSaleDesc")}</p>
          <Link to="/products">
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-foreground text-primary font-semibold text-sm transition-all hover:brightness-95 active:scale-[0.97] touch-manipulation">
              {t("shopTheSale")} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </section>

      <ProductSection title={t("newArrivals")} products={newArrivals} scrollable loading={isLoading} />
      <CustomerReviews />
      <RecentlyViewed />
      <ProductSection title={t("trending")} products={trending} loading={isLoading} />
    </div>
  );
};

export default Index;
