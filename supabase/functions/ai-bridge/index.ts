import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. Validate API Key
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyHash = await hashKey(token);
    const { data: apiKey, error: keyErr } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (keyErr || !apiKey) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Rate limiting
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

    const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
      supabase.from("api_call_logs").select("*", { count: "exact", head: true })
        .eq("api_key_id", apiKey.id).gte("created_at", oneMinuteAgo),
      supabase.from("api_call_logs").select("*", { count: "exact", head: true })
        .eq("api_key_id", apiKey.id).gte("created_at", oneDayAgo),
    ]);

    if ((minuteCount ?? 0) >= apiKey.rate_limit_per_minute) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (per minute)" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
    if ((dayCount ?? 0) >= apiKey.rate_limit_per_day) {
      return new Response(JSON.stringify({ error: "Daily rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
      });
    }

    // 3. Parse request
    const { message, context, source = "external", attachments } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check permissions
    if (!apiKey.permissions.includes("ai")) {
      return new Response(JSON.stringify({ error: "API key lacks 'ai' permission" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Call AI via Lovable AI Gateway (multimodal support)
    const startTime = Date.now();
    const systemPrompt = `You are AR Prime Market's AI assistant. You help with customer queries, product info, orders, and general assistance. ${context ? `Context: ${context}` : ""} Source: ${source}. Be concise and helpful. If images are attached, analyze them thoroughly and provide detailed insights.`;

    if (!lovableKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Detect if attachments contain images for multimodal
    const hasImages = attachments && Array.isArray(attachments) && attachments.some((a: any) => a.type?.startsWith("image/"));
    const modelToUse = hasImages ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";

    // Build user content (multimodal if images present)
    let userContent: any = message;
    if (hasImages) {
      userContent = [
        { type: "text", text: message },
        ...attachments
          .filter((a: any) => a.type?.startsWith("image/"))
          .map((img: { type: string; base64: string }) => ({
            type: "image_url",
            image_url: { url: `data:${img.type};base64,${img.base64}` },
          })),
      ];
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 2048,
      }),
    });

    const latencyMs = Date.now() - startTime;
    let engine = hasImages ? "lovable-gemini-pro" : "lovable-gemini";
    let model = hasImages ? "gemini-2.5-pro" : "gemini-3-flash-preview";
    let reply = "";
    let tokensUsed = 0;
    let fallbackTriggered = false;

    if (aiResponse.ok) {
      const data = await aiResponse.json();
      reply = data.choices?.[0]?.message?.content || "No response generated";
      tokensUsed = (data.usage?.total_tokens) || 0;
    } else if (aiResponse.status === 429 || aiResponse.status === 402) {
      // Fallback: try lighter model (text-only)
      fallbackTriggered = true;
      engine = "lovable-gemini-lite";
      model = "gemini-2.5-flash-lite";
      const fallbackResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: typeof userContent === "string" ? userContent : message },
          ],
          max_tokens: 512,
        }),
      });
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        reply = data.choices?.[0]?.message?.content || "No response generated";
        tokensUsed = (data.usage?.total_tokens) || 0;
      } else {
        const errText = await fallbackResponse.text();
        throw new Error(`All AI engines failed: ${errText}`);
      }
    } else {
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error: ${errText}`);
    }

    // 5. Log call and engine usage
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    await Promise.all([
      supabase.from("api_call_logs").insert({
        api_key_id: apiKey.id, endpoint: "ai-bridge", source, tokens_used: tokensUsed,
        status_code: 200, ip_address: ip,
      }),
      supabase.from("ai_engine_logs").insert({
        engine, model, tokens_input: Math.floor(tokensUsed * 0.3), tokens_output: Math.floor(tokensUsed * 0.7),
        latency_ms: latencyMs, fallback_triggered: fallbackTriggered, source, api_key_id: apiKey.id,
      }),
      supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id),
    ]);

    return new Response(JSON.stringify({
      reply, tokens_used: tokensUsed, source, engine, model, latency_ms: latencyMs,
      multimodal: hasImages, fallback_triggered: fallbackTriggered,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-bridge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
