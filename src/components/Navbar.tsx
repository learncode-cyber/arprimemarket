import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, User, LogOut, Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CartDrawer } from "./CartDrawer";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export const Navbar = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const diff = latest - lastY.current;
    setScrolled(latest > 20);
    if (diff > 5 && latest > 80) setHidden(true);
    else if (diff < -5) setHidden(false);
    lastY.current = latest;
  });

  const navLinks = [
    { label: t("home"), href: "/" },
    { label: t("products"), href: "/products" },
    { label: t("cart"), href: "/cart" },
    ...(user ? [] : [{ label: t("login"), href: "/login" }]),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-1.5 overflow-hidden">
            <img src="/images/logo.png" alt="AR Prime Market" className="w-9 h-9 shrink-0 object-contain" />
            <motion.span
              animate={{ width: hidden ? 0 : "auto", opacity: hidden ? 0 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="font-display font-bold text-base sm:text-lg tracking-tight text-foreground whitespace-nowrap overflow-hidden"
            >
              Prime Market
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <CurrencySelector />
            <LanguageSelector />
            <ThemeToggle />

            <button className="hidden md:flex p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
              <Search className="w-[18px] h-[18px]" />
            </button>

            {user && isAdmin && (
              <Link to="/admin" className="hidden md:flex p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <Shield className="w-[18px] h-[18px]" />
              </Link>
            )}

            {user && (
              <>
                <Link to="/dashboard" className="hidden md:flex p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                  <User className="w-[18px] h-[18px]" />
                </Link>
                <button onClick={handleSignOut} className="hidden md:flex p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors touch-manipulation"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors touch-manipulation"
            >
              {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl"
            >
              <div className="flex flex-col p-3 gap-0.5">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all touch-manipulation">
                    {link.label}
                  </Link>
                ))}
                {user && isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all touch-manipulation">
                    {t("adminPanel")}
                  </Link>
                )}
                {user && (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all touch-manipulation">
                      {t("dashboard")}
                    </Link>
                    <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-left touch-manipulation">
                      {t("signOut")}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};
