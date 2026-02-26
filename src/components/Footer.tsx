import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, CreditCard, Smartphone, Banknote, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SocialLinksRow } from "./SocialLinks";

const paymentMethods = [
  { icon: CreditCard, label: "Visa/Mastercard" },
  { icon: Smartphone, label: "bKash" },
  { icon: Banknote, label: "Cash on Delivery" },
  { icon: ShieldCheck, label: "Secure" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { t } = useLanguage();

  const footerSections = {
    [t("about")]: [
      { label: t("ourStory"), href: "#" },
      { label: t("careers"), href: "#" },
      { label: t("press"), href: "#" },
      { label: t("blog"), href: "#" },
    ],
    [t("supportNav")]: [
      { label: t("returnsRefunds"), href: "/refund-policy" },
      { label: t("trackOrder"), href: "/track-order" },
      { label: t("contactUs"), href: "mailto:support@arprimemarket.com" },
    ],
    [t("policies")]: [
      { label: t("privacyPolicy"), href: "/privacy-policy" },
      { label: t("termsOfService"), href: "/terms" },
      { label: t("returnsRefunds"), href: "/refund-policy" },
      { label: t("cookiePolicy"), href: "/privacy-policy#cookies" },
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
    <footer className="border-t border-border bg-card">
      <div className="bg-primary/5 dark:bg-primary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-foreground">{t("getExclusiveDeals")}</h4>
              <p className="text-[11px] text-muted-foreground">{t("subscribeDesc")}</p>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("enterEmail")} className="flex-1 sm:w-56 px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" required />
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-all hover:brightness-110 active:scale-[0.97] touch-manipulation whitespace-nowrap">
              {subscribed ? t("subscribed") : t("subscribe")}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-1.5">
              <img src="/images/logo.png" alt="AR Prime Market" className="w-9 h-9 object-contain" />
              <span className="font-display font-bold text-base text-foreground">Prime Market</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{t("brandDesc")}</p>
            <div className="space-y-2">
              <a href="mailto:support@arprimemarket.com" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" /> support@arprimemarket.com
              </a>
              <a href="tel:+8801700000000" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-3.5 h-3.5" /> +880 1700-000000
              </a>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> Dhaka, Bangladesh
              </span>
            </div>

            {/* Social Links */}
            <div className="pt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Follow Us</p>
              <SocialLinksRow size="md" variant="branded" />
            </div>
          </div>

          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-xs text-foreground uppercase tracking-wider mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground mr-2">{t("weAccept")}</span>
              {paymentMethods.map((pm) => (
                <div key={pm.label} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-secondary text-muted-foreground" title={pm.label}>
                  <pm.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium hidden sm:inline">{pm.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{t("allRightsReserved")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
