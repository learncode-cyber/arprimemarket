import { supabase } from "@/integrations/supabase/client";

/**
 * Enterprise API client for AR Prime Market.
 * All requests go through the api-gateway edge function with
 * caching, rate limiting, auth middleware, and structured logging.
 */

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  cached: boolean;
}

async function callApi<T>(route: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke("api-gateway", {
      body: { route, ...body },
    });

    if (error) {
      console.error(`[API] ${route} error:`, error.message);
      return { data: null, error: error.message, cached: false };
    }

    if (data?.error) {
      return { data: null, error: data.error, cached: false };
    }

    return { data: data as T, error: null, cached: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error(`[API] ${route} exception:`, msg);
    return { data: null, error: msg, cached: false };
  }
}

// ─── Product Types ───
export interface ApiProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  image: string;
  images?: string[];
  description?: string;
  category: string;
  category_slug?: string;
  category_id?: string;
  rating: number;
  review_count: number;
  stock_quantity: number;
  is_featured: boolean;
  tags: string[];
  sku?: string;
  weight?: number;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  products: ApiProduct[];
  pagination: ApiPagination;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discount_type: string;
  discount_value: number;
  calculated_discount: number;
}

// ─── API Methods ───
export const api = {
  products: {
    list(params: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: "asc" | "desc";
      category?: string;
      search?: string;
      featured?: boolean;
      min_price?: number;
      max_price?: number;
    } = {}) {
      return callApi<ProductListResponse>("products.list", {
        params: {
          page: String(params.page || 1),
          limit: String(params.limit || 20),
          sort: params.sort || "created_at",
          order: params.order || "desc",
          ...(params.category && { category: params.category }),
          ...(params.search && { search: params.search }),
          ...(params.featured && { featured: "true" }),
          ...(params.min_price !== undefined && { min_price: String(params.min_price) }),
          ...(params.max_price !== undefined && { max_price: String(params.max_price) }),
        },
      });
    },

    detail(idOrSlug: string) {
      return callApi<ApiProduct>("products.detail", { id: idOrSlug });
    },
  },

  categories: {
    list() {
      return callApi<ApiCategory[]>("categories.list");
    },
  },

  coupons: {
    validate(code: string, subtotal: number) {
      return callApi<CouponValidation>("coupons.validate", { code, subtotal });
    },
  },

  orders: {
    list(params: { page?: number; limit?: number } = {}) {
      return callApi<{ orders: unknown[]; pagination: ApiPagination }>("orders.list", {
        params: {
          page: String(params.page || 1),
          limit: String(params.limit || 10),
        },
      });
    },
  },

  cache: {
    invalidate(pattern?: string) {
      return callApi<{ cleared: number }>("cache.invalidate", { pattern });
    },
  },

  health() {
    return callApi<{ status: string; version: string; cache_size: number }>("health");
  },
};
