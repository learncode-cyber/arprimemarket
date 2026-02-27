import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowUp, X, Mail } from "lucide-react";
import { ChatWidget } from "./ChatWidget";

const menuItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.92 },
};

const smoothTransition = (delay = 0) => ({
  type: "tween" as const,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  duration: 0.22,
  delay,
});

export const FloatingActionMenu = () => {
  const [open, setOpen] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleWhatsApp = () => {
    window.open("https://wa.me/8801910521565", "_blank");
    setOpen(false);
  };

  const handleChat = () => {
    setShowChat(true);
    setOpen(false);
  };

  const handleEmail = () => {
    window.location.href = "mailto:biz.arprimemarket@gmail.com?subject=Support Request";
    setOpen(false);
  };

  return (
    <>
      {/* Expanded options */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Email Support */}
            <motion.button
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={smoothTransition(0.06)}
              onClick={handleEmail}
              className="fixed bottom-[11.5rem] right-4 z-50 flex w-40 h-10 items-center justify-center gap-2 rounded-full bg-accent/80 backdrop-blur-xl border border-border/50 text-foreground shadow-lg hover:bg-accent transition-colors touch-manipulation"
            >
              <Mail className="w-4 h-4" />
              <span className="text-xs font-semibold whitespace-nowrap">Email Support</span>
            </motion.button>

            {/* WhatsApp */}
            <motion.button
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={smoothTransition(0.04)}
              onClick={handleWhatsApp}
              className="fixed bottom-[8.5rem] right-4 z-50 flex w-40 h-10 items-center justify-center gap-2 rounded-full bg-[#25D366]/90 backdrop-blur-xl border border-[#25D366]/30 text-white shadow-lg hover:bg-[#25D366] transition-colors touch-manipulation"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-semibold whitespace-nowrap">WhatsApp</span>
            </motion.button>

            {/* Chat with AI */}
            <motion.button
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={smoothTransition(0.08)}
              onClick={handleChat}
              className="fixed bottom-[5.5rem] right-4 z-50 flex w-40 h-10 items-center justify-center gap-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 text-foreground shadow-lg shadow-primary/10 hover:bg-card transition-colors touch-manipulation"
            >
              <span className="text-sm" aria-hidden="true">👨‍💻</span>
              <span className="text-xs font-semibold whitespace-nowrap">Chat with Raiyan</span>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScroll && !open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-[5.5rem] right-4 z-40 w-14 h-14 rounded-full bg-secondary/80 backdrop-blur-xl border border-border/40 text-foreground shadow-md flex items-center justify-center hover:bg-accent transition-colors touch-manipulation"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "tween", ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], duration: 0.4 }}
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full backdrop-blur-xl border flex items-center justify-center transition-colors touch-manipulation ${open ? "bg-card/90 border-border/50 text-foreground shadow-md hover:bg-card" : "bg-primary/90 border-primary/30 text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary"}`}
        aria-label="Help menu"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <span className="text-xl leading-none" aria-hidden="true">👨‍💻</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChat(false)}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-md max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-border bg-card z-10"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <span className="text-lg">👨‍💻</span>
                <span className="font-display font-bold text-sm">Raiyan</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <button onClick={() => setShowChat(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="h-[60vh] overflow-y-auto">
              <ChatWidget embedded />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
