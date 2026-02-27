import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSectionContent } from "@/hooks/useSiteContent";

export const FloatingWhatsApp = () => {
  const cmsData = useSectionContent<{ enabled: boolean; phone: string; message: string }>("whatsapp");
  
  const phone = cmsData?.phone || "8801910521565";
  const message = cmsData?.message || "";
  const enabled = cmsData?.enabled !== false;

  if (!enabled) return null;

  const href = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 touch-manipulation"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <MessageCircle className="w-6 h-6" />
    </motion.a>
  );
};
