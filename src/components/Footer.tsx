import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Heart } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SocialLinksRow } from "./SocialLinks";
import { VisaIcon, MastercardIcon, BinancePayIcon, BkashIcon, NagadIcon, CodIcon } from "./PaymentIcons";

const paymentMethods = [
  { icon: VisaIcon, label: "Visa" },
  { icon: MastercardIcon, label: "Mastercard" },
  { icon: BkashIcon, label: "bKash" },
  { icon: NagadIcon, label: "Nagad" },
  { icon: BinancePayIcon, label: "Binance Pay" },
  { icon: CodIcon, label: "Cash on Delivery" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { t } = useLanguage();

  const footerSections = {
    [t("about")]: [
      { label: t("ourStory"), href: "/about" },
      { label: t("careers"), href: "/careers" },
      { label: t("press"), href: "/press" },
      { label: t("blog"), href: "/blog" },
    ],
    [t("supportNav")]: [
      { label: t("returnsRefunds"), href: "/refund-policy" },
      { label: t("trackOrder"), href: "/track-order" },
      { label: t("contactUs"), href: "/contact" },
    ],
    [t("policies")]: [
      { label: t("privacyPolicy"), href: "/privacy-policy" },
      { label: t("termsOfService"), href: "/terms" },
      { label: t("returnsRefunds"), href: "/refund-policy" },
      { label: t("cookiePolicy"), href: "/cookie-policy" },
    ],
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="border-t border-border bg-gradient-to-b from-card to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Newsletter Section */}
      <div className="relative bg-gradient-to-r from-primary/8 via-primary/5 to-primary/8 dark:from-primary/15 dark:via-primary/8 dark:to-primary/15 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center shrink-0 shadow-sm">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm sm:text-base text-foreground">{t("getExclusiveDeals")}</h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{t("subscribeDesc")}</p>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("enterEmail")}
              className="flex-1 sm:w-60 px-4 py-2.5 rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-sm"
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm transition-all hover:brightness-110 hover:shadow-md hover:shadow-primary/20 active:scale-[0.97] touch-manipulation whitespace-nowrap"
            >
              {subscribed ? "✓ " + t("subscribed") : t("subscribe")}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src="/images/logo.png" alt="AR Prime Market" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-display font-bold text-lg text-foreground block leading-tight">Prime Market</span>
                <span className="text-[10px] text-muted-foreground tracking-wide">Premium Shopping</span>
              </div>
            </Link>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{t("brandDesc")}</p>

            <div className="space-y-2.5">
              <a href="mailto:support@arprimemarket.com" className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                support@arprimemarket.com
              </a>
              <a href="tel:+8801910521565" className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-primary transition-colors group">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                +880 1910-521565
              </a>
              <span className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                Dhaka, Bangladesh
              </span>
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2.5">Follow Us</p>
              <SocialLinksRow size="md" variant="branded" />
            </div>
          </div>

          {/* Navigation Columns */}
          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-widest mb-4 relative">
                {title}
                <span className="absolute -bottom-1.5 left-0 w-6 h-0.5 bg-primary/40 rounded-full" />
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        to={link.href}
                        className="text-xs text-muted-foreground hover:text-primary hover:translate-x-0.5 transition-all duration-200 inline-block touch-manipulation"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-primary hover:translate-x-0.5 transition-all duration-200 inline-block touch-manipulation"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground mr-1 font-medium">{t("weAccept")}</span>
              {paymentMethods.map((pm) => (
                <div
                  key={pm.label}
                  className="rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border/20"
                  title={pm.label}
                >
                  <pm.icon className="w-10 h-7 sm:w-12 sm:h-8" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-primary fill-primary" /> {t("allRightsReserved")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Design & Development by{" "}
              <a href="https://abdullahraiyan.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Abdullah Raiyan
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
