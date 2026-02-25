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
    <footer className="border-t border-border glass">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-xs sm:text-sm">AR</span>
              </div>
              <span className="font-display font-semibold text-base sm:text-lg text-foreground">Prime Market</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs">
              Premium products, curated for the modern lifestyle.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="p-2 sm:p-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors touch-manipulation"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground mb-3 sm:mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-14 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-[11px] sm:text-xs text-muted-foreground">© 2026 AR Prime Market. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a key={item} href="#" className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
