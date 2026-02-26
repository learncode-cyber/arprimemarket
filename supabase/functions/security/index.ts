import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limit store (per isolate lifecycle)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const configs: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 },     // 3 per hour
  order: { maxRequests: 10, windowMs: 60 * 60 * 1000 },       // 10 per hour
  coupon: { maxRequests: 20, windowMs: 60 * 60 * 1000 },      // 20 per hour
  general: { maxRequests: 100, windowMs: 60 * 1000 },          // 100 per min
};

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetAt - now };
}

// Fraud detection scoring
function calculateFraudScore(orderData: {
  total: number;
  itemCount: number;
  userOrderCount: number;
  accountAgeHours: number;
  differentShippingName: boolean;
  highValueOrder: boolean;
}): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  // New account + high value order
  if (orderData.accountAgeHours < 1 && orderData.total > 5000) {
    score += 30;
    flags.push("new_account_high_value");
  }

  // Very high value
  if (orderData.total > 50000) {
    score += 20;
    flags.push("very_high_value");
  }

  // Too many items
  if (orderData.itemCount > 20) {
    score += 15;
    flags.push("excessive_items");
  }

  // Rapid ordering (more than 5 orders in short time)
  if (orderData.userOrderCount > 5) {
    score += 25;
    flags.push("rapid_ordering");
  }

  // Different shipping name
  if (orderData.differentShippingName) {
    score += 10;
    flags.push("shipping_name_mismatch");
  }

  return { score: Math.min(score, 100), flags };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const authHeader = req.headers.get("Authorization");

    // Rate limit check
    if (action === "check-rate-limit") {
      const endpoint = data?.endpoint || "general";
      const config = configs[endpoint] || configs.general;
      const identifier = data?.userId || clientIP;
      const key = `${endpoint}:${identifier}`;
      const result = checkRateLimit(key, config);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.allowed ? 200 : 429,
      });
    }

    // Fraud detection
    if (action === "check-fraud") {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      if (claimsErr || !claims?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claims.claims.sub;
      const userCreatedAt = claims.claims.iat || 0;
      const accountAgeHours = (Date.now() / 1000 - userCreatedAt) / 3600;

      // Count recent orders
      const { count: recentOrderCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 3600000).toISOString());

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const fraudResult = calculateFraudScore({
        total: data.total || 0,
        itemCount: data.itemCount || 0,
        userOrderCount: recentOrderCount || 0,
        accountAgeHours,
        differentShippingName: profile?.full_name?.toLowerCase() !== data.shippingName?.toLowerCase(),
        highValueOrder: (data.total || 0) > 10000,
      });

      return new Response(JSON.stringify({
        ...fraudResult,
        action: fraudResult.score >= 70 ? "block" : fraudResult.score >= 40 ? "review" : "allow",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Session validation
    if (action === "validate-session") {
      if (!authHeader) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claims, error } = await supabase.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );

      return new Response(JSON.stringify({
        valid: !error && !!claims?.claims,
        userId: claims?.claims?.sub || null,
        expiresAt: claims?.claims?.exp || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
