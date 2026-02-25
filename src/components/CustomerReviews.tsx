import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const reviews = [
  { name: "Ayesha R.", rating: 5, text: "Amazing quality! The delivery was super fast and the packaging was premium. Will definitely order again.", avatar: "AR" },
  { name: "Tanvir H.", rating: 5, text: "Best online shopping experience in BD. The products are exactly as shown. Highly recommended!", avatar: "TH" },
  { name: "Nusrat J.", rating: 4, text: "Love the variety of products. Customer support was very helpful when I had a question about sizing.", avatar: "NJ" },
];

export const CustomerReviews = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-5 sm:mb-8">
        <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">{t("customerReviews")}</h2>
        <p className="text-xs text-muted-foreground mt-1">{t("realReviews")}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {reviews.map((r, i) => (
          <motion.div key={r.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-4 sm:p-5 rounded-2xl bg-card border border-border relative">
            <Quote className="w-6 h-6 text-primary/15 absolute top-3 right-3" />
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[11px] font-bold text-primary">{r.avatar}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{r.name}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`w-2.5 h-2.5 ${si < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
