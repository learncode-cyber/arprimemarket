import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { api, ApiProduct, ApiCategory } from "@/lib/api";

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

/**
 * Fetches products via the API gateway (server-side cached, rate-limited).
 * Falls back to direct Supabase query if gateway is unavailable.
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
      // Try API gateway first
      const res = await api.products.list(params);
      if (res.data) {
        return res.data.products.map(mapApiProduct);
      }

      // Fallback to direct query
      console.warn("[Products] API gateway unavailable, using direct query");
      return fallbackProductQuery();
    },
  });
};

export const useProduct = (idOrSlug: string) => {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async (): Promise<Product | null> => {
      const res = await api.products.detail(idOrSlug);
      if (res.data) return mapApiProduct(res.data);

      // Fallback
      console.warn("[Product] API gateway unavailable, using direct query");
      return fallbackProductDetail(idOrSlug);
    },
    enabled: !!idOrSlug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<DbCategory[]> => {
      const res = await api.categories.list();
      if (res.data) {
        return (res.data as ApiCategory[]).map(c => ({ id: c.id, name: c.name, slug: c.slug, image_url: c.image_url || null }));
      }

      // Fallback
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
};

// ─── Mapping helper ───
function mapApiProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description || "",
    price: p.price,
    image: p.image || "/placeholder.svg",
    category: p.category || "Uncategorized",
    category_id: p.category_id || null,
    rating: p.rating || 0,
    review_count: p.review_count || 0,
    stock_quantity: p.stock_quantity,
    is_featured: p.is_featured,
    compare_at_price: p.compare_at_price,
    currency: p.currency,
    images: p.images || [],
    tags: p.tags || [],
  };
}

// ─── Fallback queries (direct Supabase) ───
async function fallbackProductQuery(): Promise<Product[]> {
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
}

async function fallbackProductDetail(idOrSlug: string): Promise<Product | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  let query = supabase.from("products").select("*, categories(name)").eq("is_active", true);
  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const p: any = data;
  return {
    id: p.id, title: p.title, slug: p.slug,
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
}
