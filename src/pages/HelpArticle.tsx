import { SEOHead } from "@/components/SEOHead";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const HelpArticle = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = useQuery({
    queryKey: ["help-article", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("help_articles")
        .select("*, help_categories(name, slug)")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12"><Skeleton className="h-8 w-3/4 mb-4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></div>;
  if (!article) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-foreground mb-2">Article not found</h1><Link to="/help" className="text-primary">← Back to Help Center</Link></div>;

  return (
    <>
      <SEOHead title={article.title} description={`Help article: ${article.title}`} url={`/help/${article.slug}`} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/help" className="hover:text-primary transition-colors">Help Center</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium line-clamp-1">{article.title}</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {article.help_categories && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">{article.help_categories.name}</span>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">{article.title}</h1>
          <div className="prose prose-sm sm:prose max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content, { ALLOWED_TAGS: ['p','br','strong','em','u','a','ul','ol','li','h1','h2','h3','h4','h5','h6','img','blockquote','pre','code','table','thead','tbody','tr','th','td','hr','span','div'], ALLOWED_ATTR: ['href','target','src','alt','class','style','rel'] }) }} />
        </motion.div>

        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-10 hover:gap-2.5 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Help Center
        </Link>
      </div>
    </>
  );
};

export default HelpArticle;
