import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null } | null;
}

export const ProductReviews = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product_reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews" as any)
        .select("id, rating, review_text, created_at, user_id")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as Review[]) || [];
    },
  });

  const { data: userReview } = useQuery({
    queryKey: ["user_review", productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("product_reviews" as any)
        .select("id, rating, review_text")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();
      return data as Review | null;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login to leave a review"); return; }
    if (rating === 0) { toast.error("Please select a rating"); return; }

    setSubmitting(true);
    const payload = { product_id: productId, user_id: user.id, rating, review_text: text.trim() || null };
    
    if (userReview) {
      await supabase.from("product_reviews" as any).update(payload as any).eq("id", userReview.id);
    } else {
      await supabase.from("product_reviews" as any).insert(payload as any);
    }
    
    setSubmitting(false);
    toast.success(userReview ? "Review updated! Awaiting approval." : "Review submitted! Awaiting approval.");
    setRating(0);
    setText("");
    qc.invalidateQueries({ queryKey: ["product_reviews", productId] });
    qc.invalidateQueries({ queryKey: ["user_review", productId] });
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <section className="mt-10 sm:mt-14">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-6">Customer Reviews</h2>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-center">
          <p className="font-display text-4xl font-bold text-foreground">{avgRating}</p>
          <div className="flex mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Submit Form */}
      {user && !userReview && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 mb-8">
          <p className="font-medium text-sm text-foreground mb-3">Write a Review</p>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i + 1)}
                className="touch-manipulation">
                <Star className={`w-6 h-6 transition-colors ${i < (hoverRating || rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your experience..." maxLength={1000} rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3" />
          <button type="submit" disabled={submitting || rating === 0}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-all hover:brightness-105 active:scale-[0.98]">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
          </button>
        </form>
      )}

      {userReview && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">You've already reviewed this product (Rating: {userReview.rating}/5)</p>
        </div>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground mb-8">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to leave a review.
        </p>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.review_text && <p className="text-sm text-foreground leading-relaxed">{r.review_text}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};
