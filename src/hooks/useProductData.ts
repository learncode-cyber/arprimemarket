import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  tags: string[];
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

// Mapped product for UI compatibility
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  category: string;
  category_id: string | null;
  rating: number;
  review_count: number;
  stock_quantity: number;
  is_featured: boolean;
  compare_at_price: number | null;
  currency: string;
  images: string[];
  tags: string[];
}

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data: products, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description || "",
        price: Number(p.price),
        image: p.image_url || "/placeholder.svg",
        category: p.categories?.name || "Uncategorized",
        category_id: p.category_id,
        rating: Number(p.rating) || 0,
        review_count: p.review_count || 0,
        stock_quantity: p.stock_quantity,
        is_featured: p.is_featured,
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        currency: p.currency,
        images: p.images || [],
        tags: p.tags || [],
      }));
    },
  });
};

export const useProduct = (idOrSlug: string) => {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async (): Promise<Product | null> => {
      // Try by ID first, then by slug
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true);

      // UUID pattern check
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      if (isUuid) {
        query = query.eq("id", idOrSlug);
      } else {
        query = query.eq("slug", idOrSlug);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const p: any = data;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description || "",
        price: Number(p.price),
        image: p.image_url || "/placeholder.svg",
        category: p.categories?.name || "Uncategorized",
        category_id: p.category_id,
        rating: Number(p.rating) || 0,
        review_count: p.review_count || 0,
        stock_quantity: p.stock_quantity,
        is_featured: p.is_featured,
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
        currency: p.currency,
        images: p.images || [],
        tags: p.tags || [],
      };
    },
    enabled: !!idOrSlug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<DbCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
};
