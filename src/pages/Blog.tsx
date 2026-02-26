import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar, ArrowRight, Clock, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", activeCategory, search],
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (activeCategory) q = q.eq("category_id", activeCategory);
      if (search) q = q.ilike("title", `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <>
      <SEOHead title="Blog" description="Tips, guides, and insights from AR Prime Market." url="/blog" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Blog</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Blog</h1>
          <p className="text-muted-foreground max-w-2xl mb-6">Tips, trends, and insights to help you shop smarter.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>All</button>
            {categories?.map((c) => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c.name}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.map((post: any) => (
              <motion.article key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                {post.image_url && (
                  <Link to={`/blog/${post.slug}`}>
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  </Link>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {post.blog_categories && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{post.blog_categories.name}</span>}
                    {post.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString()}</span>}
                    {post.read_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time}</span>}
                  </div>
                  <Link to={`/blog/${post.slug}`}>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">{post.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
                  <Link to={`/blog/${post.slug}`} className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No articles found</p>
            <p className="text-sm mt-1">Check back soon for new content!</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Blog;
