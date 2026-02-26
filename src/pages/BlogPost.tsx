import { SEOHead } from "@/components/SEOHead";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Calendar, Clock, User, ArrowLeft, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  const { data: comments } = useQuery({
    queryKey: ["blog-comments", post?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_comments")
        .select("*, profiles(full_name)")
        .eq("post_id", post!.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!post?.id,
  });

  const { data: related } = useQuery({
    queryKey: ["blog-related", post?.category_id, post?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, image_url, published_at, read_time")
        .eq("is_published", true)
        .eq("category_id", post!.category_id!)
        .neq("id", post!.id)
        .limit(3);
      return data ?? [];
    },
    enabled: !!post?.category_id,
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("blog_comments").insert({ post_id: post!.id, user_id: user!.id, content: comment });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Comment submitted for review!");
      queryClient.invalidateQueries({ queryKey: ["blog-comments", post?.id] });
    },
    onError: () => toast.error("Failed to submit comment"),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12"><Skeleton className="h-8 w-3/4 mb-4" /><Skeleton className="h-64 w-full mb-4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></div>;
  if (!post) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1><Link to="/blog" className="text-primary">← Back to Blog</Link></div>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.image_url,
    author: { "@type": "Person", name: post.author_name },
    datePublished: post.published_at,
    description: post.meta_description || post.excerpt,
  };

  return (
    <>
      <SEOHead title={post.meta_title || post.title} description={post.meta_description || post.excerpt || ""} image={post.image_url || undefined} url={`/blog/${post.slug}`} type="article" jsonLd={jsonLd} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium line-clamp-1">{post.title}</span>
        </nav>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
            {post.blog_categories && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{post.blog_categories.name}</span>}
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author_name}</span>
            {post.published_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published_at).toLocaleDateString()}</span>}
            {post.read_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time}</span>}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">{post.title}</h1>

          {post.image_url && <img src={post.image_url} alt={post.title} className="w-full rounded-xl mb-8 aspect-[16/9] object-cover" />}

          <div className="prose prose-sm sm:prose max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: post.content }} />
        </motion.article>

        {/* Comments */}
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="font-display text-lg font-bold text-foreground mb-6">Comments ({comments?.length ?? 0})</h2>
          {comments && comments.length > 0 ? (
            <div className="space-y-4 mb-8">
              {comments.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">{c.profiles?.full_name || "User"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.content}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground mb-6">No comments yet. Be the first!</p>}

          {user ? (
            <div className="space-y-3">
              <Textarea placeholder="Write a comment..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              <Button size="sm" disabled={!comment.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
                <Send className="w-3.5 h-3.5 mr-1.5" />{commentMutation.isPending ? "Submitting..." : "Post Comment"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary font-medium">Sign in</Link> to leave a comment.</p>
          )}
        </section>

        {/* Related Posts */}
        {related && related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="font-display text-lg font-bold text-foreground mb-6">Related Posts</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r: any) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                  {r.image_url && <img src={r.image_url} alt={r.title} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />}
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{r.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-8 hover:gap-2.5 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
        </Link>
      </div>
    </>
  );
};

export default BlogPost;
