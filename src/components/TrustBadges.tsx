import { motion } from "framer-motion";
import { ShieldCheck, Truck, RotateCcw, HeadphonesIcon } from "lucide-react";

const badges = [
  { icon: ShieldCheck, title: "Secure Checkout", desc: "SSL encrypted payments" },
  { icon: Truck, title: "Free Shipping", desc: "On orders over ৳999" },
  { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: HeadphonesIcon, title: "24/7 Support", desc: "We're here to help" },
];

export const TrustBadges = () => (
  <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {badges.map((b, i) => (
        <motion.div
          key={b.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <b.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-[11px] sm:text-xs text-foreground">{b.title}</h4>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">{b.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);
