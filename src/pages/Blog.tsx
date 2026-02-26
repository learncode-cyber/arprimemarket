import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";

const posts = [
  { slug: "top-gadgets-2026", title: "Top 10 Must-Have Gadgets in 2026", excerpt: "Discover the hottest tech products that are changing the game this year.", date: "Feb 20, 2026", readTime: "5 min", category: "Tech", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80" },
  { slug: "skincare-essentials", title: "Ultimate Skincare Essentials Guide", excerpt: "Build the perfect skincare routine with our curated product recommendations.", date: "Feb 15, 2026", readTime: "4 min", category: "Beauty", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80" },
  { slug: "home-office-setup", title: "Create the Perfect Home Office Setup", excerpt: "Transform your workspace with ergonomic furniture and smart accessories.", date: "Feb 10, 2026", readTime: "6 min", category: "Lifestyle", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80" },
  { slug: "fashion-trends", title: "2026 Fashion Trends You Need to Know", excerpt: "Stay ahead of the curve with this season's hottest fashion trends.", date: "Feb 5, 2026", readTime: "3 min", category: "Fashion", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80" },
];

const Blog = () => (
  <>
    <SEOHead title="Blog" description="Tips, guides, and insights from AR Prime Market. Stay updated on trends, deals, and product recommendations." url="/blog" />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Blog</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">Blog</h1>
        <p className="text-muted-foreground max-w-2xl mb-10">Tips, trends, and insights to help you shop smarter.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6">
        {posts.map((post) => (
          <motion.article key={post.slug} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[16/9] overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{post.category}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{post.excerpt}</p>
              <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Read More <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  </>
);

export default Blog;
