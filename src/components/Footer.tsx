import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
      <div className="container max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">AR</span>
              </div>
              <span className="font-display font-semibold text-lg text-foreground">Prime Market</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Premium products, curated for the modern lifestyle. Experience shopping redefined.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  whileHover={{ scale: 1.1, y: -2 }}
                  href={social.href}
                  className="p-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <motion.a whileHover={{ x: 4 }} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 AR Prime Market. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a key={item} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
