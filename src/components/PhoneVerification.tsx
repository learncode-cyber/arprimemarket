import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Phone, CheckCircle, ExternalLink, Shield } from "lucide-react";

interface PhoneVerificationProps {
  phone: string;
  onVerified?: () => void;
  isVerified?: boolean;
}

const PhoneVerification = ({ phone, onVerified, isVerified = false }: PhoneVerificationProps) => {
  const [verifyMethod, setVerifyMethod] = useState<"whatsapp" | "sms" | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);

  // Clean the phone number for WhatsApp link
  const cleanPhone = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");

  const whatsappVerifyLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Hi! I'm verifying my phone number for my order on AR Prime Market. Please confirm this number is active."
  )}`;

  const handleWhatsAppVerify = () => {
    setVerifyMethod("whatsapp");
    setWhatsappSent(true);
    window.open(whatsappVerifyLink, "_blank", "noopener,noreferrer");
    // In production, this would trigger a webhook or admin notification
    // For now, mark as "pending verification"
    setTimeout(() => {
      onVerified?.();
    }, 2000);
  };

  const handleSMSVerify = () => {
    setVerifyMethod("sms");
    // Placeholder: In production, integrate Twilio/MessageBird/Supabase Phone Auth
    // For now, show coming soon message
  };

  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
      >
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-xs font-medium text-green-600 dark:text-green-400">Phone verified</span>
      </motion.div>
    );
  }

  if (!phone || phone.length < 8) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Verify your phone to confirm your order
      </p>
      <div className="flex flex-wrap gap-2">
        {/* WhatsApp verification (free) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWhatsAppVerify}
          disabled={whatsappSent}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all touch-manipulation ${
            whatsappSent
              ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
              : "bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {whatsappSent ? "Verification sent" : "Verify via WhatsApp"}
          {!whatsappSent && <ExternalLink className="w-3 h-3" />}
        </motion.button>

        {/* SMS verification (placeholder) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSMSVerify}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all touch-manipulation"
        >
          <Phone className="w-3.5 h-3.5" />
          Verify via SMS
          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full">Soon</span>
        </motion.button>
      </div>

      {verifyMethod === "sms" && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg"
        >
          SMS verification will be available soon. Please use WhatsApp verification for now.
        </motion.p>
      )}

      {whatsappSent && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-muted-foreground bg-green-500/5 p-2 rounded-lg"
        >
          A WhatsApp message has been opened. Our team will verify your number shortly.
        </motion.p>
      )}
    </div>
  );
};

export default PhoneVerification;
