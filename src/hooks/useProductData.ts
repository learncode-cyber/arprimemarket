import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveStorageImageUrl,
  STORAGE_PRODUCT_FALLBACK_URL,
} from "@/lib/storageImage";

const CATEGORY_FALLBACK = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80";

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
  image_url?: string | null;
}

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

function mapDbProduct(p: any): Product {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description || "",
    price: Number(p.price),
    image: resolveStorageImageUrl(p.image_url, STORAGE_PRODUCT_FALLBACK_URL),
    category: p.categories?.name || "Uncategorized",
    category_id: p.category_id,
    rating: Number(p.rating) || 0,
    review_count: p.review_count || 0,
    stock_quantity: p.stock_quantity,
    is_featured: p.is_featured,
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    currency: p.currency,
    images: (p.images || []).map((img: string) => resolveStorageImageUrl(img, STORAGE_PRODUCT_FALLBACK_URL)),
    tags: p.tags || [],
  };
}

/**
 * Fetches products directly from Supabase — no Edge Functions.
 */
export const useProducts = (params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
}) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(params?.limit || 50);

      if (params?.category) {
        query = query.eq("category_id", params.category);
      }
      if (params?.search) {
        query = query.ilike("title", `%${params.search}%`);
      }
      if (params?.featured) {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[Products] Query error:", error.message);
        return [];
      }
      return (data || []).map(mapDbProduct);
    },
  });
};

export const useProduct = (idOrSlug: string) => {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async (): Promise<Product | null> => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      let query = supabase.from("products").select("*, categories(name)").eq("is_active", true);
      query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("[Product] Query error:", error.message);
        return null;
      }
      if (!data) return null;
      return mapDbProduct(data);
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
        .select("id, name, slug, image_url")
        .order("name");

      if (error) {
        console.error("[Categories] Query error:", error.message);
        return [];
      }

      return (data || []).map((category) => ({
        ...category,
        image_url: resolveStorageImageUrl(category.image_url, CATEGORY_FALLBACK),
      }));
    },
  });
};
