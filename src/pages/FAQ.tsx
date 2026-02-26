import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["faq-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("faq_categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["faq-items", activeCategory, search],
    queryFn: async () => {
      let q = supabase.from("faq_items").select("*, faq_categories(name)").eq("is_active", true).order("sort_order");
      if (activeCategory) q = q.eq("category_id", activeCategory);
      if (search) q = q.ilike("question", `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items?.map((i: any) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })) ?? [],
  };

  return (
    <>
      <SEOHead title="Frequently Asked Questions" description="Find answers to common questions about AR Prime Market." url="/faq" jsonLd={jsonLd} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">FAQ</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mb-6">Quick answers to common questions</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>All</button>
            {categories?.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c.name}</button>
            ))}
          </div>
        </div>

        {items && items.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-2">
            {items.map((item: any) => (
              <AccordionItem key={item.id} value={item.id} className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No questions found. Try a different search.</p>
          </div>
        )}

        <div className="text-center mt-12 p-6 rounded-xl bg-secondary/50 border border-border">
          <p className="text-sm text-muted-foreground mb-3">Didn't find your answer?</p>
          <Link to="/contact" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Contact Support</Link>
        </div>
      </div>
    </>
  );
};

export default FAQ;
