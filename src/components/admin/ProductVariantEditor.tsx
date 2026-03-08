import { Plus, Trash2 } from "lucide-react";

export interface VariantRow {
  id?: string;
  variant_label: string;
  size: string;
  color: string;
  material: string;
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
  material: "",
  sku: "",
  price_delta: "0",
  stock_quantity: "0",
  is_active: true,
  _isNew: true,
});

const inputClass = "px-2.5 py-2 rounded-lg bg-background text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

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
    if (field === "size" || field === "color" || field === "material") {
      const v = updated[realIndex];
      updated[realIndex].variant_label = [v.size, v.color, v.material].filter(Boolean).join(" / ") || "";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-foreground">
            Product Variants
          </label>
          <p className="text-[10px] text-muted-foreground">
            {activeVariants.length} variant{activeVariants.length !== 1 ? "s" : ""} • Each with independent price & stock
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="text-[10px] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" /> Add Variant
        </button>
      </div>

      {activeVariants.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl bg-secondary/20">
          <p className="text-sm text-muted-foreground font-medium mb-1">No variants yet</p>
          <p className="text-[10px] text-muted-foreground">Add size, color, or material options for this product</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_80px_80px_32px] gap-2 px-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Size</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Color</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Material</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">SKU</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price ±</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stock</span>
            <span></span>
          </div>

          {activeVariants.map((v, i) => (
            <div
              key={v.id || `new-${i}`}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_80px_80px_32px] gap-2 items-center bg-card border border-border rounded-xl p-2.5 hover:border-primary/30 transition-colors"
            >
              <input
                value={v.size}
                onChange={(e) => updateVariant(i, "size", e.target.value)}
                placeholder="e.g. XL"
                className={inputClass}
              />
              <div className="flex items-center gap-1.5">
                {v.color && (
                  <div
                    className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: v.color.toLowerCase() }}
                  />
                )}
                <input
                  value={v.color}
                  onChange={(e) => updateVariant(i, "color", e.target.value)}
                  placeholder="e.g. Red"
                  className={`${inputClass} flex-1 min-w-0`}
                />
              </div>
              <input
                value={v.material}
                onChange={(e) => updateVariant(i, "material", e.target.value)}
                placeholder="e.g. Cotton"
                className={inputClass}
              />
              <input
                value={v.sku}
                onChange={(e) => updateVariant(i, "sku", e.target.value)}
                placeholder="SKU-001"
                className={inputClass}
              />
              <input
                type="number"
                value={v.price_delta}
                onChange={(e) => updateVariant(i, "price_delta", e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              <input
                type="number"
                value={v.stock_quantity}
                onChange={(e) => updateVariant(i, "stock_quantity", e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors group"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            </div>
          ))}

          {/* Summary */}
          {activeVariants.length > 0 && (
            <div className="flex items-center gap-4 px-2 pt-2 text-[10px] text-muted-foreground">
              <span>Total stock: <strong className="text-foreground">{activeVariants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0)}</strong></span>
              <span>Unique sizes: <strong className="text-foreground">{new Set(activeVariants.map(v => v.size).filter(Boolean)).size}</strong></span>
              <span>Unique colors: <strong className="text-foreground">{new Set(activeVariants.map(v => v.color).filter(Boolean)).size}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
