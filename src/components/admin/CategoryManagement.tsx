import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, X, Loader2, FolderTree } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useProductData";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { bumpStorageImageVersion, resolveStorageImageUrl } from "@/lib/storageImage";
import { CategoryImageUploader } from "./CategoryImageUploader";
import { GoogleSEOPreview } from "./GoogleSEOPreview";

const CategoryManagement = () => {
  const { data: categories = [], refetch } = useCategories();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", image_url: "" });
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", image_url: "" });

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const validateSlug = (slug: string, excludeId?: string) => {
    return !categories.some(c => c.slug === slug && c.id !== excludeId);
  };

  const refreshCategories = useCallback(async () => {
    bumpStorageImageVersion();
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    await refetch();
  }, [queryClient, refetch]);

  const handleAdd = async () => {
    if (!newCategory.name) { toast.error("Category name required"); return; }
    const slug = newCategory.slug || autoSlug(newCategory.name);
    if (!validateSlug(slug)) { toast.error("Slug already exists! Choose a unique slug."); return; }
    setSaving(true);
    const { error } = await supabase.from("categories").insert({
      name: newCategory.name, slug,
      description: newCategory.description || null,
      image_url: newCategory.image_url || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Category added!");
      setNewCategory({ name: "", slug: "", description: "", image_url: "" });
      setShowAdd(false);
      await refreshCategories();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); await refreshCategories(); }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description || "", image_url: cat.image_url || "" });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.name) return;
    const slug = editForm.slug || autoSlug(editForm.name);
    if (!validateSlug(slug, editingId)) { toast.error("Slug already exists!"); return; }
    setSaving(true);
    const { error } = await supabase.from("categories").update({
      name: editForm.name,
      slug,
      description: editForm.description || null,
      image_url: editForm.image_url || null,
    }).eq("id", editingId);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setEditingId(null); refetch(); }
    setSaving(false);
  };

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
  const resolveImg = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${SUPABASE_URL}/storage/v1/object/public/category-images/${url}`;
  };

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { label: "Total Categories", value: categories.length, color: "text-foreground" },
          { label: "With Image", value: categories.filter(c => c.image_url).length, color: "text-primary" },
          { label: "No Image", value: categories.filter(c => !c.image_url).length, color: categories.filter(c => !c.image_url).length > 0 ? "text-amber-500" : "text-green-500" },
        ].map(s => (
          <motion.div
            key={s.label}
            whileHover={{ y: -2, boxShadow: "0 4px 20px -4px hsl(var(--primary) / 0.15)" }}
            whileTap={{ scale: 0.97 }}
            className="bg-card border border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/40 transition-all duration-200 select-none"
          >
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Categories</h2>
          <span className="text-xs text-muted-foreground">({categories.length})</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium touch-manipulation">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-display text-sm font-semibold text-foreground">New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5">
                <CategoryImageUploader imageUrl={newCategory.image_url} onChange={(url) => setNewCategory(p => ({ ...p, image_url: url }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name *</label>
                    <input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Slug</label>
                    <input value={newCategory.slug} onChange={e => setNewCategory(p => ({ ...p, slug: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    {newCategory.slug && !validateSlug(newCategory.slug) && (
                      <p className="text-[10px] text-destructive mt-0.5">⚠️ Slug already exists</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground">Description</label>
                    <input value={newCategory.description} onChange={e => setNewCategory(p => ({ ...p, description: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              </div>
              {/* SEO Preview */}
              {newCategory.name && (
                <GoogleSEOPreview
                  title={newCategory.name}
                  description={newCategory.description}
                  slug={newCategory.slug || autoSlug(newCategory.name)}
                  baseUrl="arprimemarket.lovable.app"
                />
              )}
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                </button>
                <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
        {categories.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-xs">No categories yet</div>
        )}
        {categories.map(cat => (
          <div key={cat.id} className="p-4 hover:bg-secondary/20 transition-colors">
            {editingId === cat.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
                  <CategoryImageUploader imageUrl={editForm.image_url} onChange={(url) => setEditForm(f => ({ ...f, image_url: url }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Name</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Slug</label>
                      <input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                      {editForm.slug && !validateSlug(editForm.slug, editingId) && (
                        <p className="text-[10px] text-destructive mt-0.5">⚠️ Slug already exists</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-muted-foreground">Description</label>
                      <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full mt-0.5 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                    </div>
                  </div>
                </div>
                {/* SEO Preview for edit */}
                <GoogleSEOPreview
                  title={editForm.name}
                  description={editForm.description}
                  slug={editForm.slug}
                  baseUrl="arprimemarket.lovable.app"
                />
                <div className="flex gap-1.5">
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 disabled:opacity-60">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Changes
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs flex items-center gap-1">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {cat.image_url ? (
                    <img src={resolveImg(cat.image_url)} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border border-border" onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <FolderTree className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{cat.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{cat.slug}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => startEdit(cat)} className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManagement;
