import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify admin role
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub;

    // Use service role for admin check
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, tables } = await req.json();

    if (action === "export") {
      const exportData: Record<string, unknown[]> = {};
      const tablesToExport = tables || [
        "products", "categories", "orders", "order_items",
        "coupons", "promotions", "campaigns", "profiles",
        "shipping_zones", "shipping_rates", "payment_methods",
      ];

      for (const table of tablesToExport) {
        const { data, error } = await adminClient.from(table).select("*").limit(10000);
        if (!error) exportData[table] = data || [];
      }

      const backup = {
        version: "1.0",
        created_at: new Date().toISOString(),
        created_by: userId,
        tables: exportData,
        metadata: {
          table_count: Object.keys(exportData).length,
          total_rows: Object.values(exportData).reduce((s, arr) => s + arr.length, 0),
        },
      };

      return new Response(JSON.stringify(backup, null, 2), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="arprimemarket-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    if (action === "status") {
      const tableStats: Record<string, number> = {};
      const checkTables = [
        "products", "orders", "profiles", "coupons", "promotions", "campaigns",
      ];

      for (const table of checkTables) {
        const { count } = await adminClient.from(table).select("id", { count: "exact", head: true });
        tableStats[table] = count || 0;
      }

      return new Response(JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        tables: tableStats,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
