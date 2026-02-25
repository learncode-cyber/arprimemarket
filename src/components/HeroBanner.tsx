import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
      accent: "from-primary/80",
    },
    {
      id: 2,
      title: t("premiumElectronics"),
      subtitle: t("latestGadgets"),
      description: t("heroDesc2"),
      cta: t("exploreElectronics"),
      link: "/products?category=Electronics",
      image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80",
      accent: "from-foreground/70",
    },
    {
      id: 3,
      title: t("homeLiving"),
      subtitle: t("transformSpace"),
      description: t("heroDesc3"),
      cta: t("shopHome"),
      link: "/products?category=Home",
      image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1200&q=80",
      accent: "from-foreground/60",
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
    <section className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] overflow-hidden bg-secondary">
      <AnimatePresence mode="wait">
        <motion.div key={slide.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.6, ease: "easeInOut" }} className="absolute inset-0">
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" loading={current === 0 ? "eager" : "lazy"} />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent} via-transparent to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-end sm:items-center">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-0">
          <AnimatePresence mode="wait">
            <motion.div key={slide.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, delay: 0.15 }} className="max-w-md">
              <span className="inline-block px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3">
                {slide.subtitle}
              </span>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2 sm:mb-3 drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 mb-4 sm:mb-5 leading-relaxed max-w-sm drop-shadow">
                {slide.description}
              </p>
              <Link to={slide.link}>
                <span className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm transition-all hover:brightness-110 active:scale-[0.97] touch-manipulation">
                  {slide.cta} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button onClick={prev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors touch-manipulation" aria-label="Previous slide">
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button onClick={next} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors touch-manipulation" aria-label="Next slide">
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all touch-manipulation ${i === current ? "w-6 bg-primary" : "w-1.5 bg-white/50"}`} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
};
