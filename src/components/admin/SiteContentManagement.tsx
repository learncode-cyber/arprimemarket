import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Plus, Trash2, X, Image, Type, Link as LinkIcon,
  Layout, MessageSquare, ShieldCheck, Globe, Smartphone, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { useSiteContent, updateSiteContent, useInvalidateSiteContent, SiteContent } from "@/hooks/useSiteContent";
import { toast } from "sonner";

const sectionIcons: Record<string, any> = {
  hero_banner: Layout,
  announcement_bar: MessageSquare,
  footer: LinkIcon,
  whatsapp: Smartphone,
  mega_sale_banner: Type,
  category_images: Image,
  trust_badges: ShieldCheck,
  seo_global: Globe,
  navbar: Layout,
};

const SiteContentManagement = () => {
  const { data: sections = [], isLoading } = useSiteContent();
  const invalidate = useInvalidateSiteContent();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const handleExpand = (key: string, content: Record<string, any>) => {
    if (expandedSection === key) {
      setExpandedSection(null);
    } else {
      setExpandedSection(key);
      setEditData(prev => ({ ...prev, [key]: JSON.parse(JSON.stringify(content)) }));
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateSiteContent(key, editData[key]);
      invalidate();
      toast.success("Content saved!");
      setExpandedSection(null);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    }
    setSaving(null);
  };

  const updateField = (sectionKey: string, path: string[], value: any) => {
    setEditData(prev => {
      const data = JSON.parse(JSON.stringify(prev[sectionKey] || {}));
      let obj = data;
      for (let i = 0; i < path.length - 1; i++) {
        if (obj[path[i]] === undefined) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      return { ...prev, [sectionKey]: data };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Site Content Manager</h2>
        <p className="text-xs text-muted-foreground mt-1">Edit all frontend content from here — Hero banners, Footer, WhatsApp, Trust badges, SEO, and more.</p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const Icon = sectionIcons[section.section_key] || Layout;
          const isExpanded = expandedSection === section.section_key;
          const data = editData[section.section_key] || section.content;

          return (
            <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => handleExpand(section.section_key, section.content)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{section.section_label}</p>
                    <p className="text-[10px] text-muted-foreground">{section.section_key}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Expanded Editor */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      {/* Render editor based on section type */}
                      {section.section_key === "hero_banner" && (
                        <HeroBannerEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))} />
                      )}
                      {section.section_key === "footer" && (
                        <GenericFieldEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))} 
                          fields={[
                            { key: "brand_name", label: "Brand Name", type: "text" },
                            { key: "brand_tagline", label: "Tagline", type: "text" },
                            { key: "brand_description", label: "Description", type: "textarea" },
                            { key: "email", label: "Email", type: "text" },
                            { key: "phone", label: "Phone", type: "text" },
                            { key: "address", label: "Address", type: "text" },
                            { key: "developer_name", label: "Developer Name", type: "text" },
                            { key: "developer_url", label: "Developer URL", type: "text" },
                          ]}
                        />
                      )}
                      {section.section_key === "whatsapp" && (
                        <GenericFieldEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))}
                          fields={[
                            { key: "enabled", label: "Enabled", type: "toggle" },
                            { key: "phone", label: "Phone Number", type: "text" },
                            { key: "message", label: "Default Message", type: "text" },
                          ]}
                        />
                      )}
                      {section.section_key === "announcement_bar" && (
                        <GenericFieldEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))}
                          fields={[
                            { key: "enabled", label: "Enabled", type: "toggle" },
                            { key: "text", label: "Announcement Text", type: "text" },
                            { key: "link", label: "Link URL", type: "text" },
                          ]}
                        />
                      )}
                      {section.section_key === "mega_sale_banner" && (
                        <GenericFieldEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))}
                          fields={[
                            { key: "enabled", label: "Enabled", type: "toggle" },
                            { key: "title", label: "Title", type: "text" },
                            { key: "description", label: "Description", type: "textarea" },
                            { key: "cta_text", label: "CTA Button Text", type: "text" },
                            { key: "cta_link", label: "CTA Link", type: "text" },
                          ]}
                        />
                      )}
                      {section.section_key === "navbar" && (
                        <GenericFieldEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))}
                          fields={[
                            { key: "brand_name", label: "Brand Name", type: "text" },
                            { key: "logo_url", label: "Logo URL", type: "text" },
                          ]}
                        />
                      )}
                      {section.section_key === "seo_global" && (
                        <GenericFieldEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))}
                          fields={[
                            { key: "site_name", label: "Site Name", type: "text" },
                            { key: "default_description", label: "Default Meta Description", type: "textarea" },
                            { key: "default_image", label: "Default OG Image URL", type: "text" },
                            { key: "base_url", label: "Base URL", type: "text" },
                          ]}
                        />
                      )}
                      {section.section_key === "trust_badges" && (
                        <TrustBadgesEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))} />
                      )}
                      {section.section_key === "category_images" && (
                        <CategoryImagesEditor data={data} onChange={(d: any) => setEditData(prev => ({ ...prev, [section.section_key]: d }))} />
                      )}

                      {/* Save button */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSave(section.section_key)}
                          disabled={saving === section.section_key}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60"
                        >
                          {saving === section.section_key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Changes
                        </button>
                        <button
                          onClick={() => setExpandedSection(null)}
                          className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Generic Field Editor ───
interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "toggle" | "number";
}

const GenericFieldEditor = ({ data, onChange, fields }: { data: any; onChange: (d: any) => void; fields: FieldDef[] }) => {
  const update = (key: string, value: any) => onChange({ ...data, [key]: value });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(f => (
        <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
          <label className="text-xs text-muted-foreground font-medium">{f.label}</label>
          {f.type === "toggle" ? (
            <div className="mt-1">
              <button
                onClick={() => update(f.key, !data[f.key])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${data[f.key] ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {data[f.key] ? "Enabled" : "Disabled"}
              </button>
            </div>
          ) : f.type === "textarea" ? (
            <textarea
              value={data[f.key] || ""}
              onChange={e => update(f.key, e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          ) : (
            <input
              type={f.type === "number" ? "number" : "text"}
              value={data[f.key] || ""}
              onChange={e => update(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Hero Banner Editor ───
const HeroBannerEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => {
  const slides = data.slides || [];

  const updateSlide = (index: number, field: string, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    onChange({ ...data, slides: newSlides });
  };

  const addSlide = () => {
    onChange({
      ...data,
      slides: [...slides, { title: "New Slide", subtitle: "Subtitle", description: "Description", cta_text: "Shop Now", cta_link: "/products", image: "", badge: "✨ New", accent: "from-slate-900/80 via-slate-900/40" }],
    });
  };

  const removeSlide = (index: number) => {
    onChange({ ...data, slides: slides.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {slides.map((slide: any, i: number) => (
        <div key={i} className="bg-secondary/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Slide {i + 1}</span>
            <button onClick={() => removeSlide(i)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { key: "title", label: "Title" },
              { key: "subtitle", label: "Subtitle" },
              { key: "badge", label: "Badge" },
              { key: "cta_text", label: "CTA Text" },
              { key: "cta_link", label: "CTA Link" },
              { key: "image", label: "Image URL" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] text-muted-foreground">{f.label}</label>
                <input
                  value={slide[f.key] || ""}
                  onChange={e => updateSlide(i, f.key, e.target.value)}
                  className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Description</label>
            <textarea
              value={slide.description || ""}
              onChange={e => updateSlide(i, "description", e.target.value)}
              rows={2}
              className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>
          {slide.image && (
            <img src={slide.image} alt={`Slide ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
          )}
        </div>
      ))}
      <button onClick={addSlide} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
        <Plus className="w-3.5 h-3.5" /> Add Slide
      </button>
    </div>
  );
};

// ─── Trust Badges Editor ───
const TrustBadgesEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => {
  const badges = data.badges || [];

  const updateBadge = (index: number, field: string, value: string) => {
    const newBadges = [...badges];
    newBadges[index] = { ...newBadges[index], [field]: value };
    onChange({ ...data, badges: newBadges });
  };

  return (
    <div className="space-y-3">
      {badges.map((badge: any, i: number) => (
        <div key={i} className="bg-secondary/30 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Icon (lucide name)</label>
            <input value={badge.icon || ""} onChange={e => updateBadge(i, "icon", e.target.value)}
              className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Title</label>
            <input value={badge.title || ""} onChange={e => updateBadge(i, "title", e.target.value)}
              className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Description</label>
            <input value={badge.description || ""} onChange={e => updateBadge(i, "description", e.target.value)}
              className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Category Images Editor ───
const CategoryImagesEditor = ({ data, onChange }: { data: any; onChange: (d: any) => void }) => {
  const categories = data.categories || [];

  const updateCat = (index: number, field: string, value: string) => {
    const newCats = [...categories];
    newCats[index] = { ...newCats[index], [field]: value };
    onChange({ ...data, categories: newCats });
  };

  const addCat = () => {
    onChange({ ...data, categories: [...categories, { name: "New Category", image: "" }] });
  };

  const removeCat = (index: number) => {
    onChange({ ...data, categories: categories.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {categories.map((cat: any, i: number) => (
        <div key={i} className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
          {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Name</label>
              <input value={cat.name || ""} onChange={e => updateCat(i, "name", e.target.value)}
                className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Image URL</label>
              <input value={cat.image || ""} onChange={e => updateCat(i, "image", e.target.value)}
                className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground focus:outline-none" />
            </div>
          </div>
          <button onClick={() => removeCat(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={addCat} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
        <Plus className="w-3.5 h-3.5" /> Add Category
      </button>
    </div>
  );
};

export default SiteContentManagement;
