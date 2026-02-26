import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Newspaper, Download, Mail } from "lucide-react";
import { motion } from "framer-motion";

const pressItems = [
  { date: "Feb 2026", title: "AR Prime Market Launches Premium Ecommerce Platform in Bangladesh", excerpt: "A new player enters the BD ecommerce market with curated premium products and crypto payment options." },
  { date: "Jan 2026", title: "How AR Prime Market is Redefining Online Shopping", excerpt: "With a focus on quality over quantity, AR Prime Market offers a hand-picked selection of products." },
  { date: "Dec 2025", title: "AR Prime Market Partners with Global Suppliers", excerpt: "Expanding product offerings through strategic partnerships with international suppliers." },
];

const Press = () => (
  <>
    <SEOHead title="Press & Media" description="AR Prime Market press releases, media coverage, and brand assets." url="/press" />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Press</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Press & Media</h1>
        <p className="text-muted-foreground max-w-2xl mb-10">Latest news, press releases, and media resources from AR Prime Market.</p>
      </motion.div>

      <div className="grid gap-5 mb-12">
        {pressItems.map((item) => (
          <motion.article key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
            <span className="text-xs text-primary font-semibold">{item.date}</span>
            <h3 className="font-semibold text-foreground mt-1.5 flex items-center gap-2"><Newspaper className="w-4 h-4 text-muted-foreground shrink-0" />{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.excerpt}</p>
          </motion.article>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card">
          <Download className="w-5 h-5 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Brand Assets</h3>
          <p className="text-sm text-muted-foreground mb-3">Download our logo, brand guidelines, and media kit.</p>
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">Download Media Kit</button>
        </div>
        <div className="p-6 rounded-xl border border-border bg-card">
          <Mail className="w-5 h-5 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Media Inquiries</h3>
          <p className="text-sm text-muted-foreground mb-3">For press inquiries, interviews, or partnerships.</p>
          <a href="mailto:press@arprimemarket.com" className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-all inline-block">Contact Press Team</a>
        </div>
      </div>
    </div>
  </>
);

export default Press;
