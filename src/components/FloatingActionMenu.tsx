import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowUp, X, Bot } from "lucide-react";
import { ChatWidget } from "./ChatWidget";

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
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* WhatsApp */}
            <motion.button
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.05 }}
              onClick={handleWhatsApp}
              className="fixed bottom-[8rem] right-4 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-[#25D366]/90 backdrop-blur-xl border border-[#25D366]/30 text-white shadow-lg shadow-[#25D366]/20 hover:bg-[#25D366] active:scale-95 transition-all touch-manipulation"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-semibold whitespace-nowrap">WhatsApp Support</span>
            </motion.button>

            {/* Chat with AI */}
            <motion.button
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.1 }}
              onClick={handleChat}
              className="fixed bottom-[5.5rem] right-4 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 text-foreground shadow-lg shadow-primary/10 hover:bg-card active:scale-95 transition-all touch-manipulation"
            >
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold whitespace-nowrap">Chat with AI</span>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Scroll to top — below the FAB */}
      <AnimatePresence>
        {showScroll && !open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-[5.5rem] right-[1.125rem] z-40 w-9 h-9 rounded-full bg-secondary/80 backdrop-blur-xl border border-border/40 text-foreground shadow-md flex items-center justify-center hover:bg-accent active:scale-90 transition-all touch-manipulation"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-primary/90 backdrop-blur-xl border border-primary/30 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary active:scale-90 transition-all touch-manipulation"
        aria-label="Help menu"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot className="w-6 h-6" />
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
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-display font-bold text-sm">AI Assistant</span>
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
