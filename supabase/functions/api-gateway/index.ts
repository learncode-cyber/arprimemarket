import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── In-memory cache ───
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  // Evict old entries when cache grows too large
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}

// ─── Rate limiter ───
const rateLimits = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig { max: number; windowMs: number }

const rlConfigs: Record<string, RateLimitConfig> = {
  "products.list":    { max: 120, windowMs: 60_000 },
  "products.detail":  { max: 200, windowMs: 60_000 },
  "categories.list":  { max: 120, windowMs: 60_000 },
  "orders.create":    { max: 10,  windowMs: 3600_000 },
  "orders.list":      { max: 60,  windowMs: 60_000 },
  "coupons.validate": { max: 20,  windowMs: 60_000 },
  default:            { max: 100, windowMs: 60_000 },
};

function checkRate(key: string, cfg: RateLimitConfig): { ok: boolean; remaining: number } {
  const now = Date.now();
  const e = rateLimits.get(key);
  if (!e || now > e.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return { ok: true, remaining: cfg.max - 1 };
  }
  if (e.count >= cfg.max) return { ok: false, remaining: 0 };
  e.count++;
  return { ok: true, remaining: cfg.max - e.count };
}

// ─── Logger ───
interface LogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  route: string;
  userId?: string;
  durationMs?: number;
  error?: string;
  meta?: Record<string, unknown>;
}

async function logEvent(entry: LogEntry) {
  // Log to stdout for edge function logs dashboard
  console.log(JSON.stringify(entry));
}

// ─── Auth middleware ───
async function authenticate(req: Request): Promise<{ userId: string; role: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Check role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, role: roleData?.role || "user" };
}

// ─── Response helpers ───
function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function error(msg: string, status = 400) {
  return json({ error: msg }, status);
}

// ─── Route handlers ───

async function handleProductsList(supabase: ReturnType<typeof createClient>, params: Record<string, string>) {
  const cacheKey = `products:${params.category || "all"}:${params.page || "1"}:${params.limit || "20"}:${params.sort || "created_at"}`;
  const cached = getCache(cacheKey);
  if (cached) return json(cached, 200, { "X-Cache": "HIT" });

  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(params.limit || "20")));
  const offset = (page - 1) * limit;
  const sort = params.sort || "created_at";
  const order = params.order === "asc" ? true : false;

  let query = supabase
    .from("products")
    .select("id, title, slug, price, compare_at_price, currency, image_url, rating, review_count, stock_quantity, is_featured, tags, category_id, categories(name, slug)", { count: "exact" })
    .eq("is_active", true)
    .range(offset, offset + limit - 1)
    .order(sort, { ascending: order });

  if (params.category) {
    query = query.eq("categories.slug", params.category);
  }

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }

  if (params.featured === "true") {
    query = query.eq("is_featured", true);
  }

  if (params.min_price) {
    query = query.gte("price", parseFloat(params.min_price));
  }
  if (params.max_price) {
    query = query.lte("price", parseFloat(params.max_price));
  }

  const { data, error: err, count } = await query;
  if (err) throw err;

  const result = {
    products: (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      currency: p.currency,
      image: p.image_url || "/placeholder.svg",
      category: p.categories?.name || "Uncategorized",
      category_slug: p.categories?.slug || "",
      rating: Number(p.rating) || 0,
      review_count: p.review_count || 0,
      stock_quantity: p.stock_quantity,
      is_featured: p.is_featured,
      tags: p.tags || [],
    })),
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  };

  // Cache for 2 minutes
  setCache(cacheKey, result, 120_000);
  return json(result, 200, { "X-Cache": "MISS", "Cache-Control": "public, max-age=120, s-maxage=300" });
}

async function handleProductDetail(supabase: ReturnType<typeof createClient>, idOrSlug: string) {
  const cacheKey = `product:${idOrSlug}`;
  const cached = getCache(cacheKey);
  if (cached) return json(cached, 200, { "X-Cache": "HIT" });

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("is_active", true);

  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);
  const { data, error: err } = await query.maybeSingle();
  if (err) throw err;
  if (!data) return error("Product not found", 404);

  const p: any = data;
  const result = {
    id: p.id, title: p.title, slug: p.slug,
    description: p.description || "",
    price: Number(p.price),
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    currency: p.currency,
    image: p.image_url || "/placeholder.svg",
    images: p.images || [],
    category: p.categories?.name || "Uncategorized",
    category_id: p.category_id,
    rating: Number(p.rating) || 0,
    review_count: p.review_count || 0,
    stock_quantity: p.stock_quantity,
    is_featured: p.is_featured,
    tags: p.tags || [],
    sku: p.sku,
    weight: p.weight,
  };

  setCache(cacheKey, result, 120_000);
  return json(result, 200, { "X-Cache": "MISS", "Cache-Control": "public, max-age=120" });
}

async function handleCategoriesList(supabase: ReturnType<typeof createClient>) {
  const cacheKey = "categories:all";
  const cached = getCache(cacheKey);
  if (cached) return json(cached, 200, { "X-Cache": "HIT" });

  const { data, error: err } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, parent_id")
    .order("name");
  if (err) throw err;

  // Cache for 10 minutes (categories change rarely)
  setCache(cacheKey, data || [], 600_000);
  return json(data || [], 200, { "X-Cache": "MISS", "Cache-Control": "public, max-age=600" });
}

async function handleCouponValidate(supabase: ReturnType<typeof createClient>, body: { code: string; subtotal: number }) {
  if (!body.code || typeof body.subtotal !== "number") return error("Invalid request");

  const code = body.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(code)) return error("Invalid coupon format");

  const { data, error: err } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (err || !data) return error("Coupon not found", 404);

  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) return error("Coupon not yet active");
  if (data.expires_at && new Date(data.expires_at) < now) return error("Coupon expired");
  if (data.max_uses && (data.used_count || 0) >= data.max_uses) return error("Coupon usage limit reached");
  if (data.min_order_amount && body.subtotal < Number(data.min_order_amount)) {
    return error(`Minimum order amount: ${data.min_order_amount}`);
  }

  const discount = data.discount_type === "percentage"
    ? (body.subtotal * Number(data.discount_value)) / 100
    : Number(data.discount_value);

  return json({
    valid: true,
    code: data.code,
    discount_type: data.discount_type,
    discount_value: Number(data.discount_value),
    calculated_discount: Math.min(discount, body.subtotal),
  });
}

async function handleOrdersList(supabase: ReturnType<typeof createClient>, userId: string, params: Record<string, string>) {
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = Math.min(50, parseInt(params.limit || "10"));
  const offset = (page - 1) * limit;

  const { data, error: err, count } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total, currency, created_at, shipping_method", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (err) throw err;

  return json({
    orders: data || [],
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  });
}

async function handleHealthCheck() {
  return json({
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    cache_size: cache.size,
  });
}

// ─── Main router ───
async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);

  let body: Record<string, any> = {};
  let route = "";

  if (req.method === "POST") {
    body = await req.json();
    route = body.route || "";
  } else {
    route = url.searchParams.get("route") || "";
  }

  if (!route) return error("Missing route parameter");

  // Rate limiting
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  const rlKey = `${route}:${clientIP}`;
  const rlCfg = rlConfigs[route] || rlConfigs.default;
  const rl = checkRate(rlKey, rlCfg);
  if (!rl.ok) {
    await logEvent({ ts: new Date().toISOString(), level: "warn", route, error: "rate_limited" });
    return json({ error: "Too many requests" }, 429, { "X-RateLimit-Remaining": "0" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const createPublicClient = () => createClient(supabaseUrl, serviceKey, {
    global: { headers: {} },
    db: { schema: 'public' },
  });

  // Retry wrapper for transient DB errors
  const MAX_RETRIES = 2;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const publicReadClient = createPublicClient();

      let response: Response;

      switch (route) {
        case "health":
          response = await handleHealthCheck();
          break;
        case "products.list":
          response = await handleProductsList(publicReadClient, body.params || {});
          break;
        case "products.detail":
          if (!body.id) return error("Missing product id/slug");
          response = await handleProductDetail(publicReadClient, body.id);
          break;
        case "categories.list":
          response = await handleCategoriesList(publicReadClient);
          break;
        case "coupons.validate":
          response = await handleCouponValidate(publicReadClient, body);
          break;
        case "orders.list": {
          const auth = await authenticate(req);
          if (!auth) return error("Unauthorized", 401);
          const authClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: req.headers.get("Authorization")! } },
          });
          response = await handleOrdersList(authClient, auth.userId, body.params || {});
          break;
        }
        case "cache.invalidate": {
          const auth = await authenticate(req);
          if (!auth || auth.role !== "admin") return error("Forbidden", 403);
          const pattern = body.pattern || "";
          let cleared = 0;
          for (const key of cache.keys()) {
            if (!pattern || key.startsWith(pattern)) {
              cache.delete(key);
              cleared++;
            }
          }
          response = json({ cleared, message: `Invalidated ${cleared} cache entries` });
          break;
        }
        default:
          response = error(`Unknown route: ${route}`, 404);
      }

      const duration = Date.now() - startTime;
      await logEvent({
        ts: new Date().toISOString(),
        level: "info",
        route,
        durationMs: duration,
        meta: { status: response.status, attempt },
      });

      return response;

    } catch (err: unknown) {
      lastError = err;
      let message = err instanceof Error ? err.message : String(err);
      const isTransient = message.includes("<!DOCTYPE") || message.includes("SSL") || message.includes("525") || message.includes("fetch failed") || message.includes("connection");

      if (isTransient && attempt < MAX_RETRIES) {
        // Wait before retry (200ms, 600ms)
        await new Promise(r => setTimeout(r, 200 * (attempt + 1) * (attempt + 1)));
        continue;
      }

      if (isTransient) message = "Database temporarily unavailable. Please retry.";

      console.error(`[api-gateway] Error (attempt ${attempt}):`, message);
      await logEvent({
        ts: new Date().toISOString(),
        level: "error",
        route,
        durationMs: Date.now() - startTime,
        error: message,
      });
      return json({ error: message }, 503);
    }
  }

  return json({ error: "Unexpected error" }, 500);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return handleRequest(req);
});
