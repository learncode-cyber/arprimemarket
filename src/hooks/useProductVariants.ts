import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_label: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price_delta: number;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
}

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async (): Promise<ProductVariant[]> => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        variant_label: v.variant_label,
        size: v.size,
        color: v.color,
        sku: v.sku,
        price_delta: Number(v.price_delta),
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
        sort_order: v.sort_order,
      }));
    },
    enabled: !!productId,
  });
};
