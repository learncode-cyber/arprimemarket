const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action } = body;

    // ─── PERSIST CART (called from frontend) ───
    if (action === "persist_cart") {
      const { user_id, session_id, email, cart_items, subtotal, currency } = body;

      // Upsert: find existing active cart for this user/session
      const matchCol = user_id ? "user_id" : "session_id";
      const matchVal = user_id || session_id;

      const { data: existing } = await admin
        .from("abandoned_carts")
        .select("id")
        .eq(matchCol, matchVal)
        .eq("is_recovered", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await admin.from("abandoned_carts").update({
          cart_items,
          subtotal,
          currency,
          email: email || null,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
        return json({ success: true, cart_id: existing.id });
      }

      const { data: newCart, error } = await admin.from("abandoned_carts").insert({
        user_id: user_id || null,
        session_id: session_id || null,
        email: email || null,
        cart_items,
        subtotal,
        currency,
        last_activity_at: new Date().toISOString(),
      }).select("id").single();

      if (error) throw error;
      return json({ success: true, cart_id: newCart.id });
    }

    // ─── MARK RECOVERED (called after checkout) ───
    if (action === "mark_recovered") {
      const { user_id, session_id, order_id } = body;
      const matchCol = user_id ? "user_id" : "session_id";
      const matchVal = user_id || session_id;

      await admin.from("abandoned_carts").update({
        is_recovered: true,
        recovered_at: new Date().toISOString(),
        recovered_order_id: order_id || null,
      }).eq(matchCol, matchVal).eq("is_recovered", false);

      return json({ success: true });
    }

    // ─── PROCESS REMINDERS (called by cron) ───
    if (action === "process_reminders") {
      if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

      const now = new Date();
      const tiers = [
        { tier: 1, minAgeMinutes: 60, label: "1 hour" },
        { tier: 2, minAgeMinutes: 360, label: "6 hours" },
        { tier: 3, minAgeMinutes: 1440, label: "24 hours" },
      ];

      let totalSent = 0;

      for (const t of tiers) {
        const cutoff = new Date(now.getTime() - t.minAgeMinutes * 60 * 1000).toISOString();

        // Find abandoned carts older than cutoff, not recovered, with email
        const { data: carts } = await admin
          .from("abandoned_carts")
          .select("id, email, cart_items, subtotal, currency, recovery_token")
          .eq("is_recovered", false)
          .not("email", "is", null)
          .lt("last_activity_at", cutoff)
          .limit(50);

        if (!carts || carts.length === 0) continue;

        for (const cart of carts) {
          // Check if this tier reminder was already sent
          const { data: existingLog } = await admin
            .from("cart_reminder_logs")
            .select("id")
            .eq("abandoned_cart_id", cart.id)
            .eq("reminder_tier", t.tier)
            .maybeSingle();

          if (existingLog) continue;

          // Build recovery link
          const recoveryUrl = `https://arprimemarket.lovable.app/cart?recovery=${cart.recovery_token}`;

          // Build item list
          const items = (cart.cart_items as any[]) || [];
          const itemsHtml = items.slice(0, 5).map((i: any) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${i.title || i.product?.title || "Item"}</td><td style="text-align:right;padding:8px 0;border-bottom:1px solid #f0f0f0">×${i.quantity || 1}</td></tr>`
          ).join("");

          const subject = t.tier === 1
            ? "You left something behind! 🛒"
            : t.tier === 2
            ? "Your cart is waiting for you ⏳"
            : "Last chance! Your cart expires soon 🔥";

          const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">🛒 You left items in your cart!</h1>
    <p style="color:#e0e7ff;margin:0;font-size:14px">Complete your purchase before they're gone</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
    <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:right">
      <p style="margin:0;font-size:18px;font-weight:700;color:#1e293b">Total: ৳${Number(cart.subtotal).toLocaleString()}</p>
    </div>
  </div>
  <div style="text-align:center;margin-bottom:24px">
    <a href="${recoveryUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:600;font-size:16px">Complete Your Order →</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px">AR Prime Market • Your trusted shopping destination</p>
</div>
</body></html>`;

          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: "AR Prime Market <onboarding@resend.dev>",
                to: [cart.email],
                subject,
                html,
              }),
            });

            const status = res.ok ? "sent" : "failed";
            const errMsg = res.ok ? null : await res.text();

            await admin.from("cart_reminder_logs").insert({
              abandoned_cart_id: cart.id,
              reminder_tier: t.tier,
              email_to: cart.email,
              status,
              error_message: errMsg,
            });

            // Also log in email_logs
            await admin.from("email_logs").insert({
              email_type: "cart_recovery",
              recipient: cart.email,
              subject,
              abandoned_cart_id: cart.id,
              status,
              error_message: errMsg,
            });

            if (res.ok) totalSent++;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown";
            await admin.from("cart_reminder_logs").insert({
              abandoned_cart_id: cart.id,
              reminder_tier: t.tier,
              email_to: cart.email,
              status: "failed",
              error_message: msg,
            });
          }
        }
      }

      return json({ success: true, reminders_sent: totalSent });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[cart-recovery]", msg);
    return json({ error: msg }, 500);
  }
});
