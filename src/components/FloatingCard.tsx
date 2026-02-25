import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FloatingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export const FloatingCard = ({ icon: Icon, title, description, index = 0 }: FloatingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="bg-card border border-border rounded-2xl p-4 sm:p-5 card-hover"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
};
