import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, HelpCircle, MessageCircle, Mail, Phone, Package, RotateCcw, CreditCard, Truck } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  { q: "How do I track my order?", a: "Visit our Track Order page and enter your order number and email to get real-time updates." },
  { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, bKash, Nagad, Binance Pay, and Cash on Delivery." },
  { q: "How long does delivery take?", a: "Standard delivery within Bangladesh takes 3-5 business days. Express shipping is 1-2 days." },
  { q: "Can I return a product?", a: "Yes! We offer a 30-day return policy. Visit our Returns & Refunds page for details." },
];

const quickLinks = [
  { icon: Package, label: "Track Order", href: "/track-order" },
  { icon: RotateCcw, label: "Returns & Refunds", href: "/refund-policy" },
  { icon: CreditCard, label: "Payment Help", href: "/contact" },
  { icon: Truck, label: "Shipping Info", href: "/contact" },
];

const Support = () => (
  <>
    <SEOHead title="Support Center" description="Get help with your orders, payments, shipping, and more at AR Prime Market." url="/support" />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Support</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Support Center</h1>
        <p className="text-muted-foreground max-w-2xl mb-10">How can we help you today?</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        {quickLinks.map((link) => (
          <Link key={link.label} to={link.href} className="p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all text-center group">
            <link.icon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-foreground">{link.label}</span>
          </Link>
        ))}
      </div>

      <h2 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" />Frequently Asked Questions</h2>
      <div className="space-y-3 mb-12">
        {faqs.map((faq) => (
          <details key={faq.q} className="p-4 rounded-xl border border-border bg-card group">
            <summary className="font-medium text-foreground cursor-pointer list-none flex items-center justify-between text-sm">
              {faq.q}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: MessageCircle, title: "WhatsApp", desc: "Chat with us instantly", href: "https://wa.me/8801910521565" },
          { icon: Mail, title: "Email", desc: "support@arprimemarket.com", href: "mailto:support@arprimemarket.com" },
          { icon: Phone, title: "Phone", desc: "+880 1910-521565", href: "tel:+8801910521565" },
        ].map((c) => (
          <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="p-5 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all text-center">
            <c.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground text-sm">{c.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
          </a>
        ))}
      </div>
    </div>
  </>
);

export default Support;
