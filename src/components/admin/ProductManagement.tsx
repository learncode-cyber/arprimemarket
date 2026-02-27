import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Edit3, Save, X, Loader2, Star, Sparkles, Copy, CheckSquare, Square, ImagePlus, Wand2 } from "lucide-react";
import { SEOScoreWidget } from "@/components/admin/SEOScoreWidget";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ total: number; done: number; current: string; running: boolean } | null>(null);
  const [imageEnhancing, setImageEnhancing] = useState<string | null>(null);
  const [enhancedImages, setEnhancedImages] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState({
    title: "", price: "", compare_at_price: "", category_id: "", image_url: "",
    description: "", stock_quantity: "0", sku: "", tags: "", weight: "",
  });

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  };

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

  // Single AI Content Generation
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
      toast.success("AI content generated!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setAiGenerating(null);
    }
  };

  // Bulk AI Content Generation
  const bulkGenerateAI = useCallback(async () => {
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    if (!selectedProducts.length) { toast.error("No products selected"); return; }

    setBulkProgress({ total: selectedProducts.length, done: 0, current: selectedProducts[0].title, running: true });
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < selectedProducts.length; i++) {
      const p = selectedProducts[i];
      setBulkProgress(prev => prev ? { ...prev, done: i, current: p.title } : null);

      try {
        const cat = categories.find(c => c.id === p.category_id);
        const { data, error } = await supabase.functions.invoke("ai-content", {
          body: {
            action: "generate",
            product_id: p.id,
            title: p.title,
            current_description: p.description,
            category: cat?.name || "",
            price: p.price,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setAiContent(prev => ({ ...prev, [p.id]: data.content }));
        succeeded++;
      } catch {
        failed++;
      }

      // Small delay to avoid rate limiting
      if (i < selectedProducts.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setBulkProgress(prev => prev ? { ...prev, done: selectedProducts.length, running: false } : null);
    refetch();
    toast.success(`Bulk generation complete: ${succeeded} succeeded, ${failed} failed`);
    setSelectedIds(new Set());

    // Auto-close progress after 3s
    setTimeout(() => setBulkProgress(null), 3000);
  }, [selectedIds, products, categories, refetch]);

  const applyAIContent = async (productId: string, field: string, value: any) => {
    const updateData: any = {};
    if (field === "description") updateData.description = value;
    if (field === "tags") updateData.tags = value;
    const { error } = await supabase.from("products").update(updateData).eq("id", productId);
    if (error) toast.error(error.message);
    else { toast.success(`${field} applied!`); refetch(); }
  };

  const applyAllAIContent = async (productId: string) => {
    const content = aiContent[productId];
    if (!content) return;
    const { error } = await supabase.from("products").update({
      description: content.description,
      tags: content.tags,
    }).eq("id", productId);
    if (error) toast.error(error.message);
    else {
      toast.success("All AI content applied!");
      setAiContent(prev => { const n = { ...prev }; delete n[productId]; return n; });
      refetch();
    }
  };

  // AI Image Enhancement
  const enhanceImage = async (product: Product) => {
    if (!product.image) { toast.error("No image to enhance"); return; }
    setImageEnhancing(product.id);
    try {
      const { data, error } = await supabase.functions.invoke("image-enhance", {
        body: { action: "enhance", image_url: product.image, product_title: product.title },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setEnhancedImages(prev => ({ ...prev, [product.id]: data.enhanced_image }));
      toast.success("Image enhanced! Review and apply below.");
    } catch (err: any) {
      toast.error(err.message || "Image enhancement failed");
    } finally {
      setImageEnhancing(null);
    }
  };

  const applyEnhancedImage = async (productId: string) => {
    const imageData = enhancedImages[productId];
    if (!imageData) return;
    // For now store the base64 directly (in production you'd upload to storage)
    const { error } = await supabase.from("products").update({ image_url: imageData }).eq("id", productId);
    if (error) toast.error(error.message);
    else {
      toast.success("Enhanced image applied!");
      setEnhancedImages(prev => { const n = { ...prev }; delete n[productId]; return n; });
      refetch();
    }
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

      {/* Bulk Progress Bar */}
      <AnimatePresence>
        {bulkProgress && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-card border-2 border-primary/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Bulk AI Generation
              </h4>
              <span className="text-xs text-muted-foreground">{bulkProgress.done}/{bulkProgress.total}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {bulkProgress.running ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating: <span className="text-foreground font-medium">{bulkProgress.current}</span>
                </span>
              ) : (
                <span className="text-green-600 font-medium">✓ Complete!</span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
        {selectedIds.size > 0 && (
          <button
            onClick={bulkGenerateAI}
            disabled={bulkProgress?.running}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/90 text-primary-foreground text-sm font-medium touch-manipulation disabled:opacity-50"
          >
            {bulkProgress?.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Generate ({selectedIds.size})
          </button>
        )}
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
              
              {/* SEO Score Widget */}
              <SEOScoreWidget
                title={newProduct.title}
                description={newProduct.description}
                category={categories.find(c => c.id === newProduct.category_id)?.name}
                price={newProduct.price ? parseFloat(newProduct.price) : undefined}
                onTitleGenerated={(t) => setNewProduct(p => ({ ...p, title: t }))}
                onDescriptionGenerated={(d) => setNewProduct(p => ({ ...p, description: d }))}
              />

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
                <th className="text-left px-3 py-3 w-8">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
                    {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selectedIds.has(p.id) ? "bg-primary/5" : ""}`}>
                  {editingId === p.id ? (
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Title" />
                          <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Price" />
                          <input type="number" value={editForm.stock_quantity} onChange={e => setEditForm(f => ({ ...f, stock_quantity: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Stock" />
                        </div>
                        <textarea rows={2} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" placeholder="Description" />
                        <SEOScoreWidget
                          title={editForm.title || ""}
                          description={editForm.description || ""}
                          onTitleGenerated={(t) => setEditForm(f => ({ ...f, title: t }))}
                          onDescriptionGenerated={(d) => setEditForm(f => ({ ...f, description: d }))}
                        />
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
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {selectedIds.has(p.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
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
                            onClick={() => enhanceImage(p)}
                            disabled={imageEnhancing === p.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                            title="AI Enhance Image"
                          >
                            {imageEnhancing === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => generateAIContent(p)}
                            disabled={aiGenerating === p.id || bulkProgress?.running}
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
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Image Preview Panels */}
      <AnimatePresence>
        {Object.entries(enhancedImages).map(([productId, imageData]) => {
          const product = products.find(p => p.id === productId);
          if (!product) return null;
          return (
            <motion.div
              key={`img-${productId}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card border-2 border-primary/20 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  Enhanced Image — {product.title}
                </h3>
                <button onClick={() => setEnhancedImages(prev => { const n = { ...prev }; delete n[productId]; return n; })} className="p-1 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Original</p>
                  <img src={product.image} alt="Original" className="w-full h-48 object-contain rounded-xl bg-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Enhanced</p>
                  <img src={imageData} alt="Enhanced" className="w-full h-48 object-contain rounded-xl bg-secondary" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => applyEnhancedImage(productId)} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">Apply Enhanced Image</button>
                <button onClick={() => enhanceImage(product)} disabled={imageEnhancing === productId} className="py-2 px-4 rounded-xl bg-secondary text-muted-foreground text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
                  {imageEnhancing === productId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Retry
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

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
                <div className="flex items-center gap-2">
                  <button onClick={() => applyAllAIContent(productId)} className="text-[10px] px-3 py-1 rounded-lg bg-primary text-primary-foreground font-medium">Apply All</button>
                  <button onClick={() => setAiContent(prev => { const n = { ...prev }; delete n[productId]; return n; })} className="p-1 rounded-lg hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
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
                  <p className="text-xs text-foreground bg-muted/30 rounded-xl p-3 leading-relaxed" dir="rtl">{content.description_ar}</p>
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
