import { memo, useMemo } from "react";
import { ProductVariant } from "@/hooks/useProductVariants";
import { useCurrency } from "@/context/CurrencyContext";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
  basePrice: number;
}

export const VariantSelector = memo(({ variants, selectedVariant, onSelect, basePrice }: VariantSelectorProps) => {
  const { formatPrice } = useCurrency();

  const sizes = useMemo(() => {
    const unique = [...new Set(variants.filter(v => v.size).map(v => v.size!))];
    return unique;
  }, [variants]);

  const colors = useMemo(() => {
    const unique = [...new Set(variants.filter(v => v.color).map(v => v.color!))];
    return unique;
  }, [variants]);

  const getVariant = (size?: string, color?: string) => {
    return variants.find(v =>
      (!size || v.size === size) && (!color || v.color === color)
    );
  };

  if (variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Size</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => {
              const variant = getVariant(size, selectedVariant?.color || undefined);
              const isSelected = selectedVariant?.size === size;
              const inStock = variant ? variant.stock_quantity > 0 : false;

              return (
                <button
                  key={size}
                  onClick={() => variant && onSelect(variant)}
                  disabled={!inStock}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all touch-manipulation border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : inStock
                        ? "bg-card border-border text-foreground hover:border-primary/50"
                        : "bg-muted/50 border-border text-muted-foreground/40 cursor-not-allowed line-through"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => {
              const variant = getVariant(selectedVariant?.size || undefined, color);
              const isSelected = selectedVariant?.color === color;
              const inStock = variant ? variant.stock_quantity > 0 : false;

              return (
                <button
                  key={color}
                  onClick={() => variant && onSelect(variant)}
                  disabled={!inStock}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all touch-manipulation border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : inStock
                        ? "bg-card border-border text-foreground hover:border-primary/50"
                        : "bg-muted/50 border-border text-muted-foreground/40 cursor-not-allowed line-through"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Variant-specific info */}
      {selectedVariant && (
        <div className="flex items-center gap-3 text-xs">
          {selectedVariant.sku && (
            <span className="text-muted-foreground">SKU: {selectedVariant.sku}</span>
          )}
          <span className={selectedVariant.stock_quantity > 0 ? "text-green-500" : "text-destructive"}>
            {selectedVariant.stock_quantity > 0
              ? `${selectedVariant.stock_quantity} in stock`
              : "Out of stock"}
          </span>
          {selectedVariant.price_delta !== 0 && (
            <span className="text-muted-foreground">
              {selectedVariant.price_delta > 0 ? "+" : ""}{formatPrice(selectedVariant.price_delta)}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

VariantSelector.displayName = "VariantSelector";
