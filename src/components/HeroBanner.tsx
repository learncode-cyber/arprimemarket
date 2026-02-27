import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

export const HeroBanner = () => {
  const { t } = useLanguage();

  const slides = [
    {
      id: 1,
      title: t("newSeasonCollection"),
      subtitle: t("upTo40Off"),
      description: t("heroDesc1"),
      cta: t("shopNow"),
      link: "/products",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop",
      accent: "from-rose-900/80 via-rose-900/40",
      badge: "🔥 Hot Deal",
    },
    {
      id: 2,
      title: t("premiumElectronics"),
      subtitle: t("latestGadgets"),
      description: t("heroDesc2"),
      cta: t("exploreElectronics"),
      link: "/products?category=Electronics",
      image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80&auto=format&fit=crop",
      accent: "from-slate-900/80 via-slate-900/40",
      badge: "⚡ New Arrivals",
    },
    {
      id: 3,
      title: t("homeLiving"),
      subtitle: t("transformSpace"),
      description: t("heroDesc3"),
      cta: t("shopHome"),
      link: "/products?category=Home",
      image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1200&q=80&auto=format&fit=crop",
      accent: "from-emerald-900/70 via-emerald-900/30",
      badge: "✨ Trending",
    },
  ];

  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.8/1] overflow-hidden bg-secondary">
      {/* Background image with parallax-like zoom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-muted animate-pulse" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover relative z-[1]"
            loading={current === 0 ? "eager" : "lazy"}
            decoding={current === 0 ? "sync" : "async"}
            fetchPriority={current === 0 ? "high" : "auto"}
            onLoad={(e) => { (e.currentTarget.previousElementSibling as HTMLElement)?.classList.add('hidden'); }}
          />
          {/* Rich gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent} to-transparent z-[2]`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-[2]" />
          {/* Decorative glow */}
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-primary/20 blur-[80px] z-[2] pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 z-[3] flex items-end sm:items-center">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
              className="max-w-lg"
            >
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-medium mb-3"
              >
                <Sparkles className="w-3 h-3" />
                {slide.badge}
              </motion.span>

              {/* Subtitle tag */}
              <span className="block mb-2">
                <span className="inline-block px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                  {slide.subtitle}
                </span>
              </span>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-2 sm:mb-3 drop-shadow-lg">
                {slide.title}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm md:text-base text-white/85 mb-5 sm:mb-6 leading-relaxed max-w-md drop-shadow">
                {slide.description}
              </p>

              {/* CTA Button */}
              <Link to={slide.link}>
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-lg shadow-primary/30 transition-all hover:brightness-110 touch-manipulation"
                >
                  {slide.cta} <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      <button onClick={prev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[4] p-2.5 sm:p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 transition-colors touch-manipulation" aria-label="Previous slide">
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button onClick={next} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[4] p-2.5 sm:p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 transition-colors touch-manipulation" aria-label="Next slide">
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[4] flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 touch-manipulation ${i === current ? "w-7 h-2 bg-primary shadow-lg shadow-primary/40" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
