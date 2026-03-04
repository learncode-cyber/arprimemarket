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

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(apiKey: string, payload: EmailPayload, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AR Prime Market <onboarding@resend.dev>",
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Resend error (attempt ${attempt + 1}):`, res.status, err);
        if (attempt === retries) throw new Error(`Email send failed: ${res.status}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Email send exhausted retries");
}

async function logEmail(action: string, payload: EmailPayload, result: any, orderId?: string) {
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("email_logs").insert({
      email_type: action,
      recipient: payload.to,
      subject: payload.subject,
      order_id: orderId || null,
      status: result?.id ? "sent" : "failed",
      error_message: result?.error || null,
    });
  } catch (err) {
    console.warn("[email-log]", err);
  }
}

// ─── Email Templates ───

function orderConfirmationTemplate(order: any): EmailPayload {
  const items = (order.items || [])
    .map((i: any) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${i.title}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right">৳${Number(i.total).toLocaleString()}</td></tr>`)
    .join("");

  return {
    to: order.email,
    subject: `Order Confirmed — ${order.order_number}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">✓ Order Confirmed!</h1>
    <p style="color:#a0aec0;margin:0;font-size:14px">Thank you for your order, ${order.name}!</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px">
    <p style="margin:0 0 4px;color:#64748b;font-size:12px">ORDER NUMBER</p>
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b">${order.order_number}</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:12px">Item</th><th style="text-align:center;padding:8px 0;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:12px">Qty</th><th style="text-align:right;padding:8px 0;border-bottom:2px solid #e2e8f0;color:#64748b;font-size:12px">Total</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:right">
      <p style="margin:0;color:#64748b;font-size:12px">Subtotal: ৳${Number(order.subtotal).toLocaleString()}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:12px">Shipping: ৳${Number(order.shipping_cost).toLocaleString()}</p>
      <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#1e293b">Total: ৳${Number(order.total).toLocaleString()}</p>
    </div>
  </div>
  <div style="text-align:center;margin-bottom:24px">
    <a href="https://arprimemarket.lovable.app/track-order" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Track Your Order</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px">AR Prime Market • Your trusted shopping destination</p>
</div>
</body></html>`,
  };
}

function shippingUpdateTemplate(order: any): EmailPayload {
  return {
    to: order.email,
    subject: `Your order ${order.order_number} has been shipped! 🚀`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">📦 Your Order is on its way!</h1>
    <p style="color:#e0f2fe;margin:0;font-size:14px">Order ${order.order_number}</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px">
    ${order.tracking_number ? `<p style="margin:0 0 4px;color:#64748b;font-size:12px">TRACKING NUMBER</p><p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b;font-family:monospace">${order.tracking_number}</p>` : ""}
    ${order.carrier ? `<p style="margin:0;color:#64748b;font-size:12px">Carrier: <strong style="color:#1e293b">${order.carrier}</strong></p>` : ""}
    <p style="margin:8px 0 0;color:#64748b;font-size:12px">Shipping to: <strong style="color:#1e293b">${order.name}</strong></p>
    <p style="margin:4px 0 0;color:#64748b;font-size:12px">${order.address || ""}, ${order.city || ""}</p>
  </div>
  <div style="text-align:center;margin-bottom:24px">
    <a href="https://arprimemarket.lovable.app/track-order" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Track Your Order</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px">AR Prime Market • Your trusted shopping destination</p>
</div>
</body></html>`,
  };
}

function deliveryConfirmationTemplate(order: any): EmailPayload {
  return {
    to: order.email,
    subject: `Your order ${order.order_number} has been delivered! ✅`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#22c55e,#10b981);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">🎉 Order Delivered!</h1>
    <p style="color:#dcfce7;margin:0;font-size:14px">Your order ${order.order_number} has arrived</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <p style="margin:0 0 16px;color:#1e293b;font-size:16px">We hope you love your purchase!</p>
    <p style="margin:0;color:#64748b;font-size:13px">If you have any issues, contact our support team.</p>
  </div>
  <div style="text-align:center;margin-bottom:24px">
    <a href="https://arprimemarket.lovable.app" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Shop Again</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px">AR Prime Market • Your trusted shopping destination</p>
</div>
</body></html>`,
  };
}

function contactFormTemplate(data: { name: string; email: string; subject?: string; message: string }): EmailPayload {
  return {
    to: "biz.arprimemarket@gmail.com",
    subject: data.subject ? `[Contact Form] ${data.subject}` : `[Contact Form] New message from ${data.name}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#ec4899,#f43f5e);border-radius:16px 16px 0 0;padding:24px;text-align:center">
    <h1 style="color:#ffffff;margin:0;font-size:20px">📩 New Contact Form Message</h1>
  </div>
  <div style="background:#f8fafc;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:24px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:80px"><strong>Name:</strong></td><td style="padding:8px 0;font-size:14px;color:#1e293b">${data.name}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px"><strong>Email:</strong></td><td style="padding:8px 0;font-size:14px"><a href="mailto:${data.email}" style="color:#ec4899">${data.email}</a></td></tr>
      ${data.subject ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px"><strong>Subject:</strong></td><td style="padding:8px 0;font-size:14px;color:#1e293b">${data.subject}</td></tr>` : ""}
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px"><strong>Message:</strong></p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#374151">${data.message.replace(/\n/g, "<br/>")}</p>
  </div>
  <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">Sent from AR Prime Market Contact Form</p>
</div>
</body></html>`,
  };
}

function returnStatusTemplate(data: any): EmailPayload {
  const statusLabels: Record<string, { label: string; color: string; gradient: string; emoji: string }> = {
    approved: { label: "Approved", color: "#dcfce7", gradient: "linear-gradient(135deg,#3b82f6,#6366f1)", emoji: "✅" },
    rejected: { label: "Rejected", color: "#fecaca", gradient: "linear-gradient(135deg,#ef4444,#dc2626)", emoji: "❌" },
    refunded: { label: "Refunded", color: "#dcfce7", gradient: "linear-gradient(135deg,#22c55e,#10b981)", emoji: "💰" },
  };
  const s = statusLabels[data.status] || statusLabels.approved;

  return {
    to: data.email,
    subject: `Return ${s.label} — ${data.return_number} ${s.emoji}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:${s.gradient};border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">${s.emoji} Return ${s.label}</h1>
    <p style="color:${s.color};margin:0;font-size:14px">Return ${data.return_number}</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Order</td><td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px">${data.order_number}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Return ID</td><td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px">${data.return_number}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Status</td><td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px;text-transform:capitalize">${data.status}</td></tr>
      ${data.status !== "rejected" ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px">Refund Amount</td><td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px">৳${Number(data.refund_amount).toLocaleString()}</td></tr>` : ""}
    </table>
    ${data.admin_notes ? `<div style="margin-top:16px;padding:12px;background:#fff;border-radius:8px;border:1px solid #e2e8f0"><p style="margin:0 0 4px;color:#64748b;font-size:11px">ADMIN NOTE</p><p style="margin:0;color:#1e293b;font-size:13px">${data.admin_notes}</p></div>` : ""}
  </div>
  <div style="text-align:center;margin-bottom:24px">
    <a href="https://arprimemarket.lovable.app/dashboard" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">View Dashboard</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px">AR Prime Market • Your trusted shopping destination</p>
</div>
</body></html>`,
  };
}

// ─── Auth helper ───
async function requireAuth(req: Request): Promise<string> {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized");
  return data.claims.sub as string;
}

// ─── Main Router ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json();
    const { action } = body;

    // contact_form is public; all other actions require authentication
    if (action !== "contact_form") {
      try {
        await requireAuth(req);
      } catch {
        return json({ error: "Authentication required" }, 401);
      }
    }

    switch (action) {
      case "contact_form": {
        if (!body.name || !body.email || !body.message) {
          return json({ error: "name, email, and message are required" }, 400);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
          return json({ error: "Invalid email format" }, 400);
        }
        const sanitizedName = String(body.name).slice(0, 100);
        const sanitizedMessage = String(body.message).slice(0, 5000);
        const payload = contactFormTemplate({ ...body, name: sanitizedName, message: sanitizedMessage });
        const result = await sendEmail(RESEND_API_KEY, payload);
        return json({ success: true, id: result.id });
      }

      case "order_confirmation": {
        const payload = orderConfirmationTemplate(body.order);
        const result = await sendEmail(RESEND_API_KEY, payload);
        await logEmail("order_confirmation", payload, result, body.order?.id);
        return json({ success: true, id: result.id });
      }

      case "shipping_update": {
        const payload = shippingUpdateTemplate(body.order);
        const result = await sendEmail(RESEND_API_KEY, payload);
        await logEmail("shipping_update", payload, result, body.order?.id);
        return json({ success: true, id: result.id });
      }

      case "delivery_confirmation": {
        const payload = deliveryConfirmationTemplate(body.order);
        const result = await sendEmail(RESEND_API_KEY, payload);
        await logEmail("delivery_confirmation", payload, result, body.order?.id);
        return json({ success: true, id: result.id });
      }

      case "order_cancelled": {
        const order = body.order;
        const cancelPayload: EmailPayload = {
          to: order.email,
          subject: `Your order ${order.order_number} has been cancelled`,
          html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">Order Cancelled</h1>
    <p style="color:#fecaca;margin:0;font-size:14px">Order ${order.order_number}</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <p style="margin:0 0 12px;color:#1e293b;font-size:16px">Your order has been cancelled.</p>
    <p style="margin:0;color:#64748b;font-size:13px">If you didn't request this, please contact support.</p>
  </div>
  <div style="text-align:center"><a href="https://arprimemarket.lovable.app/contact" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Contact Support</a></div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">AR Prime Market</p>
</div></body></html>`,
        };
        const result = await sendEmail(RESEND_API_KEY, cancelPayload);
        await logEmail("order_cancelled", cancelPayload, result, order?.id);
        return json({ success: true, id: result.id });
      }

      case "payment_received": {
        const order = body.order;
        const payPayload: EmailPayload = {
          to: order.email,
          subject: `Payment received for ${order.order_number} ✅`,
          html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:24px">💰 Payment Confirmed</h1>
    <p style="color:#dcfce7;margin:0;font-size:14px">Order ${order.order_number}</p>
  </div>
  <div style="background:#f8fafc;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <p style="margin:0 0 8px;color:#1e293b;font-size:16px">We've received your payment of ৳${Number(order.total).toLocaleString()}</p>
    <p style="margin:0;color:#64748b;font-size:13px">Your order is now being processed.</p>
  </div>
  <div style="text-align:center"><a href="https://arprimemarket.lovable.app/track-order" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px">Track Order</a></div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">AR Prime Market</p>
</div></body></html>`,
        };
        const result = await sendEmail(RESEND_API_KEY, payPayload);
        await logEmail("payment_received", payPayload, result, order?.id);
        return json({ success: true, id: result.id });
      }

      case "return_status_update": {
        const returnData = body.returnRequest;
        if (!returnData?.email) return json({ error: "No email provided" }, 400);
        const payload = returnStatusTemplate(returnData);
        const result = await sendEmail(RESEND_API_KEY, payload);
        await logEmail("return_status_update", payload, result);
        return json({ success: true, id: result.id });
      }

      case "custom": {
        // Restrict custom emails to admin role only
        const userId = await requireAuth(req);
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();
        if (!roleData) return json({ error: "Admin access required" }, 403);

        if (!body.to || !body.subject || !body.html) {
          return json({ error: "to, subject, and html required" }, 400);
        }

        // Validate recipient email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.to)) {
          return json({ error: "Invalid recipient email" }, 400);
        }

        // Strip dangerous tags
        const sanitizedHtml = String(body.html)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
          .replace(/<object\b[^>]*>.*?<\/object>/gi, "")
          .replace(/<embed\b[^>]*\/?>/gi, "")
          .replace(/<form\b[^>]*>.*?<\/form>/gi, "")
          .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
          .replace(/\son\w+\s*=\s*[^\s>]*/gi, "");

        console.log(`[AUDIT] Custom email sent by admin ${userId} to ${body.to} subject: ${String(body.subject).slice(0, 50)}`);

        const result = await sendEmail(RESEND_API_KEY, {
          to: body.to,
          subject: String(body.subject).slice(0, 200),
          html: sanitizedHtml,
        });
        return json({ success: true, id: result.id });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-email]", msg);
    return json({ error: msg }, 500);
  }
});
