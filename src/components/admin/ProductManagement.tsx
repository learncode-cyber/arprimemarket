import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Edit3, Save, X, Loader2, Star, Sparkles, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCategories, Product } from "@/hooks/useProductData";
import { toast } from "sonner";

const ProductManagement = () => {
  const { data: products = [], refetch } = useProducts();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<Record<string, any>>({});
  const [newProduct, setNewProduct] = useState({
    title: "", price: "", compare_at_price: "", category_id: "", image_url: "",
    description: "", stock_quantity: "0", sku: "", tags: "", weight: "",
  });

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = async () => {
    if (!newProduct.title || !newProduct.price) { toast.error("Title and price required"); return; }
    setSaving(true);
    const slug = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    const { error } = await supabase.from("products").insert({
      title: newProduct.title, slug, price: parseFloat(newProduct.price),
      compare_at_price: newProduct.compare_at_price ? parseFloat(newProduct.compare_at_price) : null,
      category_id: newProduct.category_id || null, image_url: newProduct.image_url || null,
      description: newProduct.description || null, stock_quantity: parseInt(newProduct.stock_quantity) || 0,
      sku: newProduct.sku || null, weight: newProduct.weight ? parseFloat(newProduct.weight) : null,
      tags: newProduct.tags ? newProduct.tags.split(",").map(t => t.trim()) : [],
      is_active: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Product added!");
      setNewProduct({ title: "", price: "", compare_at_price: "", category_id: "", image_url: "", description: "", stock_quantity: "0", sku: "", tags: "", weight: "" });
      setShowAdd(false);
      refetch();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refetch(); }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from("products").update({ is_featured: !current }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(!current ? "Featured" : "Unfeatured"); refetch(); }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({
      title: p.title, price: p.price.toString(), stock_quantity: p.stock_quantity.toString(),
      compare_at_price: p.compare_at_price?.toString() || "", image_url: p.image || "",
      description: p.description || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase.from("products").update({
      title: editForm.title, price: parseFloat(editForm.price),
      stock_quantity: parseInt(editForm.stock_quantity) || 0,
      compare_at_price: editForm.compare_at_price ? parseFloat(editForm.compare_at_price) : null,
      image_url: editForm.image_url || null, description: editForm.description || null,
    }).eq("id", editingId);
    if (error) toast.error(error.message); else { toast.success("Updated"); setEditingId(null); refetch(); }
    setSaving(false);
  };

  // AI Content Generation
  const generateAIContent = async (product: Product) => {
    setAiGenerating(product.id);
    try {
      const cat = categories.find(c => c.id === product.category_id);
      const { data, error } = await supabase.functions.invoke("ai-content", {
        body: {
          action: "generate",
          product_id: product.id,
          title: product.title,
          current_description: product.description,
          category: cat?.name || "",
          price: product.price,
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setAiContent(prev => ({ ...prev, [product.id]: data.content }));
      toast.success("AI content generated! Review and apply below.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setAiGenerating(null);
    }
  };

  const applyAIContent = async (productId: string, field: string, value: any) => {
    const updateData: any = {};
    if (field === "description") updateData.description = value;
    if (field === "tags") updateData.tags = value;

    const { error } = await supabase.from("products").update(updateData).eq("id", productId);
    if (error) toast.error(error.message);
    else { toast.success(`${field} applied!`); refetch(); }
  };

  const lowStockCount = products.filter(p => p.stock_quantity <= 5).length;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Total Products", value: products.length, color: "text-foreground" },
          { label: "Featured", value: products.filter(p => p.is_featured).length, color: "text-primary" },
          { label: "Low Stock", value: lowStockCount, color: lowStockCount > 0 ? "text-amber-500" : "text-green-500" },
          { label: "Categories", value: categories.length, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium touch-manipulation">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Add Product Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-display text-base font-semibold text-foreground">New Product</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Title *</label><input value={newProduct.title} onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">SKU</label><input value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Price *</label><input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Compare Price</label><input type="number" value={newProduct.compare_at_price} onChange={e => setNewProduct(p => ({ ...p, compare_at_price: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Category</label>
                  <select value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground">Stock</label><input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct(p => ({ ...p, stock_quantity: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Weight (kg)</label><input type="number" value={newProduct.weight} onChange={e => setNewProduct(p => ({ ...p, weight: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="text-xs text-muted-foreground">Tags (comma separated)</label><input value={newProduct.tags} onChange={e => setNewProduct(p => ({ ...p, tags: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Image URL</label><input value={newProduct.image_url} onChange={e => setNewProduct(p => ({ ...p, image_url: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="text-xs text-muted-foreground">Description</label><textarea rows={3} value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" /></div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Product
                </button>
                <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  {editingId === p.id ? (
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Title" />
                          <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Price" />
                          <input type="number" value={editForm.stock_quantity} onChange={e => setEditForm(f => ({ ...f, stock_quantity: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Stock" />
                        </div>
                        <input value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Image URL" />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={saving} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 disabled:opacity-60">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium flex items-center gap-1">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-secondary" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-xs truncate max-w-[200px]">{p.title}</p>
                            {p.is_featured && <span className="text-[9px] text-primary font-semibold">★ Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{p.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground text-xs">৳{p.price.toLocaleString()}</span>
                        {p.compare_at_price && <span className="text-[10px] text-muted-foreground line-through ml-1">৳{p.compare_at_price.toLocaleString()}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${p.stock_quantity <= 5 ? "text-amber-500" : "text-foreground"}`}>{p.stock_quantity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => generateAIContent(p)}
                            disabled={aiGenerating === p.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                            title="AI Generate Content"
                          >
                            {aiGenerating === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleToggleFeatured(p.id, p.is_featured)} className={`p-1.5 rounded-lg transition-colors ${p.is_featured ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Featured">
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Content Preview Panels */}
      <AnimatePresence>
        {Object.entries(aiContent).map(([productId, content]) => {
          const product = products.find(p => p.id === productId);
          if (!product) return null;
          return (
            <motion.div
              key={productId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card border-2 border-primary/20 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Content — {product.title}
                </h3>
                <button onClick={() => setAiContent(prev => { const n = { ...prev }; delete n[productId]; return n; })} className="p-1 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Description (EN)</label>
                  <button onClick={() => applyAIContent(productId, "description", content.description)} className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium">Apply</button>
                </div>
                <p className="text-xs text-foreground bg-muted/30 rounded-xl p-3 leading-relaxed">{content.description}</p>
              </div>

              {/* Bengali */}
              {content.description_bn && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Description (BN)</label>
                    <button onClick={() => { navigator.clipboard.writeText(content.description_bn); toast.success("Copied!"); }} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                  </div>
                  <p className="text-xs text-foreground bg-muted/30 rounded-xl p-3 leading-relaxed">{content.description_bn}</p>
                </div>
              )}

              {/* Arabic */}
              {content.description_ar && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Description (AR)</label>
                    <button onClick={() => { navigator.clipboard.writeText(content.description_ar); toast.success("Copied!"); }} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-medium flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                  </div>
                  <p className="text-xs text-foreground bg-muted/30 rounded-xl p-3 leading-relaxed dir-rtl" dir="rtl">{content.description_ar}</p>
                </div>
              )}

              {/* Features */}
              {content.features?.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Feature Bullets</label>
                  <ul className="list-disc pl-5 space-y-1">
                    {content.features.map((f: string, i: number) => (
                      <li key={i} className="text-xs text-foreground">{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Meta Title</label>
                  <p className="text-xs text-foreground bg-muted/30 rounded-lg p-2 mt-1 font-medium">{content.meta_title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{content.meta_title?.length || 0}/60 chars</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                  <p className="text-xs text-foreground bg-muted/30 rounded-lg p-2 mt-1">{content.meta_description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{content.meta_description?.length || 0}/160 chars</p>
                </div>
              </div>

              {/* Tags */}
              {content.tags?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Tags</label>
                    <button onClick={() => applyAIContent(productId, "tags", content.tags)} className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium">Apply Tags</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {content.tags.map((t: string, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Regenerate */}
              <button
                onClick={() => generateAIContent(product)}
                disabled={aiGenerating === productId}
                className="w-full py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {aiGenerating === productId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Regenerate Content
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ProductManagement;
