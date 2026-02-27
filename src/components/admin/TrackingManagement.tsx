import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Save, Loader2, Settings, BarChart3, Target, Megaphone, Music2, Camera, Pin, Wand2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TrackingPixel {
  id: string;
  platform: string;
  pixel_id: string;
  is_active: boolean;
  config: Record<string, any>;
}

const platformConfig: Record<string, {
  label: string;
  icon: any;
  description: string;
  placeholder: string;
  color: string;
  fields: { key: string; label: string; placeholder: string }[];
  events: string[];
  setupGuide: string;
}> = {
  meta_pixel: {
    label: "Meta Pixel (Facebook/Instagram)",
    icon: Megaphone,
    description: "Track conversions, build custom & lookalike audiences, and optimize ads on Facebook & Instagram. Essential for retargeting.",
    placeholder: "Enter your Meta Pixel ID (e.g. 1234567890)",
    color: "from-blue-600/20 to-blue-400/5",
    fields: [
      { key: "access_token", label: "Conversions API Access Token (Optional)", placeholder: "For server-side tracking" },
    ],
    events: ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Search", "CompleteRegistration"],
    setupGuide: "Go to Meta Events Manager → Data Sources → Create Pixel → Copy Pixel ID",
  },
  google_analytics: {
    label: "Google Analytics 4 (GA4)",
    icon: BarChart3,
    description: "Track user behavior, sessions, ecommerce events, and traffic sources. Required for Google Ads optimization.",
    placeholder: "Enter your GA4 Measurement ID (e.g. G-XXXXXXXXXX)",
    color: "from-amber-500/20 to-amber-400/5",
    fields: [],
    events: ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase", "search"],
    setupGuide: "Go to Google Analytics → Admin → Data Streams → Web → Copy Measurement ID",
  },
  google_ads: {
    label: "Google Ads Conversion",
    icon: Target,
    description: "Track purchase conversions for Google Ads Smart Bidding, ROAS optimization, and conversion campaigns.",
    placeholder: "Enter your Google Ads ID (e.g. AW-XXXXXXXXXX)",
    color: "from-green-500/20 to-green-400/5",
    fields: [
      { key: "conversion_label", label: "Purchase Conversion Label", placeholder: "e.g. xYzAbC123" },
      { key: "add_to_cart_label", label: "Add to Cart Conversion Label (Optional)", placeholder: "e.g. aBcDeF456" },
      { key: "checkout_label", label: "Checkout Conversion Label (Optional)", placeholder: "e.g. gHiJkL789" },
    ],
    events: ["conversion (Purchase)", "conversion (Add to Cart)", "conversion (Checkout)"],
    setupGuide: "Go to Google Ads → Tools → Conversions → New Action → Copy Conversion ID & Label",
  },
  tiktok_pixel: {
    label: "TikTok Pixel",
    icon: Music2,
    description: "Track events for TikTok Ads optimization. Build audiences and track ROAS for TikTok campaigns.",
    placeholder: "Enter your TikTok Pixel ID (e.g. CXXXXXXXXXXXXXXX)",
    color: "from-pink-500/20 to-pink-400/5",
    fields: [
      { key: "access_token", label: "Events API Access Token (Optional)", placeholder: "For server-side tracking" },
    ],
    events: ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "CompletePayment", "Search"],
    setupGuide: "Go to TikTok Ads Manager → Assets → Events → Web Events → Create Pixel → Copy Pixel ID",
  },
  snapchat_pixel: {
    label: "Snapchat Pixel",
    icon: Camera,
    description: "Track conversions and build audiences for Snapchat Ads campaigns.",
    placeholder: "Enter your Snap Pixel ID (e.g. xxxxxxxx-xxxx-xxxx-xxxx)",
    color: "from-yellow-500/20 to-yellow-400/5",
    fields: [],
    events: ["PAGE_VIEW", "VIEW_CONTENT", "ADD_CART", "START_CHECKOUT", "PURCHASE", "SEARCH"],
    setupGuide: "Go to Snapchat Ads Manager → Events Manager → New Pixel → Copy Pixel ID",
  },
  pinterest_tag: {
    label: "Pinterest Tag",
    icon: Pin,
    description: "Track conversions and build audiences for Pinterest Ads shopping campaigns.",
    placeholder: "Enter your Pinterest Tag ID (e.g. 1234567890)",
    color: "from-red-500/20 to-red-400/5",
    fields: [],
    events: ["pagevisit", "viewcategory", "addtocart", "checkout", "purchase", "search"],
    setupGuide: "Go to Pinterest Ads → Conversions → Create Tag → Copy Tag ID",
  },
};

const TrackingManagement = () => {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, { pixel_id: string; config: Record<string, any> }>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiSetup, setAiSetup] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ platform: string; pixelId: string; config: Record<string, any> }[] | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tracking_pixels").select("*").order("platform");
    setPixels((data as TrackingPixel[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getEdit = (pixel: TrackingPixel) => {
    return editData[pixel.id] || { pixel_id: pixel.pixel_id === "placeholder" ? "" : pixel.pixel_id, config: pixel.config || {} };
  };

  const setEdit = (id: string, updates: Partial<{ pixel_id: string; config: Record<string, any> }>) => {
    setEditData(prev => ({
      ...prev,
      [id]: { ...getEditById(id), ...updates },
    }));
  };

  const getEditById = (id: string) => {
    const pixel = pixels.find(p => p.id === id);
    const pid = pixel?.pixel_id === "placeholder" ? "" : (pixel?.pixel_id || "");
    return editData[id] || { pixel_id: pid, config: pixel?.config || {} };
  };

  const handleToggle = async (pixel: TrackingPixel) => {
    if (!pixel.pixel_id || pixel.pixel_id === "placeholder") {
      toast.error("Please configure the tracking ID first");
      setExpandedId(pixel.id);
      return;
    }
    const { error } = await supabase
      .from("tracking_pixels")
      .update({ is_active: !pixel.is_active, updated_at: new Date().toISOString() })
      .eq("id", pixel.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${platformConfig[pixel.platform]?.label || pixel.platform} ${!pixel.is_active ? "enabled" : "disabled"}`);
      load();
    }
  };

  const handleSave = async (pixel: TrackingPixel) => {
    const edit = getEdit(pixel);
    if (!edit.pixel_id.trim()) {
      toast.error("Tracking ID is required");
      return;
    }
    setSaving(pixel.id);
    const { error } = await supabase
      .from("tracking_pixels")
      .update({
        pixel_id: edit.pixel_id.trim(),
        config: edit.config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pixel.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved! Refresh the site to activate.");
      setEditData(prev => { const n = { ...prev }; delete n[pixel.id]; return n; });
      load();
    }
    setSaving(null);
  };

  const hasChanges = (pixel: TrackingPixel) => {
    const edit = editData[pixel.id];
    if (!edit) return false;
    const origPid = pixel.pixel_id === "placeholder" ? "" : pixel.pixel_id;
    return edit.pixel_id !== origPid || JSON.stringify(edit.config) !== JSON.stringify(pixel.config || {});
  };

  // AI-powered setup
  const handleAISetup = async () => {
    if (!aiInput.trim()) return;
    setAiProcessing(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action: "configure_tracking", message: aiInput },
      });
      if (error) throw error;
      if (data?.pixels) {
        setAiResult(data.pixels);
        toast.success(`AI detected ${data.pixels.length} tracking pixel(s)!`);
      } else {
        toast.info(data?.reply || "Could not parse pixel info. Please enter IDs manually.");
      }
    } catch (e: any) {
      toast.error(e.message || "AI setup failed");
    }
    setAiProcessing(false);
  };

  const applyAIResult = async () => {
    if (!aiResult) return;
    setAiProcessing(true);
    let applied = 0;
    for (const item of aiResult) {
      const pixel = pixels.find(p => p.platform === item.platform);
      if (pixel) {
        const { error } = await supabase
          .from("tracking_pixels")
          .update({
            pixel_id: item.pixelId,
            config: { ...(pixel.config || {}), ...item.config },
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pixel.id);
        if (!error) applied++;
      }
    }
    toast.success(`${applied} pixel(s) configured and activated!`);
    setAiResult(null);
    setAiInput("");
    setAiSetup(false);
    load();
    setAiProcessing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const activeCount = pixels.filter(p => p.is_active && p.pixel_id && p.pixel_id !== "placeholder").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Ad Tracking & Pixels
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{activeCount} active</span>
          <Button
            size="sm"
            variant={aiSetup ? "secondary" : "default"}
            onClick={() => setAiSetup(!aiSetup)}
            className="text-xs h-7 gap-1"
          >
            <Wand2 className="w-3 h-3" />
            {aiSetup ? "Close" : "AI Setup"}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Configure ad pixels for Meta, Google, TikTok, Snapchat & Pinterest. All ecommerce events (PageView, AddToCart, Checkout, Purchase) fire automatically.
      </p>

      {/* AI Setup Panel */}
      <AnimatePresence>
        {aiSetup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI-Powered Pixel Setup</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste your pixel IDs or codes here. AI will auto-detect the platform and configure everything. Example: "Meta Pixel: 123456789, Google Ads: AW-123456789/abcdef, TikTok: C12345678"
              </p>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Paste your pixel IDs, tracking codes, or describe what you want to set up..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAISetup} disabled={aiProcessing || !aiInput.trim()} className="text-xs h-8 gap-1">
                  {aiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Detect & Configure
                </Button>
              </div>

              {/* AI Result */}
              {aiResult && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Detected Pixels:
                  </p>
                  {aiResult.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-xl p-2.5">
                      <span className="text-xs font-medium text-foreground">{platformConfig[item.platform]?.label || item.platform}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{item.pixelId}</span>
                    </div>
                  ))}
                  <Button size="sm" onClick={applyAIResult} disabled={aiProcessing} className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700">
                    {aiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Confirm & Activate All
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {pixels.map(pixel => {
          const config = platformConfig[pixel.platform];
          if (!config) return null;
          const Icon = config.icon;
          const edit = getEdit(pixel);
          const isExpanded = expandedId === pixel.id;
          const isConfigured = pixel.pixel_id && pixel.pixel_id !== "placeholder";

          return (
            <motion.div key={pixel.id} layout className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.color} shrink-0`}>
                  <Icon className={`w-5 h-5 ${pixel.is_active && isConfigured ? "text-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                    {isConfigured && pixel.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-500">Live</span>
                    )}
                    {!isConfigured && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-500">Not Set</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {isConfigured ? pixel.pixel_id : "Click settings to configure"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(pixel)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${pixel.is_active && isConfigured ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${pixel.is_active && isConfigured ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : pixel.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Settings className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Settings */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">{config.description}</p>

                      {/* Setup guide */}
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-blue-500 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Setup Guide
                        </p>
                        <p className="text-[10px] text-muted-foreground">{config.setupGuide}</p>
                      </div>

                      {/* Pixel ID */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tracking ID</label>
                        <input
                          value={edit.pixel_id}
                          onChange={e => setEdit(pixel.id, { pixel_id: e.target.value })}
                          placeholder={config.placeholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                        />
                      </div>

                      {/* Extra config fields */}
                      {config.fields.map(field => (
                        <div key={field.key}>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
                          <input
                            value={edit.config?.[field.key] || ""}
                            onChange={e => setEdit(pixel.id, {
                              config: { ...edit.config, [field.key]: e.target.value },
                            })}
                            placeholder={field.placeholder}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                          />
                        </div>
                      ))}

                      {/* Events info */}
                      <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Auto-tracked Events</p>
                        <div className="flex flex-wrap gap-1.5">
                          {config.events.map(evt => (
                            <span key={evt} className="px-2 py-0.5 rounded-lg bg-card border border-border text-[10px] font-medium text-foreground">
                              {evt}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Save */}
                      {hasChanges(pixel) && (
                        <button
                          onClick={() => handleSave(pixel)}
                          disabled={saving === pixel.id}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-105 transition-all disabled:opacity-60"
                        >
                          {saving === pixel.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Changes
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Server-side tracking info */}
      <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">🔒 Server-Side Tracking</h3>
        <p className="text-xs text-muted-foreground">
          All ecommerce events are tracked both client-side (browser pixel) and prepared for server-side (Conversions API). 
          For Meta CAPI and TikTok Events API, add your access tokens in the platform settings above for enhanced tracking that bypasses ad blockers.
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {["iOS 14+ Compatible", "Ad Blocker Resistant", "Enhanced Match", "Deduplication Ready"].map(badge => (
            <span key={badge} className="px-2 py-0.5 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-medium">
              ✓ {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingManagement;
