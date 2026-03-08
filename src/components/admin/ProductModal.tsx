import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Save, Package, DollarSign, BarChart3, Truck, Search as SearchIcon, FileText, Layers, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/hooks/useProductData";
import { toast } from "sonner";
import { ProductImageUploader } from "./ProductImageUploader";
import { ProductVariantEditor, VariantRow } from "./ProductVariantEditor";
import { SEOScoreWidget } from "./SEOScoreWidget";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DbCategory {
  id: string;
  name: string;
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: DbCategory[];
  onSaved: () => void;
}

type TabKey = "basics" | "pricing" | "inventory" | "shipping" | "seo" | "description" | "images" | "variants";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "basics", label: "Basics", icon: <Package className="w-3.5 h-3.5" /> },
  { key: "images", label: "Images", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "pricing", label: "Pricing", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { key: "inventory", label: "Inventory", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: "shipping", label: "Shipping", icon: <Truck className="w-3.5 h-3.5" /> },
  { key: "seo", label: "SEO", icon: <SearchIcon className="w-3.5 h-3.5" /> },
  { key: "description", label: "Description", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "variants", label: "Variants", icon: <Layers className="w-3.5 h-3.5" /> },
];

const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

export const ProductModal = ({ open, onClose, product, categories, onSaved }: ProductModalProps) => {
  const isEdit = !!product;
  const [tab, setTab] = useState<TabKey>("basics");
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", category_id: "", brand: "", description: "",
    price: "", compare_at_price: "", cost_price: "",
    sku: "", barcode: "", stock_quantity: "0", low_stock_threshold: "5",
    weight: "", length_cm: "", width_cm: "", height_cm: "",
    meta_title: "", meta_description: "", tags: "",
    is_featured: false, is_active: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  // Load product data when editing
  useEffect(() => {
    if (product && open) {
      setForm({
        title: product.title || "",
        category_id: product.category_id || "",
        brand: "",
        description: product.description || "",
        price: product.price?.toString() || "",
        compare_at_price: product.compare_at_price?.toString() || "",
        cost_price: "",
        sku: "",
        barcode: "",
        stock_quantity: product.stock_quantity?.toString() || "0",
        low_stock_threshold: "5",
        weight: "",
        length_cm: "", width_cm: "", height_cm: "",
        meta_title: "", meta_description: "",
        tags: product.tags?.join(", ") || "",
        is_featured: product.is_featured || false,
        is_active: true,
      });
      // Load full product details for edit
      loadFullProduct(product.id);
      loadVariants(product.id);
      setTab("basics");
    } else if (!product && open) {
      resetForm();
      setTab("basics");
    }
  }, [product, open]);

  const resetForm = () => {
    setForm({
      title: "", category_id: "", brand: "", description: "",
      price: "", compare_at_price: "", cost_price: "",
      sku: "", barcode: "", stock_quantity: "0", low_stock_threshold: "5",
      weight: "", length_cm: "", width_cm: "", height_cm: "",
      meta_title: "", meta_description: "", tags: "",
      is_featured: false, is_active: true,
    });
    setImages([]);
    setVariants([]);
  };

  const loadFullProduct = async (id: string) => {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    if (data) {
      setForm(f => ({
        ...f,
        brand: data.brand || "",
        cost_price: data.cost_price?.toString() || "",
        sku: data.sku || "",
        barcode: data.barcode || "",
        low_stock_threshold: data.low_stock_threshold?.toString() || "5",
        weight: data.weight?.toString() || "",
        length_cm: data.length_cm?.toString() || "",
        width_cm: data.width_cm?.toString() || "",
        height_cm: data.height_cm?.toString() || "",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
      }));
      setImages(data.images || (data.image_url ? [data.image_url] : []));
    }
  };

  const loadVariants = async (productId: string) => {
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    if (data) {
      setVariants(data.map((v: any) => ({
        id: v.id,
        variant_label: v.variant_label,
        size: v.size || "",
        color: v.color || "",
        sku: v.sku || "",
        price_delta: v.price_delta?.toString() || "0",
        stock_quantity: v.stock_quantity?.toString() || "0",
        is_active: v.is_active,
      })));
    }
  };

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.title || !form.price) {
      toast.error("Title and price are required");
      return;
    }

    setSaving(true);
    try {
      const slug = isEdit
        ? undefined
        : form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

      const productData: any = {
        title: form.title,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        category_id: form.category_id || null,
        brand: form.brand || null,
        description: form.description || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        weight: form.weight ? parseFloat(form.weight) : null,
        length_cm: form.length_cm ? parseFloat(form.length_cm) : null,
        width_cm: form.width_cm ? parseFloat(form.width_cm) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        is_featured: form.is_featured,
        is_active: form.is_active,
        image_url: images[0] || null,
        images: images,
      };

      let productId = product?.id;

      if (isEdit && productId) {
        const { error } = await supabase.from("products").update(productData).eq("id", productId);
        if (error) throw error;
      } else {
        productData.slug = slug;
        const { data: inserted, error } = await supabase.from("products").insert(productData).select("id").single();
        if (error) throw error;
        productId = inserted.id;
      }

      // Save variants
      if (productId) await saveVariants(productId);

      toast.success(isEdit ? "Product updated!" : "Product created!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveVariants = async (productId: string) => {
    for (const v of variants) {
      if (v._deleted && v.id) {
        await supabase.from("product_variants").update({ is_active: false }).eq("id", v.id);
      } else if (v._isNew && !v._deleted) {
        if (!v.size && !v.color && !v.sku) continue;
        await supabase.from("product_variants").insert({
          product_id: productId,
          variant_label: v.variant_label || [v.size, v.color].filter(Boolean).join(" / "),
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          price_delta: parseFloat(v.price_delta) || 0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          is_active: true,
          sort_order: variants.indexOf(v),
        });
      } else if (v.id && !v._deleted) {
        await supabase.from("product_variants").update({
          variant_label: v.variant_label || [v.size, v.color].filter(Boolean).join(" / "),
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          price_delta: parseFloat(v.price_delta) || 0,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          is_active: v.is_active,
          sort_order: variants.indexOf(v),
        }).eq("id", v.id);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="font-display text-base font-bold text-foreground">
            {isEdit ? "Edit Product" : "Create Product"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-4" style={{ maxHeight: "calc(90vh - 110px)" }}>
          {/* BASICS */}
          {tab === "basics" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} placeholder="Product name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className={inputClass}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Brand</label>
                  <input value={form.brand} onChange={(e) => update("brand", e.target.value)} className={inputClass} placeholder="Brand name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => update("tags", e.target.value)} className={inputClass} placeholder="electronics, gadgets" />
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* IMAGES */}
          {tab === "images" && (
            <ProductImageUploader images={images} onChange={setImages} maxImages={5} />
          )}

          {/* PRICING */}
          {tab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Price (BDT) *</label>
                  <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelClass}>Compare at Price</label>
                  <input type="number" value={form.compare_at_price} onChange={(e) => update("compare_at_price", e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelClass}>Cost Price</label>
                  <input type="number" value={form.cost_price} onChange={(e) => update("cost_price", e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
              </div>
              {form.price && form.compare_at_price && parseFloat(form.compare_at_price) > parseFloat(form.price) && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
                  <strong>Discount:</strong> {Math.round(((parseFloat(form.compare_at_price) - parseFloat(form.price)) / parseFloat(form.compare_at_price)) * 100)}% off
                  {form.cost_price && (
                    <span className="ml-3"><strong>Margin:</strong> ৳{(parseFloat(form.price) - parseFloat(form.cost_price)).toFixed(2)} ({Math.round(((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100)}%)</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* INVENTORY */}
          {tab === "inventory" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>SKU</label>
                  <input value={form.sku} onChange={(e) => update("sku", e.target.value)} className={inputClass} placeholder="SKU-001" />
                </div>
                <div>
                  <label className={labelClass}>Barcode</label>
                  <input value={form.barcode} onChange={(e) => update("barcode", e.target.value)} className={inputClass} placeholder="UPC/EAN" />
                </div>
                <div>
                  <label className={labelClass}>Stock Quantity</label>
                  <input type="number" value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Low Stock Alert Threshold</label>
                  <input type="number" value={form.low_stock_threshold} onChange={(e) => update("low_stock_threshold", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING */}
          {tab === "shipping" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input type="number" step="0.01" value={form.weight} onChange={(e) => update("weight", e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className={`${labelClass} mb-2`}>Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Length</label>
                    <input type="number" step="0.1" value={form.length_cm} onChange={(e) => update("length_cm", e.target.value)} className={inputClass} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Width</label>
                    <input type="number" step="0.1" value={form.width_cm} onChange={(e) => update("width_cm", e.target.value)} className={inputClass} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Height</label>
                    <input type="number" step="0.1" value={form.height_cm} onChange={(e) => update("height_cm", e.target.value)} className={inputClass} placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO */}
          {tab === "seo" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Meta Title</label>
                <input value={form.meta_title} onChange={(e) => update("meta_title", e.target.value)} className={inputClass} placeholder="SEO title (max 60 chars)" maxLength={60} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_title.length}/60</p>
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea rows={3} value={form.meta_description} onChange={(e) => update("meta_description", e.target.value)} className={`${inputClass} resize-none`} placeholder="SEO description (max 160 chars)" maxLength={160} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_description.length}/160</p>
              </div>
              <SEOScoreWidget
                title={form.meta_title || form.title}
                description={form.meta_description || form.description}
                category={categories.find((c) => c.id === form.category_id)?.name}
                price={form.price ? parseFloat(form.price) : undefined}
                onTitleGenerated={(t) => update("meta_title", t)}
                onDescriptionGenerated={(d) => update("meta_description", d)}
              />
            </div>
          )}

          {/* DESCRIPTION */}
          {tab === "description" && (
            <div className="space-y-3">
              <label className={labelClass}>Product Description</label>
              <textarea
                rows={12}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className={`${inputClass} resize-y min-h-[200px]`}
                placeholder="Write a detailed product description..."
              />
              <p className="text-[10px] text-muted-foreground">{form.description.length} characters</p>
            </div>
          )}

          {/* VARIANTS */}
          {tab === "variants" && (
            <ProductVariantEditor variants={variants} onChange={setVariants} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
