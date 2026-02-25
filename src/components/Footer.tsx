import { Link } from "react-router-dom";
import { Github, Twitter, Instagram, Facebook, Mail, MapPin, Phone, CreditCard, Smartphone, Banknote, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const footerSections = {
  "About": [
    { label: "Our Story", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
  ],
  "Support": [
    { label: "Help Center", href: "#" },
    { label: "Returns & Refunds", href: "#" },
    { label: "Shipping Info", href: "#" },
    { label: "Track Order", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
  "Policies": [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Disclaimer", href: "#" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "Github" },
];

const paymentMethods = [
  { icon: CreditCard, label: "Visa/Mastercard" },
  { icon: Smartphone, label: "bKash" },
  { icon: Banknote, label: "Cash on Delivery" },
  { icon: ShieldCheck, label: "Secure" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
      {/* Newsletter bar */}
      <div className="bg-primary/5 dark:bg-primary/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-foreground">Get Exclusive Deals</h4>
              <p className="text-[11px] text-muted-foreground">Subscribe for early access & special offers.</p>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 sm:w-56 px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-all hover:brightness-110 active:scale-[0.97] touch-manipulation whitespace-nowrap"
            >
              {subscribed ? "Subscribed ✓" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xs">AR</span>
              </div>
              <span className="font-display font-bold text-base text-foreground">Prime Market</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Premium products curated for the modern lifestyle. Quality, style, and value — delivered to your doorstep.
            </p>
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
            <div className="flex gap-2 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all duration-200 touch-manipulation"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-xs text-foreground uppercase tracking-wider mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Trust */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground mr-2">We accept:</span>
              {paymentMethods.map((pm) => (
                <div key={pm.label} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-secondary text-muted-foreground" title={pm.label}>
                  <pm.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium hidden sm:inline">{pm.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">© 2026 AR Prime Market. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
