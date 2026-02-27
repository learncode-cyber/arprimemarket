import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// ─── Alert helper ───
async function createAlert(supabase: any, orderId: string, type: string, title: string, message?: string) {
  await supabase.from("order_alerts").insert({
    order_id: orderId,
    alert_type: type,
    title,
    message,
  });
}

// ─── Supplier adapter (reused from supplier-sync) ───
async function forwardToSupplier(apiUrl: string, apiKey: string, order: any) {
  const res = await fetch(`${apiUrl}/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(`Supplier API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { externalOrderId: String(data.id || data.order_id || data.external_order_id) };
}

async function getSupplierOrderStatus(apiUrl: string, apiKey: string, externalOrderId: string) {
  const res = await fetch(`${apiUrl}/orders/${externalOrderId}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  const data = await res.json();
  return {
    status: data.status || "unknown",
    trackingNumber: data.tracking_number || data.trackingNumber,
    carrier: data.carrier || data.shipping_carrier,
  };
}

// ─── 1. Auto-forward new order to supplier ───
async function processNewOrder(supabase: any, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(supplier_url, supplier_price, category_id))")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Order not found");

  // Check if already forwarded
  if (order.auto_forwarded) return { status: "already_forwarded", orderId };

  // Find suppliers for order items (via supplier_products linkage)
  const productIds = order.order_items
    .filter((i: any) => i.product_id)
    .map((i: any) => i.product_id);

  if (!productIds.length) {
    await supabase.from("orders").update({ status: "processing" }).eq("id", orderId);
    return { status: "no_supplier_products", orderId };
  }

  // Get supplier mappings
  const { data: supplierProducts } = await supabase
    .from("supplier_products")
    .select("product_id, supplier_id, suppliers(id, name, api_url, api_type, api_key_secret, auto_forward_orders)")
    .in("product_id", productIds)
    .eq("is_imported", true);

  if (!supplierProducts?.length) {
    await supabase.from("orders").update({ status: "processing" }).eq("id", orderId);
    return { status: "no_supplier_mapping", orderId };
  }

  // Group items by supplier
  const supplierGroups = new Map<string, { supplier: any; items: any[] }>();
  for (const sp of supplierProducts as any[]) {
    const sid = sp.supplier_id;
    if (!supplierGroups.has(sid)) {
      supplierGroups.set(sid, { supplier: sp.suppliers, items: [] });
    }
    const orderItem = order.order_items.find((oi: any) => oi.product_id === sp.product_id);
    if (orderItem) supplierGroups.get(sid)!.items.push(orderItem);
  }

  const results: any[] = [];
  let allForwarded = true;

  for (const [supplierId, group] of supplierGroups) {
    const { supplier, items } = group;

    // Only auto-forward if supplier has it enabled and has API URL
    if (!supplier.auto_forward_orders || !supplier.api_url) {
      // Create supplier order record as pending (manual)
      await supabase.from("supplier_orders").insert({
        order_id: orderId,
        supplier_id: supplierId,
        status: "pending",
      });
      await createAlert(supabase, orderId, "info", "Manual forwarding required",
        `Supplier "${supplier.name}" needs manual order forwarding.`);
      allForwarded = false;
      results.push({ supplierId, status: "manual_required" });
      continue;
    }

    try {
      const apiKey = supplier.api_key_secret ? (Deno.env.get(supplier.api_key_secret) || "") : "";
      const forwardPayload = {
        order_number: order.order_number,
        shipping_name: order.shipping_name,
        shipping_phone: order.shipping_phone,
        shipping_email: order.shipping_email,
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_country: order.shipping_country,
        shipping_postal_code: order.shipping_postal_code,
        items: items.map((i: any) => ({
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          product_id: i.product_id,
        })),
        total: order.total,
        currency: order.currency,
      };

      const result = await forwardToSupplier(supplier.api_url, apiKey, forwardPayload);

      await supabase.from("supplier_orders").insert({
        order_id: orderId,
        supplier_id: supplierId,
        external_order_id: result.externalOrderId,
        status: "forwarded",
        forwarded_at: new Date().toISOString(),
      });

      results.push({ supplierId, status: "forwarded", externalOrderId: result.externalOrderId });
    } catch (err: unknown) {
      allForwarded = false;
      const msg = err instanceof Error ? err.message : "Unknown error";
      
      await supabase.from("supplier_orders").insert({
        order_id: orderId,
        supplier_id: supplierId,
        status: "failed",
        notes: msg,
      });

      await createAlert(supabase, orderId, "error", "Supplier forwarding failed",
        `Failed to forward to "${supplier.name}": ${msg}`);
      
      results.push({ supplierId, status: "failed", error: msg });
    }
  }

  // Update order
  await supabase.from("orders").update({
    status: "processing",
    is_dropship: true,
    auto_forwarded: allForwarded,
    forwarded_at: new Date().toISOString(),
  }).eq("id", orderId);

  return { status: allForwarded ? "fully_forwarded" : "partially_forwarded", results };
}

// ─── 2. Sync tracking & shipping updates ───
async function syncTrackingUpdates(supabase: any) {
  const { data: pendingOrders } = await supabase
    .from("supplier_orders")
    .select("*, suppliers(api_url, api_type, api_key_secret, name)")
    .not("external_order_id", "is", null)
    .in("status", ["forwarded", "processing", "shipped", "in_transit"]);

  if (!pendingOrders?.length) return { synced: 0, message: "No orders to sync" };

  let synced = 0, failed = 0;
  const errors: any[] = [];

  for (const so of pendingOrders as any[]) {
    try {
      if (!so.suppliers?.api_url) continue;
      const apiKey = so.suppliers.api_key_secret ? (Deno.env.get(so.suppliers.api_key_secret) || "") : "";
      const status = await getSupplierOrderStatus(so.suppliers.api_url, apiKey, so.external_order_id);

      const updates: any = { status: status.status, updated_at: new Date().toISOString() };
      if (status.trackingNumber) updates.tracking_number = status.trackingNumber;
      if (status.carrier) updates.shipping_carrier = status.carrier;

      await supabase.from("supplier_orders").update(updates).eq("id", so.id);

      // Update main order tracking
      const orderUpdates: any = {};
      if (status.trackingNumber) orderUpdates.tracking_number = status.trackingNumber;

      // Map supplier status to order status
      const statusMap: Record<string, string> = {
        shipped: "shipped",
        in_transit: "shipped",
        out_for_delivery: "out_for_delivery",
        delivered: "delivered",
        cancelled: "cancelled",
      };
      
      if (statusMap[status.status]) {
        orderUpdates.status = statusMap[status.status];
      }

      if (status.status === "delivered") {
        orderUpdates.delivered_at = new Date().toISOString();
        await createAlert(supabase, so.order_id, "success", "Order delivered",
          `Order delivered via ${status.carrier || "carrier"}.`);
      }

      if (Object.keys(orderUpdates).length > 0) {
        await supabase.from("orders").update(orderUpdates).eq("id", so.order_id);
      }

      synced++;
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : "Unknown";
      errors.push({ order_id: so.order_id, error: msg });
      
      await createAlert(supabase, so.order_id, "warning", "Tracking sync failed", msg);
    }
  }

  return { synced, failed, errors, total: pendingOrders.length };
}

// ─── 3. Payment verification sync ───
async function syncPaymentVerification(supabase: any) {
  // Find orders with confirmed payment transactions but unpaid order status
  const { data: confirmed } = await supabase
    .from("payment_transactions")
    .select("order_id, amount, status")
    .eq("status", "confirmed");

  if (!confirmed?.length) return { updated: 0 };

  let updated = 0;
  for (const tx of confirmed) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("id", tx.order_id)
      .neq("payment_status", "paid")
      .maybeSingle();

    if (order) {
      await supabase.from("orders").update({ payment_status: "paid" }).eq("id", order.id);
      await createAlert(supabase, order.id, "success", "Payment verified",
        `Payment of ${tx.amount} confirmed.`);
      updated++;
    }
  }

  return { updated };
}

// ─── 4. Get alerts ───
async function getAlerts(supabase: any, orderId?: string, unresolvedOnly = true) {
  let query = supabase.from("order_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (orderId) query = query.eq("order_id", orderId);
  if (unresolvedOnly) query = query.eq("is_resolved", false);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── 5. Resolve alert ───
async function resolveAlert(supabase: any, alertId: string, userId: string) {
  await supabase.from("order_alerts").update({
    is_resolved: true,
    resolved_by: userId,
    resolved_at: new Date().toISOString(),
  }).eq("id", alertId);
  return { resolved: true };
}

// ─── 6. Admin override — manually set order status ───
async function adminOverride(supabase: any, orderId: string, updates: {
  status?: string;
  payment_status?: string;
  tracking_number?: string;
  notes?: string;
}) {
  const { error } = await supabase.from("orders").update({
    ...updates,
    ...(updates.status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
  }).eq("id", orderId);

  if (error) throw error;
  
  await createAlert(supabase, orderId, "info", "Admin override",
    `Order updated by admin: ${JSON.stringify(updates)}`);

  return { success: true };
}

// ─── 7. Process all pending orders (batch) ───
async function processPendingOrders(supabase: any) {
  const { data: pending } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "pending")
    .eq("auto_forwarded", false)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: true })
    .limit(20);

  if (!pending?.length) return { processed: 0, message: "No pending orders" };

  const results: any[] = [];
  for (const order of pending) {
    try {
      const result = await processNewOrder(supabase, order.id);
      results.push({ orderId: order.id, ...result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown";
      results.push({ orderId: order.id, status: "error", error: msg });
      await createAlert(supabase, order.id, "error", "Auto-processing failed", msg);
    }
  }

  return { processed: results.length, results };
}

// ─── Auth helper ───
async function requireAdmin(req: Request, supabase: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized");

  const userId = data.claims.sub as string;
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) throw new Error("Admin access required");
  return userId;
}

// ─── Main router ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Require admin authentication
    try {
      await requireAdmin(req, supabase);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unauthorized";
      return json({ error: msg }, msg === "Admin access required" ? 403 : 401);
    }

    const body = await req.json();
    const { action, order_id, alert_id, user_id, updates } = body;

    switch (action) {
      case "process_order":
        if (!order_id) return json({ error: "order_id required" }, 400);
        return json(await processNewOrder(supabase, order_id));

      case "process_pending":
        return json(await processPendingOrders(supabase));

      case "sync_tracking":
        return json(await syncTrackingUpdates(supabase));

      case "sync_payments":
        return json(await syncPaymentVerification(supabase));

      case "get_alerts":
        return json(await getAlerts(supabase, order_id, body.unresolved_only !== false));

      case "resolve_alert":
        if (!alert_id || !user_id) return json({ error: "alert_id and user_id required" }, 400);
        return json(await resolveAlert(supabase, alert_id, user_id));

      case "admin_override":
        if (!order_id || !updates) return json({ error: "order_id and updates required" }, 400);
        return json(await adminOverride(supabase, order_id, updates));

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[order-processor] Error:", message);
    return json({ error: message }, 500);
  }
});
