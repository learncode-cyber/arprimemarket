import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { api, ApiProduct, ApiCategory } from "@/lib/api";
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
 * Fetches products directly from the database.
 * Tries API gateway first only if edge functions are available,
 * otherwise goes straight to direct Supabase query for portability.
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
      // Always try direct DB query first for maximum portability
      try {
        const products = await directProductQuery(params);
        if (products.length > 0) return products;
      } catch (dbErr) {
        console.warn("[Products] Direct DB query failed:", dbErr);
      }

      // Then try API gateway as secondary
      try {
        const res = await api.products.list(params);
        if (res.data) {
          return res.data.products.map(mapApiProduct);
        }
      } catch (apiErr) {
        console.warn("[Products] API gateway also failed:", apiErr);
      }

      console.error("[Products] All data sources failed");
      return [];
    },
  });
};

export const useProduct = (idOrSlug: string) => {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async (): Promise<Product | null> => {
      // Direct DB first
      try {
        const product = await directProductDetail(idOrSlug);
        if (product) return product;
      } catch (dbErr) {
        console.warn("[Product] Direct DB query failed:", dbErr);
      }

      // API gateway fallback
      try {
        const res = await api.products.detail(idOrSlug);
        if (res.data) return mapApiProduct(res.data);
      } catch (apiErr) {
        console.warn("[Product] API gateway also failed:", apiErr);
      }

      return null;
    },
    enabled: !!idOrSlug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<DbCategory[]> => {
      // Direct DB first
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, image_url")
          .order("name");
        if (!error && data && data.length > 0) {
          return data.map((category) => ({
            ...category,
            image_url: resolveStorageImageUrl(category.image_url, CATEGORY_FALLBACK),
          }));
        }
        if (error) console.warn("[Categories] Direct query error:", error.message);
      } catch (err) {
        console.warn("[Categories] Direct query failed:", err);
      }

      // API gateway fallback
      try {
        const res = await api.categories.list();
        if (res.data) {
          return (res.data as ApiCategory[]).map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            image_url: resolveStorageImageUrl(c.image_url, CATEGORY_FALLBACK),
          }));
        }
      } catch (apiErr) {
        console.warn("[Categories] API gateway also failed:", apiErr);
      }

      return [];
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
    image: resolveStorageImageUrl(p.image, STORAGE_PRODUCT_FALLBACK_URL),
    category: p.category || "Uncategorized",
    category_id: p.category_id || null,
    rating: p.rating || 0,
    review_count: p.review_count || 0,
    stock_quantity: p.stock_quantity,
    is_featured: p.is_featured,
    compare_at_price: p.compare_at_price,
    currency: p.currency,
    images: (p.images || []).map((img) => resolveStorageImageUrl(img, STORAGE_PRODUCT_FALLBACK_URL)),
    tags: p.tags || [],
  };
}

// ─── Fallback queries (direct Supabase) ───
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

// ─── Direct queries (portable, no edge functions needed) ───
async function directProductQuery(params?: {
  category?: string;
  search?: string;
  featured?: boolean;
}): Promise<Product[]> {
  // Try products table directly (works on any Supabase instance)
  let query = supabase
    .from("products")
    .select("*, categories(name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

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
    console.warn("[Products] products table query failed:", error.message);
    // Try products_public view as last resort
    const viewRes = await supabase
      .from("products_public")
      .select("*, categories(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (viewRes.error) throw viewRes.error;
    return (viewRes.data || []).map(mapDbProduct);
  }

  return (data || []).map(mapDbProduct);
}

async function directProductDetail(idOrSlug: string): Promise<Product | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  let query = supabase.from("products").select("*, categories(name)").eq("is_active", true);
  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.warn("[Product] products table detail failed:", error.message);
    // Try products_public view
    let viewQuery = supabase.from("products_public").select("*, categories(name)").eq("is_active", true);
    viewQuery = isUuid ? viewQuery.eq("id", idOrSlug) : viewQuery.eq("slug", idOrSlug);
    const viewRes = await viewQuery.maybeSingle();
    if (viewRes.error) throw viewRes.error;
    if (!viewRes.data) return null;
    return mapDbProduct(viewRes.data);
  }

  if (!data) return null;
  return mapDbProduct(data);
}

