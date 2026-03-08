import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface VariantRow {
  id?: string;
  variant_label: string;
  size: string;
  color: string;
  sku: string;
  price_delta: string;
  stock_quantity: string;
  is_active: boolean;
  _isNew?: boolean;
  _deleted?: boolean;
}

interface ProductVariantEditorProps {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

const emptyVariant = (): VariantRow => ({
  variant_label: "",
  size: "",
  color: "",
  sku: "",
  price_delta: "0",
  stock_quantity: "0",
  is_active: true,
  _isNew: true,
});

export const ProductVariantEditor = ({ variants, onChange }: ProductVariantEditorProps) => {
  const activeVariants = variants.filter((v) => !v._deleted);

  const addVariant = () => {
    onChange([...variants, emptyVariant()]);
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: any) => {
    const updated = [...variants];
    const realIndex = variants.indexOf(activeVariants[index]);
    updated[realIndex] = { ...updated[realIndex], [field]: value };
    // Auto-generate label
    if (field === "size" || field === "color") {
      const v = updated[realIndex];
      updated[realIndex].variant_label = [v.size, v.color].filter(Boolean).join(" / ") || "";
    }
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    const updated = [...variants];
    const realIndex = variants.indexOf(activeVariants[index]);
    if (updated[realIndex]._isNew) {
      updated.splice(realIndex, 1);
    } else {
      updated[realIndex] = { ...updated[realIndex], _deleted: true, is_active: false };
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          Product Variants ({activeVariants.length})
        </label>
        <button
          type="button"
          onClick={addVariant}
          className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Variant
        </button>
      </div>

      {activeVariants.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-xl">
          <p className="text-xs text-muted-foreground">No variants yet. Add size, color, or capacity options.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_80px_80px_32px] gap-2 px-1">
            <span className="text-[10px] font-medium text-muted-foreground">Size</span>
            <span className="text-[10px] font-medium text-muted-foreground">Color</span>
            <span className="text-[10px] font-medium text-muted-foreground">SKU</span>
            <span className="text-[10px] font-medium text-muted-foreground">Price ±</span>
            <span className="text-[10px] font-medium text-muted-foreground">Stock</span>
            <span></span>
          </div>

          {activeVariants.map((v, i) => (
            <div
              key={v.id || `new-${i}`}
              className="grid grid-cols-[1fr_1fr_1fr_80px_80px_32px] gap-2 items-center bg-secondary/50 rounded-xl p-2"
            >
              <input
                value={v.size}
                onChange={(e) => updateVariant(i, "size", e.target.value)}
                placeholder="e.g. XL"
                className="px-2 py-1.5 rounded-lg bg-background text-xs text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <input
                value={v.color}
                onChange={(e) => updateVariant(i, "color", e.target.value)}
                placeholder="e.g. Red"
                className="px-2 py-1.5 rounded-lg bg-background text-xs text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <input
                value={v.sku}
                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                placeholder="SKU"
                className="px-2 py-1.5 rounded-lg bg-background text-xs text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <input
                type="number"
                value={v.price_delta}
                onChange={(e) => updateVariant(i, "price_delta", e.target.value)}
                placeholder="0"
                className="px-2 py-1.5 rounded-lg bg-background text-xs text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <input
                type="number"
                value={v.stock_quantity}
                onChange={(e) => updateVariant(i, "stock_quantity", e.target.value)}
                placeholder="0"
                className="px-2 py-1.5 rounded-lg bg-background text-xs text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
