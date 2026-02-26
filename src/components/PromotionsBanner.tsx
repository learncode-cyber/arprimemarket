import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Gift, Clock, ChevronLeft, ChevronRight, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  ends_at: string | null;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  expires_at: string | null;
}

const PromotionsBanner = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [current, setCurrent] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    const fetchOffers = async () => {
      const now = new Date().toISOString();
      const [promoRes, couponRes] = await Promise.all([
        supabase.from("promotions").select("id, name, description, discount_type, discount_value, ends_at")
          .eq("is_active", true).or(`ends_at.is.null,ends_at.gt.${now}`).order("priority", { ascending: false }).limit(5),
        supabase.from("coupons").select("id, code, discount_type, discount_value, min_order_amount, expires_at")
          .eq("is_active", true).or(`expires_at.is.null,expires_at.gt.${now}`).limit(5),
      ]);
      if (promoRes.data) setPromotions(promoRes.data);
      if (couponRes.data) setCoupons(couponRes.data);
    };
    fetchOffers();
  }, []);

  const allOffers = [
    ...promotions.map(p => ({
      id: p.id,
      type: "promo" as const,
      title: p.name,
      desc: p.description,
      discount: p.discount_type === "percentage" ? `${p.discount_value}%` : `৳${p.discount_value}`,
      endsAt: p.ends_at,
    })),
    ...coupons.map(c => ({
      id: c.id,
      type: "coupon" as const,
      title: `Code: ${c.code}`,
      desc: c.min_order_amount ? `Min order ৳${c.min_order_amount}` : null,
      discount: c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`,
      code: c.code,
      endsAt: c.expires_at,
    })),
  ];

  useEffect(() => {
    if (allOffers.length <= 1) return;
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % allOffers.length), 5000);
    return () => clearInterval(timer);
  }, [allOffers.length]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (allOffers.length === 0) return null;

  const offer = allOffers[current % allOffers.length];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
      <div className="relative bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,hsl(var(--primary)/0.05),transparent_60%)]" />

        <div className="relative flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {allOffers.length > 1 && (
            <button onClick={() => setCurrent(prev => (prev - 1 + allOffers.length) % allOffers.length)}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors shrink-0 touch-manipulation">
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={offer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }} className="flex-1 flex items-center justify-center gap-3 sm:gap-4 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {offer.type === "coupon" ? <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <span className="font-display font-bold text-sm sm:text-base text-foreground">{offer.discount} OFF</span>
                  <span className="text-xs text-muted-foreground truncate">{offer.title}</span>
                </div>
                {offer.desc && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{offer.desc}</p>}
              </div>

              {"code" in offer && offer.code && (
                <button onClick={() => copyCode(offer.code!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0 hover:brightness-105 active:scale-95 transition-all touch-manipulation">
                  {copiedCode === offer.code ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedCode === offer.code ? (lang.code === "bn" ? "কপি হয়েছে!" : "Copied!") : offer.code}
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          {allOffers.length > 1 && (
            <button onClick={() => setCurrent(prev => (prev + 1) % allOffers.length)}
              className="p-1.5 rounded-full hover:bg-primary/10 transition-colors shrink-0 touch-manipulation">
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>

        {/* Dots */}
        {allOffers.length > 1 && (
          <div className="flex justify-center gap-1 pb-2">
            {allOffers.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current % allOffers.length ? "bg-primary" : "bg-primary/20"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PromotionsBanner;
