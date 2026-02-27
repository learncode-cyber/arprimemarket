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
  name: string;
  testConnection(apiUrl: string, apiKey: string): Promise<{ ok: boolean; message: string; details?: any }>;
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

// ─── CJ Dropshipping Adapter ───
const cjAdapter: SupplierAdapter = {
  name: "CJ Dropshipping",

  async testConnection(apiUrl, apiKey) {
    try {
      const tokenRes = await fetch(`${apiUrl}/authentication/getAccessToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", password: "", apiKey }),
      });
      if (!tokenRes.ok) return { ok: false, message: `CJ API returned ${tokenRes.status}` };
      const data = await tokenRes.json();
      if (data.result === true || data.code === 200) {
        return { ok: true, message: "CJ Dropshipping connected successfully", details: { hasToken: true } };
      }
      return { ok: false, message: data.message || "Authentication failed" };
    } catch (e: any) {
      return { ok: false, message: `Connection failed: ${e.message}` };
    }
  },

  async fetchProducts(apiUrl, apiKey) {
    // CJ uses token-based auth — first get token, then fetch
    const tokenRes = await fetch(`${apiUrl}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.data?.accessToken || apiKey;

    const res = await fetch(`${apiUrl}/product/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
      body: JSON.stringify({ pageNum: 1, pageSize: 200 }),
    });
    if (!res.ok) throw new Error(`CJ product list failed: ${res.status}`);
    const data = await res.json();
    const products = data.data?.list || [];

    return products.map((p: any) => ({
      externalId: String(p.pid || p.productId),
      title: p.productNameEn || p.productName || "",
      description: p.description || p.productDescEn || "",
      price: Number(p.sellPrice || p.productPrice || 0),
      stock: Number(p.productStock || p.stock || 999),
      imageUrl: p.productImage || p.bigImage || null,
      images: (p.productImageSet || []).map((img: any) => img.imageUrl || img),
      variants: p.variants || [],
      category: p.categoryName || "",
      url: p.productUrl || "",
    }));
  },

  async forwardOrder(apiUrl, apiKey, order) {
    const tokenRes = await fetch(`${apiUrl}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.data?.accessToken || apiKey;

    const res = await fetch(`${apiUrl}/shopping/order/createOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
      body: JSON.stringify({
        orderNumber: order.order_number,
        shippingCountryCode: order.shipping_country || "BD",
        shippingCity: order.shipping_city,
        shippingAddress: order.shipping_address,
        shippingCustomerName: order.shipping_name,
        shippingPhone: order.shipping_phone,
        shippingZip: order.shipping_postal_code || "",
        products: order.items.map((i: any) => ({
          vid: i.product_id,
          quantity: i.quantity,
        })),
      }),
    });
    if (!res.ok) throw new Error(`CJ order create failed: ${res.status}`);
    const data = await res.json();
    return { externalOrderId: String(data.data?.orderId || data.data?.orderNum || "unknown") };
  },

  async getOrderStatus(apiUrl, apiKey, externalOrderId) {
    const tokenRes = await fetch(`${apiUrl}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.data?.accessToken || apiKey;

    const res = await fetch(`${apiUrl}/shopping/order/getOrderDetail`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CJ-Access-Token": token },
      body: JSON.stringify({ orderId: externalOrderId }),
    });
    if (!res.ok) throw new Error(`CJ order status failed: ${res.status}`);
    const data = await res.json();
    const order = data.data;

    return {
      status: order?.orderStatus || "unknown",
      trackingNumber: order?.trackNumber || order?.logisticInfo?.trackNumber,
      carrier: order?.logisticName || order?.logisticInfo?.logisticName,
    };
  },
};

// ─── AliExpress Adapter ───
const aliexpressAdapter: SupplierAdapter = {
  name: "AliExpress",

  async testConnection(apiUrl, apiKey) {
    try {
      const res = await fetch(`${apiUrl}/api/products?limit=1`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      if (res.ok) return { ok: true, message: "AliExpress API connected" };
      return { ok: false, message: `API returned ${res.status}: ${await res.text()}` };
    } catch (e: any) {
      return { ok: false, message: `Connection failed: ${e.message}` };
    }
  },

  async fetchProducts(apiUrl, apiKey) {
    const allProducts: ExternalProduct[] = [];
    let page = 1;
    const maxPages = 10;

    while (page <= maxPages) {
      const res = await fetch(`${apiUrl}/api/products?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`AliExpress fetch failed: ${res.status}`);
      const data = await res.json();
      const products = data.products || data.data || data.items || [];

      if (products.length === 0) break;

      allProducts.push(...products.map((p: any) => ({
        externalId: String(p.product_id || p.id),
        title: p.product_title || p.title || p.name || "",
        description: p.product_detail || p.description || "",
        price: Number(p.target_sale_price || p.price || p.original_price || 0),
        stock: Number(p.stock || p.inventory || 999),
        imageUrl: p.product_main_image_url || p.image_url || p.image || null,
        images: (p.product_small_image_urls?.string || p.images || []),
        variants: p.variants || p.skus || [],
        category: p.second_level_category_name || p.category || "",
        url: p.product_detail_url || p.url || "",
      })));

      if (products.length < 50) break;
      page++;
    }

    return allProducts;
  },

  async forwardOrder(apiUrl, apiKey, order) {
    const res = await fetch(`${apiUrl}/api/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        shipping_address: {
          name: order.shipping_name,
          phone: order.shipping_phone,
          address: order.shipping_address,
          city: order.shipping_city,
          country: order.shipping_country,
          postal_code: order.shipping_postal_code,
        },
        items: order.items,
        order_number: order.order_number,
      }),
    });
    if (!res.ok) throw new Error(`AliExpress order failed: ${res.status}`);
    const data = await res.json();
    return { externalOrderId: String(data.order_id || data.id) };
  },

  async getOrderStatus(apiUrl, apiKey, externalOrderId) {
    const res = await fetch(`${apiUrl}/api/orders/${externalOrderId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`AliExpress status failed: ${res.status}`);
    const data = await res.json();
    return {
      status: data.order_status || data.status || "unknown",
      trackingNumber: data.tracking_number || data.logistics_info?.tracking_number,
      carrier: data.logistics_company || data.logistics_info?.company,
    };
  },
};

// ─── Generic/Custom REST API adapter ───
const customAdapter: SupplierAdapter = {
  name: "Custom REST API",

  async testConnection(apiUrl, apiKey) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(`${apiUrl}/products?limit=1`, { headers });
      if (res.ok) return { ok: true, message: "API connected successfully" };

      // Try alternate endpoints
      const res2 = await fetch(`${apiUrl}/health`, { headers });
      if (res2.ok) return { ok: true, message: "API health check passed" };

      return { ok: false, message: `API returned ${res.status}` };
    } catch (e: any) {
      return { ok: false, message: `Connection failed: ${e.message}` };
    }
  },

  async fetchProducts(apiUrl, apiKey) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(`${apiUrl}/products`, { headers });
    if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const products = Array.isArray(data) ? data : data.products || data.data || data.items || [];
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
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error(`Order forward failed: ${res.status}`);
    const data = await res.json();
    return { externalOrderId: String(data.id || data.order_id || data.external_order_id) };
  },

  async getOrderStatus(apiUrl, apiKey, externalOrderId) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(`${apiUrl}/orders/${externalOrderId}`, { headers });
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    const data = await res.json();
    return {
      status: data.status || "unknown",
      trackingNumber: data.tracking_number || data.trackingNumber,
      carrier: data.carrier || data.shipping_carrier,
    };
  },
};

// ─── Manual adapter (no API) ───
const manualAdapter: SupplierAdapter = {
  name: "Manual",
  async testConnection() { return { ok: true, message: "Manual supplier — no API connection needed" }; },
  async fetchProducts() { return []; },
  async forwardOrder() { throw new Error("Manual supplier doesn't support automatic order forwarding"); },
  async getOrderStatus() { return { status: "unknown" }; },
};

// ─── Adapter registry ───
function getAdapter(apiType: string): SupplierAdapter {
  switch (apiType) {
    case "cj": return cjAdapter;
    case "aliexpress": return aliexpressAdapter;
    case "custom": return customAdapter;
    case "manual": return manualAdapter;
    default: return customAdapter;
  }
}

// ─── Test Connection ───
async function handleTestConnection(supabase: any, supplierId: string) {
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();
  if (!supplier) throw new Error("Supplier not found");

  const adapter = getAdapter(supplier.api_type);
  const apiKey = supplier.api_key_secret ? (Deno.env.get(supplier.api_key_secret) || "") : "";

  if (supplier.api_type === "manual") {
    return { ok: true, message: "Manual supplier — no API needed", platform: adapter.name };
  }

  if (!supplier.api_url) {
    return { ok: false, message: "No API URL configured", platform: adapter.name };
  }

  const result = await adapter.testConnection(supplier.api_url, apiKey);
  return { ...result, platform: adapter.name };
}

// ─── Auto Import with retry ───
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
    let externalProducts: ExternalProduct[] = [];
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        externalProducts = await adapter.fetchProducts(supplier.api_url, apiKey);
        break;
      } catch (e: any) {
        retries++;
        if (retries >= maxRetries) throw e;
        // Wait before retry (exponential backoff)
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
      }
    }

    for (const ep of externalProducts) {
      try {
        const { data: existing } = await supabase
          .from("supplier_products")
          .select("id")
          .eq("supplier_id", supplierId)
          .eq("external_id", ep.externalId)
          .maybeSingle();

        const productData = {
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
        };

        if (existing) {
          await supabase.from("supplier_products").update(productData).eq("id", existing.id);
        } else {
          await supabase.from("supplier_products").insert({
            supplier_id: supplierId,
            external_id: ep.externalId,
            ...productData,
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

  // Cache external products per supplier for efficiency
  const supplierProductsCache = new Map<string, Map<string, ExternalProduct>>();

  for (const sp of items as any[]) {
    try {
      const markup = sp.suppliers?.markup_percentage || 30;
      let latestPrice = Number(sp.external_price);

      if (sp.suppliers?.api_url) {
        const cacheKey = sp.supplier_id;
        if (!supplierProductsCache.has(cacheKey)) {
          try {
            const apiKey = sp.suppliers.api_key_secret ? (Deno.env.get(sp.suppliers.api_key_secret) || "") : "";
            const adapter = getAdapter(sp.suppliers.api_type);
            const products = await adapter.fetchProducts(sp.suppliers.api_url, apiKey);
            supplierProductsCache.set(cacheKey, new Map(products.map(p => [p.externalId, p])));
          } catch { supplierProductsCache.set(cacheKey, new Map()); }
        }
        const ext = supplierProductsCache.get(cacheKey)?.get(sp.external_id);
        if (ext) latestPrice = ext.price;
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

    if (supplier.api_url && supplier.api_type !== "manual") {
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

      // Retry logic for order forwarding
      let retries = 0;
      while (retries < 3) {
        try {
          const result = await adapter.forwardOrder(supplier.api_url, apiKey, forwardPayload);
          externalOrderId = result.externalOrderId;
          break;
        } catch (e: any) {
          retries++;
          if (retries >= 3) throw e;
          await new Promise(r => setTimeout(r, 2000 * retries));
        }
      }
    }

    await supabase.from("supplier_orders").insert({
      order_id: orderId,
      supplier_id: supplierId,
      external_order_id: externalOrderId,
      status: externalOrderId ? "forwarded" : "pending",
      forwarded_at: externalOrderId ? new Date().toISOString() : null,
    });

    await supabase.from("orders").update({
      is_dropship: true,
      supplier_order_id: externalOrderId,
    }).eq("id", orderId);

    await completeLog(supabase, logId, "success", 1, 0);
    return { success: true, externalOrderId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown";
    await completeLog(supabase, logId, "failed", 0, 1, [{ error: msg }]);

    // Still create supplier order record for manual handling
    await supabase.from("supplier_orders").insert({
      order_id: orderId,
      supplier_id: supplierId,
      status: "failed",
      notes: `Auto-forward failed: ${msg}`,
    });

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

// ─── Webhook handler (for supplier push updates) ───
async function handleWebhook(supabase: any, supplierId: string, payload: any) {
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();
  if (!supplier) throw new Error("Supplier not found");

  const logId = await createLog(supabase, supplierId, "webhook_update");
  let processed = 0, failed = 0;
  const errors: unknown[] = [];

  try {
    const eventType = payload.event || payload.type || payload.action || "unknown";

    // Product update event
    if (eventType.includes("product") || payload.products) {
      const products = payload.products || [payload.product || payload.data];
      for (const p of products) {
        try {
          const externalId = String(p.id || p.product_id || p.external_id);
          const { data: existing } = await supabase.from("supplier_products")
            .select("id, product_id, is_imported")
            .eq("supplier_id", supplierId)
            .eq("external_id", externalId)
            .maybeSingle();

          if (existing) {
            await supabase.from("supplier_products").update({
              external_price: Number(p.price || p.cost || 0),
              external_stock: Number(p.stock || p.inventory || 0),
              external_title: p.title || p.name || undefined,
              last_synced_at: new Date().toISOString(),
              sync_status: "synced",
            }).eq("id", existing.id);

            // Update linked product if imported
            if (existing.is_imported && existing.product_id) {
              const markup = Number(supplier.markup_percentage) || 30;
              const newPrice = Math.round(Number(p.price || 0) * (1 + markup / 100));
              await supabase.from("products").update({
                stock_quantity: Number(p.stock || p.inventory || 0),
                price: newPrice,
                supplier_price: Number(p.price || 0),
              }).eq("id", existing.product_id);
            }
            processed++;
          }
        } catch (err: unknown) {
          failed++;
          errors.push({ error: err instanceof Error ? err.message : "Unknown" });
        }
      }
    }

    // Order status event
    if (eventType.includes("order") || payload.order) {
      const orderData = payload.order || payload.data;
      if (orderData) {
        const externalId = String(orderData.id || orderData.order_id);
        const { data: so } = await supabase.from("supplier_orders")
          .select("id, order_id")
          .eq("supplier_id", supplierId)
          .eq("external_order_id", externalId)
          .maybeSingle();

        if (so) {
          const updates: any = { updated_at: new Date().toISOString() };
          if (orderData.status) updates.status = orderData.status;
          if (orderData.tracking_number) updates.tracking_number = orderData.tracking_number;
          if (orderData.carrier) updates.shipping_carrier = orderData.carrier;

          await supabase.from("supplier_orders").update(updates).eq("id", so.id);

          if (orderData.tracking_number) {
            await supabase.from("orders").update({ tracking_number: orderData.tracking_number }).eq("id", so.order_id);
          }
          processed++;
        }
      }
    }

    await completeLog(supabase, logId, failed > 0 ? "partial" : "success", processed, failed, errors);
    return { processed, failed, event: payload.event || "unknown" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown";
    await completeLog(supabase, logId, "failed", processed, failed, [{ error: msg }]);
    throw err;
  }
}

async function handleGetSyncLogs(supabase: any, supplierId?: string, limit = 30) {
  let query = supabase.from("supplier_sync_logs")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── Get supplier health overview ───
async function handleGetHealth(supabase: any) {
  const { data: suppliers } = await supabase.from("suppliers").select("id, name, api_type, is_active, last_synced_at, auto_sync");
  const { count: totalProducts } = await supabase.from("supplier_products").select("id", { count: "exact", head: true });
  const { count: importedProducts } = await supabase.from("supplier_products").select("id", { count: "exact", head: true }).eq("is_imported", true);
  const { count: errorProducts } = await supabase.from("supplier_products").select("id", { count: "exact", head: true }).eq("sync_status", "error");
  const { count: pendingOrders } = await supabase.from("supplier_orders").select("id", { count: "exact", head: true }).eq("status", "pending");

  const { data: recentLogs } = await supabase.from("supplier_sync_logs")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(20);

  const successRate = recentLogs?.length
    ? Math.round((recentLogs.filter((l: any) => l.status === "success").length / recentLogs.length) * 100)
    : 100;

  return {
    suppliers: suppliers?.length || 0,
    activeSuppliers: suppliers?.filter((s: any) => s.is_active).length || 0,
    totalProducts: totalProducts || 0,
    importedProducts: importedProducts || 0,
    errorProducts: errorProducts || 0,
    pendingOrders: pendingOrders || 0,
    syncSuccessRate: successRate,
    platforms: [...new Set((suppliers || []).map((s: any) => s.api_type))],
  };
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

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) throw new Error("Admin access required");
  return user.id;
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

    // Webhook doesn't require admin auth (uses supplier-specific validation)
    if (action === "webhook") {
      if (!supplier_id) return json({ error: "supplier_id required" }, 400);
      return json(await handleWebhook(supabase, supplier_id, body.payload || body));
    }

    // All other actions require admin
    try {
      await requireAdmin(req, supabase);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unauthorized";
      return json({ error: msg }, msg === "Admin access required" ? 403 : 401);
    }

    switch (action) {
      case "test_connection":
        if (!supplier_id) return json({ error: "supplier_id required" }, 400);
        return json(await handleTestConnection(supabase, supplier_id));

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

      case "get_health":
        return json(await handleGetHealth(supabase));

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[supplier-sync] Error:", message);
    return json({ error: message }, 500);
  }
});
