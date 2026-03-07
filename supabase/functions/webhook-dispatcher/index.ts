import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function deliverWebhook(
  supabase: ReturnType<typeof createClient>,
  webhook: { id: string; url: string; secret: string; retry_count: number },
  event: string,
  payload: Record<string, unknown>,
  attempt = 1
): Promise<{ success: boolean; statusCode?: number }> {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
  const signature = await signPayload(body, webhook.secret);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseBody = await response.text().catch(() => "");
    const success = response.status >= 200 && response.status < 300;

    await supabase.from("webhook_delivery_logs").insert({
      webhook_id: webhook.id, event, payload, response_code: response.status,
      response_body: responseBody.substring(0, 2000), status: success ? "delivered" : "failed",
      attempts: attempt,
      next_retry_at: !success && attempt < webhook.retry_count
        ? new Date(Date.now() + [60000, 300000, 1800000][attempt - 1]).toISOString() : null,
    });

    return { success, statusCode: response.status };
  } catch (e) {
    await supabase.from("webhook_delivery_logs").insert({
      webhook_id: webhook.id, event, payload, response_code: 0,
      response_body: e instanceof Error ? e.message : "Network error",
      status: attempt < webhook.retry_count ? "retrying" : "failed",
      attempts: attempt,
      next_retry_at: attempt < webhook.retry_count
        ? new Date(Date.now() + [60000, 300000, 1800000][attempt - 1]).toISOString() : null,
    });
    return { success: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { event, payload, test_webhook_id } = await req.json();

    if (!event) {
      return new Response(JSON.stringify({ error: "Event is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active webhooks subscribed to this event
    let query = supabase.from("webhooks").select("*").eq("is_active", true).contains("events", [event]);
    if (test_webhook_id) {
      query = supabase.from("webhooks").select("*").eq("id", test_webhook_id);
    }
    const { data: webhooks, error } = await query;
    if (error) throw error;

    const results = await Promise.all(
      (webhooks || []).map(wh => deliverWebhook(supabase, wh, event, payload || {}))
    );

    return new Response(JSON.stringify({
      dispatched: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook-dispatcher error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
