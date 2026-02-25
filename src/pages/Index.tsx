import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Truck, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { FloatingCard } from "@/components/FloatingCard";
import { useProducts } from "@/hooks/useProductData";

const features = [
  { icon: Sparkles, title: "Curated Selection", description: "Hand-picked products for quality and design." },
  { icon: Zap, title: "Fast Delivery", description: "Free shipping on orders over ৳999." },
  { icon: Shield, title: "Secure Payments", description: "256-bit encryption for safe transactions." },
  { icon: Truck, title: "Easy Returns", description: "30-day hassle-free return policy." },
];

const categoryImages = [
  { name: "Electronics", image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&q=80" },
  { name: "Fashion", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80" },
  { name: "Home", image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&q=80" },
];

const Index = () => {
  const { data: products = [] } = useProducts();
  const featured = products.filter(p => p.is_featured).slice(0, 4);
  const displayProducts = featured.length > 0 ? featured : products.slice(0, 4);

  return (
    <div className="relative">
      <HeroSection />

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <FloatingCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Featured Products</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Hand-picked for you</p>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-xs sm:text-sm text-primary font-semibold hover:gap-1.5 transition-all touch-manipulation">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-8"
        >
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Shop by Category</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Find what you're looking for</p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {categoryImages.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/products?category=${cat.name}`}
                className="group block relative aspect-[4/5] rounded-2xl overflow-hidden card-hover touch-manipulation"
              >
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <span className="font-display font-bold text-sm sm:text-base text-primary-foreground">
                    {cat.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-primary-foreground/5 blur-3xl pointer-events-none" />
          <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-3 relative">
            Ready to Elevate Your Style?
          </h2>
          <p className="text-sm text-primary-foreground/80 mb-6 sm:mb-8 max-w-md mx-auto relative">
            Join thousands of satisfied customers who trust AR Prime Market.
          </p>
          <Link to="/products">
            <span className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl bg-primary-foreground text-primary font-semibold text-sm transition-all hover:brightness-95 active:scale-[0.98] touch-manipulation">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-6 sm:p-10 text-center max-w-xl mx-auto"
        >
          <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-1.5">Stay in the Loop</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-5">Get exclusive deals and early access to new arrivals.</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 touch-manipulation"
            />
            <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation">
              Subscribe
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
