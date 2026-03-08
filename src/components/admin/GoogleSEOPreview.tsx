import { Globe } from "lucide-react";

interface GoogleSEOPreviewProps {
  title: string;
  description: string;
  slug: string;
  baseUrl?: string;
}

export const GoogleSEOPreview = ({
  title,
  description,
  slug,
  baseUrl = "arprimemarket.lovable.app",
}: GoogleSEOPreviewProps) => {
  const displayTitle = title || "Page Title";
  const displayDesc = description || "No description provided. Add a meta description to improve click-through rates from search results.";
  const displayUrl = `${baseUrl} › ${slug || "page-slug"}`;

  const titleColor = title.length > 0 && title.length <= 60 ? "text-[#1a0dab]" : "text-destructive";
  const descColor = description.length > 0 && description.length <= 160 ? "text-[#4d5156]" : "text-destructive";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Google Search Preview</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl p-4 space-y-1 font-sans">
        {/* URL breadcrumb */}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs text-[#202124] dark:text-zinc-300 truncate">{displayUrl}</span>
        </div>
        {/* Title */}
        <h3 className={`text-lg font-medium leading-snug cursor-pointer hover:underline truncate ${titleColor} dark:text-blue-400`}>
          {displayTitle.length > 60 ? displayTitle.slice(0, 57) + "..." : displayTitle}
        </h3>
        {/* Description */}
        <p className={`text-sm leading-relaxed line-clamp-2 ${descColor} dark:text-zinc-400`}>
          {displayDesc.length > 160 ? displayDesc.slice(0, 157) + "..." : displayDesc}
        </p>
      </div>
      {/* Char count indicators */}
      <div className="flex gap-4 text-[10px]">
        <span className={title.length > 60 ? "text-destructive" : title.length > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          Title: {title.length}/60 {title.length > 60 ? "⚠️ Too long" : title.length > 0 ? "✓" : ""}
        </span>
        <span className={description.length > 160 ? "text-destructive" : description.length > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
          Desc: {description.length}/160 {description.length > 160 ? "⚠️ Too long" : description.length > 0 ? "✓" : ""}
        </span>
      </div>
    </div>
  );
};
