import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Shield, KeyRound } from "lucide-react";

interface PhoneVerificationProps {
  phone: string;
  onVerified?: () => void;
  isVerified?: boolean;
}

const MOCK_OTP = "123456";
const OTP_LENGTH = 6;

const PhoneVerification = ({ phone, onVerified, isVerified = false }: PhoneVerificationProps) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = useCallback(() => {
    setSent(true);
    setError("");
    setOtp(Array(OTP_LENGTH).fill(""));
    // In production: call edge function to send OTP via WhatsApp/SMS
    // For now, mock OTP is 123456
  }, []);

  const verifyOtp = useCallback(
    (code: string) => {
      if (code === MOCK_OTP) {
        setError("");
        onVerified?.();
      } else {
        setError("Invalid code. Please try again. (Hint: 123456)");
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    },
    [onVerified],
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const digit = value.slice(-1);
      setOtp((prev) => {
        const next = [...prev];
        next[index] = digit;
        const code = next.join("");
        if (code.length === OTP_LENGTH && !next.includes("")) {
          setTimeout(() => verifyOtp(code), 100);
        }
        return next;
      });
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [verifyOtp],
  );

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;
      const digits = pasted.split("");
      const next = Array(OTP_LENGTH).fill("");
      digits.forEach((d, i) => (next[i] = d));
      setOtp(next);
      if (digits.length === OTP_LENGTH) {
        setTimeout(() => verifyOtp(next.join("")), 100);
      } else {
        inputRefs.current[digits.length]?.focus();
      }
    },
    [verifyOtp],
  );

  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
      >
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-xs font-medium text-green-600 dark:text-green-400">Phone verified ✓</span>
      </motion.div>
    );
  }

  if (!phone || phone.length < 8) return null;

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Verify your phone number to proceed
      </p>

      {!sent ? (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSendOtp}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:brightness-105 transition-all touch-manipulation"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Send Verification Code
        </motion.button>
      ) : (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code sent to your phone:
          </p>
          <div className="flex gap-2 justify-start" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-11 rounded-lg border border-border bg-background text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                autoFocus={i === 0}
              />
            ))}
          </div>
          {error && (
            <p className="text-[11px] text-destructive font-medium">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSendOtp}
            className="text-[11px] text-primary hover:underline"
          >
            Resend code
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default PhoneVerification;
