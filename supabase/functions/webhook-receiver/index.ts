import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyHmac(payload: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const rawBody = await req.text();
    if (rawBody.length > 1_048_576) {
      return new Response(JSON.stringify({ error: "Payload too large (max 1MB)" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("x-webhook-signature") || "";
    const body = JSON.parse(rawBody);
    const { action, data, webhook_secret } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action field" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC if signature provided
    if (signature && webhook_secret) {
      const valid = await verifyHmac(rawBody, signature, webhook_secret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid HMAC signature" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let result: Record<string, unknown> = { success: true };

    switch (action) {
      case "update_order_status": {
        const { order_id, status, tracking_number } = data;
        if (!order_id || !status) throw new Error("order_id and status required");
        const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
        if (tracking_number) update.tracking_number = tracking_number;
        const { error } = await supabase.from("orders").update(update).eq("id", order_id);
        if (error) throw error;
        result = { success: true, message: `Order ${order_id} updated to ${status}` };
        break;
      }
      case "add_blog_post": {
        const { title, content, slug, excerpt, author_name, is_published } = data;
        if (!title || !content || !slug) throw new Error("title, content, slug required");
        const { error } = await supabase.from("blog_posts").insert({
          title, content, slug, excerpt: excerpt || "", author_name: author_name || "AR Prime Team",
          is_published: is_published ?? false,
        });
        if (error) throw error;
        result = { success: true, message: `Blog post '${title}' created` };
        break;
      }
      case "update_stock": {
        const { product_id, stock_quantity } = data;
        if (!product_id || stock_quantity === undefined) throw new Error("product_id and stock_quantity required");
        const { error } = await supabase.from("products").update({ stock_quantity, updated_at: new Date().toISOString() }).eq("id", product_id);
        if (error) throw error;
        result = { success: true, message: `Stock updated for product ${product_id}` };
        break;
      }
      case "send_notification": {
        const { type, recipient, subject, message } = data;
        if (!recipient || !subject) throw new Error("recipient and subject required");
        // Log as email and let send-email handle it
        await supabase.from("email_logs").insert({
          email_type: type || "notification", recipient, subject, status: "queued",
        });
        result = { success: true, message: `Notification queued for ${recipient}` };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook-receiver error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
