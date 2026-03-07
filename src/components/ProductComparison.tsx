import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitCompare, Star, Package, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

export interface CompareProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  image_url: string | null;
  rating?: number | null;
  review_count?: number | null;
  stock_quantity?: number;
  weight?: number | null;
  description?: string | null;
  category_name?: string;
}

interface Props {
  products: CompareProduct[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

const ProductComparison = ({ products, onRemove, onClose }: Props) => {
  const { formatPrice } = useCurrency();
  const { lang } = useLanguage();
  const tx = (en: string, bn: string) => lang.code === "bn" ? bn : en;

  if (products.length === 0) return null;

  const rows = [
    { label: tx("Price", "মূল্য"), render: (p: CompareProduct) => <span className="font-bold text-primary">{formatPrice(p.price)}</span> },
    { label: tx("Original Price", "আসল মূল্য"), render: (p: CompareProduct) => p.compare_at_price ? <span className="line-through text-muted-foreground">{formatPrice(p.compare_at_price)}</span> : <span className="text-muted-foreground">—</span> },
    { label: tx("Rating", "রেটিং"), render: (p: CompareProduct) => (
      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        <span>{p.rating?.toFixed(1) || "N/A"}</span>
        <span className="text-muted-foreground text-xs">({p.review_count || 0})</span>
      </div>
    )},
    { label: tx("Stock", "স্টক"), render: (p: CompareProduct) => (
      <span className={p.stock_quantity && p.stock_quantity > 0 ? "text-green-600" : "text-destructive"}>
        {p.stock_quantity && p.stock_quantity > 0 ? `${p.stock_quantity} ${tx("available", "পাওয়া যাচ্ছে")}` : tx("Out of stock", "স্টক শেষ")}
      </span>
    )},
    { label: tx("Weight", "ওজন"), render: (p: CompareProduct) => p.weight ? `${p.weight} kg` : "—" },
  ];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-2xl max-h-[70vh] overflow-auto"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{tx("Compare Products", "পণ্য তুলনা")} ({products.length}/4)</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left p-2 w-32"></th>
                {products.map(p => (
                  <th key={p.id} className="p-2 text-center min-w-[150px]">
                    <div className="relative">
                      <button onClick={() => onRemove(p.id)} className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive/10 hover:bg-destructive/20">
                        <X className="w-3 h-3 text-destructive" />
                      </button>
                      <img src={p.image_url || "/placeholder.svg"} alt={p.title} className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
                      <p className="text-xs font-medium truncate max-w-[140px] mx-auto">{p.title}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                  <td className="p-2 text-xs font-medium text-muted-foreground">{row.label}</td>
                  {products.map(p => (
                    <td key={p.id} className="p-2 text-center text-sm">{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductComparison;
