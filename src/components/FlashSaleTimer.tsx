import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  promotion_type: string;
  discount_type: string;
  discount_value: number;
  ends_at: string | null;
  banner_url: string | null;
}

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-foreground/10 backdrop-blur-sm rounded-xl w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
      <span className="font-display text-lg sm:text-xl font-bold text-primary-foreground tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="text-[9px] sm:text-[10px] text-primary-foreground/60 mt-1 uppercase tracking-wider">{label}</span>
  </div>
);

const FlashSaleTimer = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchPromos = async () => {
      const { data } = await supabase
        .from("promotions")
        .select("id, name, description, promotion_type, discount_type, discount_value, ends_at, banner_url")
        .eq("is_active", true)
        .eq("promotion_type", "flash_sale")
        .not("ends_at", "is", null)
        .gt("ends_at", new Date().toISOString())
        .order("priority", { ascending: false })
        .limit(3);
      setPromotions((data as Promotion[]) || []);
    };
    fetchPromos();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter out ended promotions in real-time
  const active = promotions.filter(p => p.ends_at && new Date(p.ends_at).getTime() > now);

  if (active.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="space-y-3">
        {active.map((promo, i) => {
          const diff = new Date(promo.ends_at!).getTime() - now;
          const days = Math.floor(diff / 86400000);
          const hours = Math.floor((diff % 86400000) / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);

          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/70"
            >
              {/* Animated glow */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/5 blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary-foreground/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
              </div>

              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6">
                {/* Left: Info */}
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary-foreground/10 items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <Zap className="w-3.5 h-3.5 text-primary-foreground sm:hidden" />
                      <span className="text-[10px] uppercase tracking-widest text-primary-foreground/70 font-semibold">Flash Sale</span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-primary-foreground mt-0.5">
                      {promo.name}
                    </h3>
                    <p className="text-xs text-primary-foreground/70 mt-0.5">
                      {promo.discount_type === "percentage"
                        ? `Up to ${promo.discount_value}% OFF`
                        : `৳${promo.discount_value} OFF`}
                      {promo.description && ` · ${promo.description}`}
                    </p>
                  </div>
                </div>

                {/* Center: Timer */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {days > 0 && (
                    <>
                      <TimeBlock value={days} label="Days" />
                      <span className="text-primary-foreground/40 font-bold text-lg mb-4">:</span>
                    </>
                  )}
                  <TimeBlock value={hours} label="Hrs" />
                  <span className="text-primary-foreground/40 font-bold text-lg mb-4">:</span>
                  <TimeBlock value={minutes} label="Min" />
                  <span className="text-primary-foreground/40 font-bold text-lg mb-4">:</span>
                  <TimeBlock value={seconds} label="Sec" />
                </div>

                {/* Right: CTA */}
                <Link to="/products" className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-foreground text-primary font-semibold text-xs sm:text-sm transition-all hover:brightness-95 active:scale-[0.97] touch-manipulation">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FlashSaleTimer;
