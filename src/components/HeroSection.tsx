import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
      {/* Soft decorative blobs */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full bg-primary/3 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32 relative">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-5 sm:mb-6"
          >
            New Collection 2026
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-foreground"
          >
            Discover Premium
            <br />
            <span className="text-gradient-primary">Products</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="mt-4 sm:mt-5 text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed"
          >
            Curated collection of premium quality products. Shop with confidence at AR Prime Market.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            <Link to="/products" className="w-full sm:w-auto">
              <span className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.98] touch-manipulation">
                Shop Now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link to="/products?category=Electronics" className="w-full sm:w-auto">
              <span className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3 rounded-xl border border-border bg-card text-foreground font-semibold text-sm transition-all hover:bg-secondary active:scale-[0.98] touch-manipulation">
                Browse Categories
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
