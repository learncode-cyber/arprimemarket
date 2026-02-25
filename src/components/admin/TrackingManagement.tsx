import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Save, Loader2, Eye, EyeOff, Settings, BarChart3, Target, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrackingPixel {
  id: string;
  platform: string;
  pixel_id: string;
  is_active: boolean;
  config: Record<string, any>;
}

const platformConfig = {
  meta_pixel: {
    label: "Meta Pixel (Facebook)",
    icon: Megaphone,
    description: "Track conversions, build audiences, and optimize ads on Facebook & Instagram.",
    placeholder: "Enter your Meta Pixel ID (e.g. 1234567890)",
    color: "from-blue-600/20 to-blue-400/5",
    fields: [] as { key: string; label: string; placeholder: string }[],
  },
  google_analytics: {
    label: "Google Analytics 4",
    icon: BarChart3,
    description: "Track user behavior, sessions, ecommerce events, and traffic sources.",
    placeholder: "Enter your GA4 Measurement ID (e.g. G-XXXXXXXXXX)",
    color: "from-amber-500/20 to-amber-400/5",
    fields: [],
  },
  google_ads: {
    label: "Google Ads Conversion",
    icon: Target,
    description: "Track purchase conversions for Google Ads optimization.",
    placeholder: "Enter your Google Ads ID (e.g. AW-XXXXXXXXXX)",
    color: "from-green-500/20 to-green-400/5",
    fields: [
      { key: "conversion_label", label: "Conversion Label", placeholder: "e.g. xYzAbC123" },
    ],
  },
};

const TrackingManagement = () => {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, { pixel_id: string; config: Record<string, any> }>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("tracking_pixels").select("*").order("platform");
    setPixels((data as TrackingPixel[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getEdit = (pixel: TrackingPixel) => {
    return editData[pixel.id] || { pixel_id: pixel.pixel_id, config: pixel.config || {} };
  };

  const setEdit = (id: string, updates: Partial<{ pixel_id: string; config: Record<string, any> }>) => {
    setEditData(prev => ({
      ...prev,
      [id]: { ...getEditById(id), ...updates },
    }));
  };

  const getEditById = (id: string) => {
    const pixel = pixels.find(p => p.id === id);
    return editData[id] || { pixel_id: pixel?.pixel_id || "", config: pixel?.config || {} };
  };

  const handleToggle = async (pixel: TrackingPixel) => {
    const { error } = await supabase
      .from("tracking_pixels")
      .update({ is_active: !pixel.is_active, updated_at: new Date().toISOString() })
      .eq("id", pixel.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${platformConfig[pixel.platform as keyof typeof platformConfig]?.label || pixel.platform} ${!pixel.is_active ? "enabled" : "disabled"}`);
      load();
    }
  };

  const handleSave = async (pixel: TrackingPixel) => {
    const edit = getEdit(pixel);
    setSaving(pixel.id);
    const { error } = await supabase
      .from("tracking_pixels")
      .update({
        pixel_id: edit.pixel_id,
        config: edit.config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pixel.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      setEditData(prev => { const n = { ...prev }; delete n[pixel.id]; return n; });
      load();
    }
    setSaving(null);
  };

  const hasChanges = (pixel: TrackingPixel) => {
    const edit = editData[pixel.id];
    if (!edit) return false;
    return edit.pixel_id !== pixel.pixel_id || JSON.stringify(edit.config) !== JSON.stringify(pixel.config || {});
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Tracking & Analytics
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {pixels.filter(p => p.is_active && p.pixel_id).length} active
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Configure your marketing pixels and analytics tracking. Events are automatically fired on page views, add to cart, checkout, and purchase.
      </p>

      <div className="space-y-3">
        {pixels.map(pixel => {
          const config = platformConfig[pixel.platform as keyof typeof platformConfig];
          if (!config) return null;
          const Icon = config.icon;
          const edit = getEdit(pixel);
          const isExpanded = expandedId === pixel.id;

          return (
            <motion.div
              key={pixel.id}
              layout
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.color} shrink-0`}>
                  <Icon className={`w-5 h-5 ${pixel.is_active ? "text-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                    {pixel.pixel_id && pixel.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-500">Live</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{pixel.pixel_id || "Not configured"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(pixel)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${pixel.is_active ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${pixel.is_active ? "left-[22px]" : "left-0.5"}`} />
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
                          {["PageView", "AddToCart", "InitiateCheckout", "Purchase", "ViewContent", "Search"].map(evt => (
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
    </div>
  );
};

export default TrackingManagement;
