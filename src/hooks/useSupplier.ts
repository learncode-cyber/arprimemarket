import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  id: string;
  name: string;
  api_type: string;
  api_url: string | null;
  api_key_name: string | null;
  api_key_secret: string | null;
  base_url: string | null;
  webhook_url: string | null;
  is_active: boolean;
  auto_sync: boolean;
  auto_forward_orders: boolean;
  sync_interval_hours: number;
  last_synced_at: string | null;
  markup_percentage: number;
  notes: string | null;
  created_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string | null;
  external_id: string;
  external_url: string | null;
  external_title: string;
  external_price: number;
  external_stock: number;
  external_image_url: string | null;
  external_images: string[];
  external_variants: any[];
  external_description: string | null;
  external_category: string | null;
  is_imported: boolean;
  last_synced_at: string | null;
  sync_status: string;
  import_errors: any;
}

export interface SupplierOrder {
  id: string;
  order_id: string;
  supplier_id: string;
  external_order_id: string | null;
  status: string;
  tracking_number: string | null;
  shipping_carrier: string | null;
  notes: string | null;
  forwarded_at: string | null;
}

export interface SyncLog {
  id: string;
  supplier_id: string;
  action: string;
  status: string;
  items_processed: number;
  items_failed: number;
  error_details: any[];
  started_at: string;
  completed_at: string | null;
  suppliers?: { name: string };
}

// ─── Supplier sync API calls ───
export async function invokeSupplierSync(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("supplier-sync", {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    setSuppliers((data as unknown as Supplier[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const addSupplier = async (supplier: Partial<Supplier>) => {
    const { error } = await supabase.from("suppliers").insert(supplier as any);
    if (error) throw error;
    fetchSuppliers();
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const { error } = await supabase.from("suppliers").update(updates as any).eq("id", id);
    if (error) throw error;
    fetchSuppliers();
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
    fetchSuppliers();
  };

  return { suppliers, loading, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier };
}

export function useSupplierProducts(supplierId?: string) {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("supplier_products").select("*").order("created_at", { ascending: false });
    if (supplierId) query = query.eq("supplier_id", supplierId);
    const { data } = await query;
    setProducts((data as unknown as SupplierProduct[]) || []);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const importProduct = async (sp: SupplierProduct, markup: number, categoryId?: string) => {
    const price = Number(sp.external_price) * (1 + markup / 100);
    const slug = sp.external_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    
    const { data: product, error: pErr } = await supabase.from("products").insert({
      title: sp.external_title,
      slug,
      description: sp.external_description || null,
      price: Math.round(price),
      supplier_price: sp.external_price,
      supplier_url: sp.external_url,
      image_url: sp.external_image_url,
      images: sp.external_images || [],
      stock_quantity: sp.external_stock,
      is_active: true,
      category_id: categoryId || null,
    } as any).select("id").single();

    if (pErr) throw pErr;

    await supabase.from("supplier_products").update({
      product_id: product.id,
      is_imported: true,
      sync_status: "synced",
    } as any).eq("id", sp.id);

    fetchProducts();
    return product.id;
  };

  const addSupplierProduct = async (product: Partial<SupplierProduct>) => {
    const { error } = await supabase.from("supplier_products").insert(product as any);
    if (error) throw error;
    fetchProducts();
  };

  const deleteSupplierProduct = async (id: string) => {
    await supabase.from("supplier_products").delete().eq("id", id);
    fetchProducts();
  };

  return { products, loading, fetchProducts, importProduct, addSupplierProduct, deleteSupplierProduct };
}

export function useSupplierOrders() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("supplier_orders").select("*").order("created_at", { ascending: false });
    setOrders((data as unknown as SupplierOrder[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const forwardOrder = async (orderId: string, supplierId: string) => {
    await invokeSupplierSync("forward_order", { order_id: orderId, supplier_id: supplierId });
    fetchOrders();
  };

  const syncOrderStatuses = async (supplierId?: string) => {
    const result = await invokeSupplierSync("sync_order_status", supplierId ? { supplier_id: supplierId } : {});
    fetchOrders();
    return result;
  };

  const updateSupplierOrder = async (id: string, updates: Partial<SupplierOrder>) => {
    await supabase.from("supplier_orders").update(updates as any).eq("id", id);
    fetchOrders();
  };

  return { orders, loading, fetchOrders, forwardOrder, syncOrderStatuses, updateSupplierOrder };
}

export function useSyncLogs(supplierId?: string) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeSupplierSync("get_sync_logs", supplierId ? { supplier_id: supplierId } : {});
      setLogs(data || []);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, loading, fetchLogs };
}
