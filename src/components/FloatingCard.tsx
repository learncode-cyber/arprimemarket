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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 float-shadow"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-xs sm:text-base text-foreground mb-1 sm:mb-2">{title}</h3>
      <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
};
