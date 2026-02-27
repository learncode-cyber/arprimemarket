import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import { calculateTitleSEO, calculateDescriptionSEO, calculateOverallSEO } from "@/lib/seoScoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SEOScoreWidgetProps {
  title: string;
  description: string;
  category?: string;
  price?: number;
  onTitleGenerated?: (title: string) => void;
  onDescriptionGenerated?: (description: string) => void;
}

const ScoreRing = ({ score, size = 56 }: { score: number; size?: number }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/30" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
        {score}%
      </span>
    </div>
  );
};

export const SEOScoreWidget = ({ title, description, category, price, onTitleGenerated, onDescriptionGenerated }: SEOScoreWidgetProps) => {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState<"title" | "description" | "both" | null>(null);

  const titleSEO = useMemo(() => calculateTitleSEO(title), [title]);
  const descSEO = useMemo(() => calculateDescriptionSEO(description, title), [description, title]);
  const overall = useMemo(() => calculateOverallSEO(title, description), [title, description]);

  const generateSEOContent = async (type: "title" | "description" | "both") => {
    setGenerating(type);
    try {
      const { data, error } = await supabase.functions.invoke("ai-content", {
        body: {
          action: "seo_generate",
          title: title || "Untitled Product",
          current_description: description,
          category: category || "General",
          price: price || 0,
          generate_type: type,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      if ((type === "title" || type === "both") && data.content?.seo_title && onTitleGenerated) {
        onTitleGenerated(data.content.seo_title);
      }
      if ((type === "description" || type === "both") && data.content?.seo_description && onDescriptionGenerated) {
        onDescriptionGenerated(data.content.seo_description);
      }
      toast.success(`SEO ${type} generated!`);
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const hasContent = title.trim() || description.trim();
  if (!hasContent) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScoreRing score={overall.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">SEO Score</span>
            <span className={`text-xs font-bold ${overall.color}`}>{overall.label}</span>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-muted-foreground">
              Title: <span className={`font-semibold ${titleSEO.color}`}>{titleSEO.score}%</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Desc: <span className={`font-semibold ${descSEO.color}`}>{descSEO.score}%</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {overall.score < 70 && (
            <button
              onClick={() => generateSEOContent("both")}
              disabled={!!generating}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium disabled:opacity-50"
            >
              {generating === "both" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Fix
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3 pt-2 border-t border-border"
          >
            {/* Title Analysis */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Title SEO</span>
                {titleSEO.score < 70 && onTitleGenerated && (
                  <button
                    onClick={() => generateSEOContent("title")}
                    disabled={!!generating}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-[10px] font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50"
                  >
                    {generating === "title" ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                    Generate Title
                  </button>
                )}
              </div>
              {titleSEO.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{issue}</span>
                </div>
              ))}
              {titleSEO.suggestions.map((s, i) => (
                <div key={`s-${i}`} className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{s}</span>
                </div>
              ))}
              {titleSEO.issues.length === 0 && titleSEO.suggestions.length === 0 && (
                <span className="text-[10px] text-green-500">✓ Title looks great!</span>
              )}
            </div>

            {/* Description Analysis */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description SEO</span>
                {descSEO.score < 70 && onDescriptionGenerated && (
                  <button
                    onClick={() => generateSEOContent("description")}
                    disabled={!!generating}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-[10px] font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50"
                  >
                    {generating === "description" ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                    Generate Description
                  </button>
                )}
              </div>
              {descSEO.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{issue}</span>
                </div>
              ))}
              {descSEO.suggestions.map((s, i) => (
                <div key={`s-${i}`} className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{s}</span>
                </div>
              ))}
              {descSEO.issues.length === 0 && descSEO.suggestions.length === 0 && (
                <span className="text-[10px] text-green-500">✓ Description looks great!</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
