import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, supplier_id } = await req.json();

    if (action === "sync_stock") {
      // Sync stock from supplier_products to products
      const { data: supplierProducts } = await supabase
        .from("supplier_products")
        .select("*")
        .eq("is_imported", true)
        .not("product_id", "is", null);

      if (!supplierProducts || supplierProducts.length === 0) {
        return new Response(JSON.stringify({ synced: 0, message: "No imported products to sync" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let synced = 0;
      for (const sp of supplierProducts) {
        const { error } = await supabase
          .from("products")
          .update({ stock_quantity: sp.external_stock })
          .eq("id", sp.product_id);
        
        if (!error) {
          await supabase
            .from("supplier_products")
            .update({ last_synced_at: new Date().toISOString(), sync_status: "synced" })
            .eq("id", sp.id);
          synced++;
        }
      }

      return new Response(JSON.stringify({ synced, total: supplierProducts.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_prices") {
      // Sync prices: apply supplier markup
      const query = supabase.from("supplier_products").select("*, suppliers(markup_percentage)").eq("is_imported", true).not("product_id", "is", null);
      if (supplier_id) query.eq("supplier_id", supplier_id);
      
      const { data: supplierProducts } = await query;

      if (!supplierProducts || supplierProducts.length === 0) {
        return new Response(JSON.stringify({ synced: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let synced = 0;
      for (const sp of supplierProducts as any[]) {
        const markup = sp.suppliers?.markup_percentage || 30;
        const newPrice = Math.round(Number(sp.external_price) * (1 + markup / 100));
        
        await supabase.from("products").update({ 
          price: newPrice, 
          supplier_price: sp.external_price 
        }).eq("id", sp.product_id);
        
        await supabase.from("supplier_products").update({ 
          last_synced_at: new Date().toISOString(), 
          sync_status: "synced" 
        }).eq("id", sp.id);
        
        synced++;
      }

      return new Response(JSON.stringify({ synced }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "forward_order") {
      const { order_id } = await req.json();
      // Mark order as dropship and create supplier order entry
      // This is a placeholder - actual forwarding would integrate with supplier API
      return new Response(JSON.stringify({ success: true, message: "Order forwarding prepared" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
