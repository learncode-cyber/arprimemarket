import { Link } from "react-router-dom";
import { Github, Twitter, Instagram } from "lucide-react";

const footerLinks = {
  Shop: ["New Arrivals", "Best Sellers", "Deals", "Gift Cards"],
  Company: ["About Us", "Careers", "Press", "Blog"],
  Support: ["Help Center", "Returns", "Shipping", "Contact"],
};

const socialLinks = [
  { icon: Twitter, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Github, href: "#" },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xs">AR</span>
              </div>
              <span className="font-display font-bold text-base text-foreground">Prime Market</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Premium products, curated for the modern lifestyle.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors touch-manipulation"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-xs text-foreground uppercase tracking-wider mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-muted-foreground">© 2026 AR Prime Market. All rights reserved.</p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a key={item} href="#" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors touch-manipulation">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
