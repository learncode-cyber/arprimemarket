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

// ─── Delete order + all related data ───
async function deleteOrder(supabase: any, orderId: string) {
  // Delete in dependency order
  await supabase.from("order_alerts").delete().eq("order_id", orderId);
  await supabase.from("payment_transactions").delete().eq("order_id", orderId);
  await supabase.from("email_logs").delete().eq("order_id", orderId);
  await supabase.from("order_items").delete().eq("order_id", orderId);
  
  // Try supplier_orders if table exists
  try {
    await supabase.from("supplier_orders").delete().eq("order_id", orderId);
  } catch { /* table may not exist */ }

  // Try affiliate commissions
  try {
    await supabase.from("affiliate_commissions").delete().eq("order_id", orderId);
  } catch { /* ok */ }

  // Try referrals
  try {
    await supabase.from("referrals").delete().eq("order_id", orderId);
  } catch { /* ok */ }

  // Delete the order itself
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw error;

  return { deleted: true, order_id: orderId };
}

// ─── Full customer deletion ───
async function deleteCustomer(supabase: any, userId: string) {
  // 1. Get user's orders
  const { data: userOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId);

  // 2. Delete each order and related data
  if (userOrders?.length) {
    for (const order of userOrders) {
      await deleteOrder(supabase, order.id);
    }
  }

  // 3. Delete addresses
  await supabase.from("addresses").delete().eq("user_id", userId);

  // 4. Delete affiliate data
  const { data: affiliateData } = await supabase
    .from("affiliates")
    .select("id")
    .eq("user_id", userId);

  if (affiliateData?.length) {
    for (const aff of affiliateData) {
      await supabase.from("affiliate_commissions").delete().eq("affiliate_id", aff.id);
    }
    await supabase.from("affiliates").delete().eq("user_id", userId);
  }

  // 5. Delete referral codes & referrals
  try {
    await supabase.from("referral_codes").delete().eq("user_id", userId);
    await supabase.from("referrals").delete().eq("referrer_id", userId);
    await supabase.from("referrals").delete().eq("referred_id", userId);
  } catch { /* ok */ }

  // 6. Delete chat sessions & messages
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId);

  if (sessions?.length) {
    for (const s of sessions) {
      await supabase.from("chat_messages").delete().eq("session_id", s.id);
    }
    await supabase.from("chat_sessions").delete().eq("user_id", userId);
  }

  // 7. Delete abandoned carts
  await supabase.from("abandoned_carts").delete().eq("user_id", userId);

  // 8. Delete user role
  await supabase.from("user_roles").delete().eq("user_id", userId);

  // 9. Delete profile
  await supabase.from("profiles").delete().eq("id", userId);

  // 10. Delete auth user (requires service role)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.warn("Auth user deletion failed:", authError.message);
    // Don't throw - profile and data are already gone
  }

  return { deleted: true, user_id: userId };
}

// ─── Update customer profile ───
async function updateCustomer(supabase: any, userId: string, updates: Record<string, any>) {
  const allowed = ["full_name", "phone", "address", "city", "country", "avatar_url"];
  const filtered: Record<string, any> = {};
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key];
  }
  filtered.updated_at = new Date().toISOString();

  const { error } = await supabase.from("profiles").update(filtered).eq("id", userId);
  if (error) throw error;
  return { updated: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    try {
      await requireAdmin(req, supabase);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unauthorized";
      return json({ error: msg }, msg === "Admin access required" ? 403 : 401);
    }

    const body = await req.json();
    const { action, order_id, user_id, updates } = body;

    switch (action) {
      case "delete_order":
        if (!order_id) return json({ error: "order_id required" }, 400);
        return json(await deleteOrder(supabase, order_id));

      case "delete_customer":
        if (!user_id) return json({ error: "user_id required" }, 400);
        return json(await deleteCustomer(supabase, user_id));

      case "update_customer":
        if (!user_id || !updates) return json({ error: "user_id and updates required" }, 400);
        return json(await updateCustomer(supabase, user_id, updates));

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin-tools] Error:", message);
    return json({ error: message }, 500);
  }
});
