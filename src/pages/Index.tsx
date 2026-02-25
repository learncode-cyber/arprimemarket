import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Truck, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { FloatingCard } from "@/components/FloatingCard";
import { useProducts } from "@/hooks/useProductData";

const features = [
  { icon: Sparkles, title: "Curated Selection", description: "Every product hand-picked for quality and design excellence." },
  { icon: Zap, title: "Fast Delivery", description: "Free express shipping on orders over ৳999. Get it in 2 days." },
  { icon: Shield, title: "Secure Payments", description: "256-bit encryption keeps your transactions safe and private." },
  { icon: Truck, title: "Easy Returns", description: "30-day hassle-free returns. No questions asked." },
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
    <div className="relative overflow-hidden">
      <HeroSection />

      {/* Features */}
      <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {features.map((f, i) => (
            <FloatingCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-6 sm:mb-10"
        >
          <div>
            <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-foreground">Featured Products</h2>
            <p className="text-sm text-muted-foreground mt-1">Hand-picked for you</p>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-xs sm:text-sm text-primary font-medium hover:gap-2 transition-all touch-manipulation">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {displayProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 sm:mb-10 text-center"
        >
          Shop by Category
        </motion.h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {categoryImages.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={`/products?category=${cat.name}`}
                className="group block relative aspect-square rounded-2xl overflow-hidden float-shadow touch-manipulation"
              >
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <span className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 font-display font-semibold text-sm sm:text-lg text-primary-foreground">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <h2 className="font-display text-xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 relative">
            Ready to Elevate Your Style?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto relative">
            Join thousands of satisfied customers who trust AR Prime Market for premium quality.
          </p>
          <Link to="/products">
            <motion.span
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-primary touch-manipulation"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Newsletter */}
      <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-xl mx-auto"
        >
          <Mail className="w-8 sm:w-10 h-8 sm:h-10 text-primary mx-auto mb-3 sm:mb-4" />
          <h3 className="font-display text-lg sm:text-2xl font-bold text-foreground mb-2">Stay in the Loop</h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Get exclusive deals and early access to new arrivals.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm touch-manipulation"
            >
              Subscribe
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
