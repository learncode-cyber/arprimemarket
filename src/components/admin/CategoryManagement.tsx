import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Save, X, Loader2, FolderTree } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useProductData";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const CategoryManagement = () => {
  const { data: categories = [], refetch } = useCategories();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", image_url: "" });
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", image_url: "" });

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleAdd = async () => {
    if (!newCategory.name) { toast.error("Category name required"); return; }
    setSaving(true);
    const slug = newCategory.slug || autoSlug(newCategory.name);
    const { error } = await supabase.from("categories").insert({
      name: newCategory.name,
      slug,
      description: newCategory.description || null,
      image_url: newCategory.image_url || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Category added!");
      setNewCategory({ name: "", slug: "", description: "", image_url: "" });
      setShowAdd(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in this category won't be deleted.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refetch(); }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: "", image_url: "" });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.name) return;
    setSaving(true);
    const { error } = await supabase.from("categories").update({
      name: editForm.name,
      slug: editForm.slug || autoSlug(editForm.name),
      ...(editForm.description && { description: editForm.description }),
      ...(editForm.image_url && { image_url: editForm.image_url }),
    }).eq("id", editingId);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setEditingId(null); refetch(); }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
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
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-foreground">New Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name *</label>
                  <input value={newCategory.name} onChange={e => { setNewCategory(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) })); }} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Slug</label>
                  <input value={newCategory.slug} onChange={e => setNewCategory(p => ({ ...p, slug: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <input value={newCategory.description} onChange={e => setNewCategory(p => ({ ...p, description: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Image URL</label>
                  <input value={newCategory.image_url} onChange={e => setNewCategory(p => ({ ...p, image_url: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
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
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Slug</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-xs">No categories yet</td></tr>
            )}
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                {editingId === cat.id ? (
                  <td colSpan={3} className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Name" />
                      <input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Slug" />
                      <div className="flex gap-1.5">
                        <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 disabled:opacity-60">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs flex items-center gap-1">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-foreground">{cat.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{cat.slug}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManagement;
