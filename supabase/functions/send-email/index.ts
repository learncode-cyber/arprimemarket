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

async function sendEmail(apiKey: string, payload: EmailPayload) {
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
    console.error("Resend error:", res.status, err);
    throw new Error(`Email send failed: ${res.status}`);
  }

  return await res.json();
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

// ─── Main Router ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "contact_form": {
        if (!body.name || !body.email || !body.message) {
          return json({ error: "name, email, and message are required" }, 400);
        }
        const payload = contactFormTemplate(body);
        const result = await sendEmail(RESEND_API_KEY, payload);
        return json({ success: true, id: result.id });
      }

      case "order_confirmation": {
        const payload = orderConfirmationTemplate(body.order);
        const result = await sendEmail(RESEND_API_KEY, payload);
        return json({ success: true, id: result.id });
      }

      case "shipping_update": {
        const payload = shippingUpdateTemplate(body.order);
        const result = await sendEmail(RESEND_API_KEY, payload);
        return json({ success: true, id: result.id });
      }

      case "delivery_confirmation": {
        const payload = deliveryConfirmationTemplate(body.order);
        const result = await sendEmail(RESEND_API_KEY, payload);
        return json({ success: true, id: result.id });
      }

      case "custom": {
        if (!body.to || !body.subject || !body.html) {
          return json({ error: "to, subject, and html required" }, 400);
        }
        const result = await sendEmail(RESEND_API_KEY, {
          to: body.to,
          subject: body.subject,
          html: body.html,
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
