import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Search, ShoppingBag, CreditCard, Truck, RotateCcw, UserCircle, HelpCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const iconMap: Record<string, any> = { ShoppingBag, CreditCard, Truck, RotateCcw, UserCircle, HelpCircle, BookOpen };

const HelpCenter = () => {
  const [search, setSearch] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["help-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("help_categories").select("*, help_articles(id, title, slug)").order("sort_order");
      return data ?? [];
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ["help-search", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const { data } = await supabase.from("help_articles").select("id, title, slug, help_categories(name, slug)").ilike("title", `%${search}%`).limit(10);
      return data ?? [];
    },
    enabled: search.trim().length > 1,
  });

  return (
    <>
      <SEOHead title="Help Center" description="Find answers to your questions about orders, payments, shipping, returns and more." url="/help" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Help Center</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">How can we help?</h1>
          <p className="text-muted-foreground mb-6">Search our knowledge base or browse by category</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search for answers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
          </div>
          {search && searchResults && searchResults.length > 0 && (
            <div className="max-w-lg mx-auto mt-2 bg-card border border-border rounded-xl shadow-lg text-left overflow-hidden">
              {searchResults.map((r: any) => (
                <Link key={r.id} to={`/help/${r.slug}`} className="block px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  {r.help_categories && <p className="text-xs text-muted-foreground">{r.help_categories.name}</p>}
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((cat: any) => {
            const Icon = iconMap[cat.icon] || HelpCircle;
            return (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{cat.name}</h3>
                {cat.description && <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>}
                <div className="space-y-1">
                  {cat.help_articles?.slice(0, 4).map((a: any) => (
                    <Link key={a.id} to={`/help/${a.slug}`} className="block text-sm text-muted-foreground hover:text-primary transition-colors py-0.5">→ {a.title}</Link>
                  ))}
                  {cat.help_articles?.length > 4 && (
                    <p className="text-xs text-primary font-medium mt-1">+{cat.help_articles.length - 4} more articles</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12 p-6 rounded-xl bg-secondary/50 border border-border">
          <p className="text-sm text-muted-foreground mb-3">Still need help?</p>
          <div className="flex justify-center gap-3">
            <Link to="/contact" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Contact Support</Link>
            <Link to="/tickets" className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Submit Ticket</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpCenter;
