import { useState } from "react";
import { Globe, FileText, Code, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SEOManagement = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const sitemapUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;
  const robotsUrl = "https://arprimemarket.lovable.app/robots.txt";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">SEO Management</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Search engine optimization settings</p>
      </div>

      {/* Sitemap */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">XML Sitemap</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Auto-generated sitemap with all active products and categories. Submit this URL to Google Search Console.
        </p>
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <code className="text-xs text-foreground flex-1 truncate">{sitemapUrl}</code>
          <button
            onClick={() => handleCopy(sitemapUrl, "Sitemap URL")}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            {copied === "Sitemap URL" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <a href={sitemapUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Robots.txt */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Robots.txt</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Configured to allow all major search engine crawlers including Google, Bing, Twitter, and Facebook.
        </p>
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <code className="text-xs text-foreground flex-1 truncate">{robotsUrl}</code>
          <button
            onClick={() => handleCopy(robotsUrl, "Robots URL")}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            {copied === "Robots URL" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Structured Data */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Structured Data (JSON-LD)</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Automatically injected on every page for rich search results.
        </p>
        <div className="space-y-2">
          {[
            { name: "Organization Schema", desc: "Company info, logo, contact" },
            { name: "Website Schema", desc: "Site search action for Google" },
            { name: "Product Schema", desc: "Price, availability, ratings per product" },
            { name: "BreadcrumbList", desc: "Navigation path for crawlers" },
            { name: "CollectionPage", desc: "Product listing pages" },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
              <div>
                <span className="text-xs font-medium text-foreground">{s.name}</span>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
              <span className="text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Checklist */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-sm text-foreground mb-3">SEO Checklist</h3>
        <div className="space-y-1.5">
          {[
            { label: "Dynamic meta title & description", done: true },
            { label: "Open Graph tags on all pages", done: true },
            { label: "Twitter Card tags", done: true },
            { label: "Canonical URLs", done: true },
            { label: "XML Sitemap auto-generation", done: true },
            { label: "Robots.txt configured", done: true },
            { label: "Product schema markup", done: true },
            { label: "Lazy loading images", done: true },
            { label: "Semantic HTML (single H1)", done: true },
            { label: "SEO-friendly slug URLs", done: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? "bg-green-500/10" : "bg-muted"}`}>
                {item.done && <Check className="w-2.5 h-2.5 text-green-500" />}
              </div>
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SEOManagement;
