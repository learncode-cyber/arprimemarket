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

// ─── Sync log helpers ───
async function createLog(supabase: any, supplierId: string, action: string) {
  const { data } = await supabase
    .from("supplier_sync_logs")
    .insert({ supplier_id: supplierId, action, status: "running" })
    .select("id")
    .single();
  return data?.id;
}

async function completeLog(supabase: any, logId: string, status: string, processed: number, failed: number, errors: unknown[] = []) {
  await supabase.from("supplier_sync_logs").update({
    status,
    items_processed: processed,
    items_failed: failed,
    error_details: errors,
    completed_at: new Date().toISOString(),
  }).eq("id", logId);
}

// ─── Supplier API adapter interface ───
interface SupplierAdapter {
  fetchProducts(apiUrl: string, apiKey: string): Promise<ExternalProduct[]>;
  forwardOrder(apiUrl: string, apiKey: string, order: any): Promise<{ externalOrderId: string }>;
  getOrderStatus(apiUrl: string, apiKey: string, externalOrderId: string): Promise<{ status: string; trackingNumber?: string; carrier?: string }>;
}

interface ExternalProduct {
  externalId: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  images?: string[];
  variants?: any[];
  category?: string;
  url?: string;
}

// ─── Generic/Custom API adapter ───
const customAdapter: SupplierAdapter = {
  async fetchProducts(apiUrl, apiKey) {
    const res = await fetch(`${apiUrl}/products`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Supplier API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    // Normalize to our format — expects { products: [...] } or direct array
    const products = Array.isArray(data) ? data : data.products || data.data || [];
    return products.map((p: any) => ({
      externalId: String(p.id || p.external_id || p.sku),
      title: p.title || p.name,
      description: p.description || p.body_html || "",
      price: Number(p.price || p.cost || 0),
      stock: Number(p.stock || p.inventory_quantity || p.stock_quantity || 0),
      imageUrl: p.image_url || p.image || p.thumbnail || null,
      images: p.images || [],
      variants: p.variants || [],
      category: p.category || p.product_type || "",
      url: p.url || "",
    }));
  },

  async forwardOrder(apiUrl, apiKey, order) {
    const res = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error(`Order forward failed: ${res.status}`);
    const data = await res.json();
    return { externalOrderId: String(data.id || data.order_id || data.external_order_id) };
  },

  async getOrderStatus(apiUrl, apiKey, externalOrderId) {
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
  },
};

// ─── Adapter registry (extensible for future suppliers) ───
function getAdapter(_apiType: string): SupplierAdapter {
  // All types use the custom adapter for now — specific adapters can be added here
  // e.g. case "aliexpress": return aliexpressAdapter;
  return customAdapter;
}

// ─── Action handlers ───

async function handleAutoImport(supabase: any, supplierId: string) {
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();
  if (!supplier) throw new Error("Supplier not found");
  if (!supplier.api_url) throw new Error("No API URL configured");

  const apiKey = supplier.api_key_secret ? (Deno.env.get(supplier.api_key_secret) || "") : "";
  const adapter = getAdapter(supplier.api_type);
  const logId = await createLog(supabase, supplierId, "auto_import");

  let processed = 0, failed = 0;
  const errors: unknown[] = [];

  try {
    const externalProducts = await adapter.fetchProducts(supplier.api_url, apiKey);

    for (const ep of externalProducts) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from("supplier_products")
          .select("id")
          .eq("supplier_id", supplierId)
          .eq("external_id", ep.externalId)
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase.from("supplier_products").update({
            external_title: ep.title,
            external_price: ep.price,
            external_stock: ep.stock,
            external_image_url: ep.imageUrl,
            external_images: ep.images || [],
            external_variants: ep.variants || [],
            external_description: ep.description || null,
            external_category: ep.category || null,
            external_url: ep.url || null,
            last_synced_at: new Date().toISOString(),
            sync_status: "synced",
          }).eq("id", existing.id);
        } else {
          // Insert new
          await supabase.from("supplier_products").insert({
            supplier_id: supplierId,
            external_id: ep.externalId,
            external_title: ep.title,
            external_price: ep.price,
            external_stock: ep.stock,
            external_image_url: ep.imageUrl,
            external_images: ep.images || [],
            external_variants: ep.variants || [],
            external_description: ep.description || null,
            external_category: ep.category || null,
            external_url: ep.url || null,
            sync_status: "pending",
          });
        }
        processed++;
      } catch (err: unknown) {
        failed++;
        errors.push({ externalId: ep.externalId, error: err instanceof Error ? err.message : "Unknown" });
      }
    }

    await completeLog(supabase, logId, failed > 0 ? "partial" : "success", processed, failed, errors);
    await supabase.from("suppliers").update({ last_synced_at: new Date().toISOString() }).eq("id", supplierId);

    return { processed, failed, errors, total: externalProducts.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await completeLog(supabase, logId, "failed", processed, failed, [{ error: msg }]);
    throw err;
  }
}

async function handleSyncStock(supabase: any, supplierId?: string) {
  let query = supabase.from("supplier_products").select("*, suppliers(api_url, api_type, api_key_secret)")
    .eq("is_imported", true).not("product_id", "is", null);
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data: items } = await query;
  if (!items?.length) return { synced: 0, message: "No imported products to sync" };

  const logId = supplierId ? await createLog(supabase, supplierId, "sync_stock") : null;
  let synced = 0, failed = 0;
  const errors: unknown[] = [];

  // Group by supplier for batch efficiency
  const bySupplier = new Map<string, typeof items>();
  for (const sp of items) {
    const key = sp.supplier_id;
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    bySupplier.get(key)!.push(sp);
  }

  for (const [sid, sps] of bySupplier) {
    const supplier = (sps[0] as any).suppliers;
    if (supplier?.api_url) {
      try {
        const apiKey = supplier.api_key_secret ? (Deno.env.get(supplier.api_key_secret) || "") : "";
        const adapter = getAdapter(supplier.api_type);
        const externalProducts = await adapter.fetchProducts(supplier.api_url, apiKey);
        const extMap = new Map(externalProducts.map(ep => [ep.externalId, ep]));

        for (const sp of sps) {
          const ext = extMap.get(sp.external_id);
          if (ext) {
            await supabase.from("products").update({ stock_quantity: ext.stock }).eq("id", sp.product_id);
            await supabase.from("supplier_products").update({
              external_stock: ext.stock,
              last_synced_at: new Date().toISOString(),
              sync_status: "synced",
            }).eq("id", sp.id);
            synced++;
          }
        }
      } catch (err: unknown) {
        failed += sps.length;
        errors.push({ supplier_id: sid, error: err instanceof Error ? err.message : "Unknown" });
      }
    } else {
      // Manual suppliers — use stored values
      for (const sp of sps) {
        await supabase.from("products").update({ stock_quantity: sp.external_stock }).eq("id", sp.product_id);
        await supabase.from("supplier_products").update({
          last_synced_at: new Date().toISOString(),
          sync_status: "synced",
        }).eq("id", sp.id);
        synced++;
      }
    }
  }

  if (logId) await completeLog(supabase, logId, failed > 0 ? "partial" : "success", synced, failed, errors);
  return { synced, failed, errors, total: items.length };
}

async function handleSyncPrices(supabase: any, supplierId?: string) {
  let query = supabase.from("supplier_products").select("*, suppliers(markup_percentage, api_url, api_type, api_key_secret)")
    .eq("is_imported", true).not("product_id", "is", null);
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data: items } = await query;
  if (!items?.length) return { synced: 0 };

  const logId = supplierId ? await createLog(supabase, supplierId, "sync_prices") : null;
  let synced = 0, failed = 0;
  const errors: unknown[] = [];

  for (const sp of items as any[]) {
    try {
      const markup = sp.suppliers?.markup_percentage || 30;
      let latestPrice = Number(sp.external_price);

      // Try to get live price from API
      if (sp.suppliers?.api_url) {
        try {
          const apiKey = sp.suppliers.api_key_secret ? (Deno.env.get(sp.suppliers.api_key_secret) || "") : "";
          const adapter = getAdapter(sp.suppliers.api_type);
          const products = await adapter.fetchProducts(sp.suppliers.api_url, apiKey);
          const ext = products.find(p => p.externalId === sp.external_id);
          if (ext) latestPrice = ext.price;
        } catch { /* use stored price as fallback */ }
      }

      const newPrice = Math.round(latestPrice * (1 + markup / 100));
      await supabase.from("products").update({ price: newPrice, supplier_price: latestPrice }).eq("id", sp.product_id);
      await supabase.from("supplier_products").update({
        external_price: latestPrice,
        last_synced_at: new Date().toISOString(),
        sync_status: "synced",
      }).eq("id", sp.id);
      synced++;
    } catch (err: unknown) {
      failed++;
      errors.push({ product_id: sp.product_id, error: err instanceof Error ? err.message : "Unknown" });
    }
  }

  if (logId) await completeLog(supabase, logId, failed > 0 ? "partial" : "success", synced, failed, errors);
  return { synced, failed, errors };
}

async function handleForwardOrder(supabase: any, orderId: string, supplierId: string) {
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();
  if (!supplier) throw new Error("Supplier not found");

  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).single();
  if (!order) throw new Error("Order not found");

  const logId = await createLog(supabase, supplierId, "forward_order");

  try {
    let externalOrderId = null;

    if (supplier.api_url) {
      const apiKey = supplier.api_key_secret ? (Deno.env.get(supplier.api_key_secret) || "") : "";
      const adapter = getAdapter(supplier.api_type);

      const forwardPayload = {
        order_number: order.order_number,
        shipping_name: order.shipping_name,
        shipping_phone: order.shipping_phone,
        shipping_email: order.shipping_email,
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_country: order.shipping_country,
        shipping_postal_code: order.shipping_postal_code,
        items: order.order_items.map((i: any) => ({
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          product_id: i.product_id,
        })),
        total: order.total,
        currency: order.currency,
      };

      const result = await adapter.forwardOrder(supplier.api_url, apiKey, forwardPayload);
      externalOrderId = result.externalOrderId;
    }

    // Create supplier order record
    await supabase.from("supplier_orders").insert({
      order_id: orderId,
      supplier_id: supplierId,
      external_order_id: externalOrderId,
      status: externalOrderId ? "forwarded" : "pending",
      forwarded_at: externalOrderId ? new Date().toISOString() : null,
    });

    // Mark order as dropship
    await supabase.from("orders").update({
      is_dropship: true,
      supplier_order_id: externalOrderId,
    }).eq("id", orderId);

    await completeLog(supabase, logId, "success", 1, 0);
    return { success: true, externalOrderId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown";
    await completeLog(supabase, logId, "failed", 0, 1, [{ error: msg }]);
    throw err;
  }
}

async function handleSyncOrderStatus(supabase: any, supplierId?: string) {
  let query = supabase.from("supplier_orders").select("*, suppliers(api_url, api_type, api_key_secret)")
    .not("external_order_id", "is", null)
    .not("status", "in", '("delivered","cancelled")');
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data: orders } = await query;
  if (!orders?.length) return { synced: 0, message: "No orders to sync" };

  let synced = 0, failed = 0;
  const errors: unknown[] = [];

  for (const so of orders as any[]) {
    try {
      if (!so.suppliers?.api_url) continue;
      const apiKey = so.suppliers.api_key_secret ? (Deno.env.get(so.suppliers.api_key_secret) || "") : "";
      const adapter = getAdapter(so.suppliers.api_type);
      const status = await adapter.getOrderStatus(so.suppliers.api_url, apiKey, so.external_order_id);

      const updates: any = { status: status.status, updated_at: new Date().toISOString() };
      if (status.trackingNumber) updates.tracking_number = status.trackingNumber;
      if (status.carrier) updates.shipping_carrier = status.carrier;

      await supabase.from("supplier_orders").update(updates).eq("id", so.id);

      // Also update main order tracking if available
      if (status.trackingNumber) {
        await supabase.from("orders").update({ tracking_number: status.trackingNumber }).eq("id", so.order_id);
      }

      synced++;
    } catch (err: unknown) {
      failed++;
      errors.push({ order_id: so.order_id, error: err instanceof Error ? err.message : "Unknown" });
    }
  }

  return { synced, failed, errors, total: orders.length };
}

async function handleBulkImport(supabase: any, supplierId: string) {
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();
  if (!supplier) throw new Error("Supplier not found");

  const { data: pending } = await supabase.from("supplier_products")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("is_imported", false);

  if (!pending?.length) return { imported: 0, message: "No pending products" };

  const logId = await createLog(supabase, supplierId, "bulk_import");
  let imported = 0, failed = 0;
  const errors: unknown[] = [];
  const markup = Number(supplier.markup_percentage) || 30;

  for (const sp of pending) {
    try {
      const price = Math.round(Number(sp.external_price) * (1 + markup / 100));
      const slug = (sp.external_title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

      const { data: product, error: pErr } = await supabase.from("products").insert({
        title: sp.external_title,
        slug,
        description: sp.external_description || null,
        price,
        supplier_price: sp.external_price,
        supplier_url: sp.external_url,
        image_url: sp.external_image_url,
        images: sp.external_images || [],
        stock_quantity: sp.external_stock,
        is_active: true,
      }).select("id").single();

      if (pErr) throw pErr;

      await supabase.from("supplier_products").update({
        product_id: product.id,
        is_imported: true,
        sync_status: "synced",
        import_errors: null,
        last_synced_at: new Date().toISOString(),
      }).eq("id", sp.id);

      imported++;
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : "Unknown";
      errors.push({ external_id: sp.external_id, error: msg });
      await supabase.from("supplier_products").update({
        import_errors: { error: msg, at: new Date().toISOString() },
        sync_status: "error",
      }).eq("id", sp.id);
    }
  }

  await completeLog(supabase, logId, failed > 0 ? "partial" : "success", imported, failed, errors);
  return { imported, failed, errors, total: pending.length };
}

async function handleGetSyncLogs(supabase: any, supplierId?: string, limit = 20) {
  let query = supabase.from("supplier_sync_logs")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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

    const body = await req.json();
    const { action, supplier_id, order_id, limit } = body;

    switch (action) {
      case "auto_import":
        if (!supplier_id) return json({ error: "supplier_id required" }, 400);
        return json(await handleAutoImport(supabase, supplier_id));

      case "sync_stock":
        return json(await handleSyncStock(supabase, supplier_id));

      case "sync_prices":
        return json(await handleSyncPrices(supabase, supplier_id));

      case "forward_order":
        if (!order_id || !supplier_id) return json({ error: "order_id and supplier_id required" }, 400);
        return json(await handleForwardOrder(supabase, order_id, supplier_id));

      case "sync_order_status":
        return json(await handleSyncOrderStatus(supabase, supplier_id));

      case "bulk_import":
        if (!supplier_id) return json({ error: "supplier_id required" }, 400);
        return json(await handleBulkImport(supabase, supplier_id));

      case "get_sync_logs":
        return json(await handleGetSyncLogs(supabase, supplier_id, limit));

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[supplier-sync] Error:", message);
    return json({ error: message }, 500);
  }
});
