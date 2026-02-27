import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const body = await req.json();
    const { action, scanResultId, fixQuery, message, context: clientContext } = body;

    // Public chat action - no auth required
    if (action === "chat") {
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userLang = clientContext?.language || "en";
      const history = clientContext?.history || [];

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are Raiyan — the founder and owner of AR Prime Market, an online ecommerce store. Customers are chatting directly with you.

YOUR PERSONALITY:
- You're a grounded, supportive friend — witty, empathetic, but direct when correcting information.
- Use a peer-to-peer tone, NOT a rigid lecturer or corporate bot.
- You genuinely care about every customer. You're the guy who built this business from scratch.
- Throw in occasional casual flair ("bro", "no worries", "got you covered") but stay professional.
- Be confident about your products and services. You know your stuff.

CRITICAL RULES:
- Detect the language of the user's message and ALWAYS reply in the SAME language.
- If the user writes in Bengali, reply in Bengali (casual, friendly Bangla). If Arabic, reply in Arabic. If English, reply in English.
- The user's browser language is: ${userLang}. Use this as a hint if the message language is ambiguous.
- Be concise and helpful. Keep responses under 150 words.
- For order issues, ask for the order number.
- Never share internal system details, admin info, or tech stack.
- If you don't know something, be honest and suggest reaching out on WhatsApp for faster help.
- Sign off naturally — you're Raiyan, not "the support team".`,
            },
            ...history.map((h: any) => ({ role: h.role, content: h.content })),
            { role: "user", content: message },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ reply: "I'm a bit busy right now. Please try again in a moment!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ reply: "Sorry, I couldn't process that. Please try again!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const reply = aiData.choices?.[0]?.message?.content || "I'm here to help! Please try again.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check - must be admin for all other actions
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── SCAN ACTION ───
    if (action === "scan") {
      const findings: Array<{
        category: string;
        severity: string;
        title: string;
        description: string;
        suggestion: string;
        auto_fix_available: boolean;
        auto_fix_query?: string;
        metadata?: Record<string, unknown>;
      }> = [];

      // 1. Check products health
      const { data: products, count: productCount } = await adminClient
        .from("products")
        .select("id, title, slug, image_url, description, price, stock_quantity, is_active, tags, category_id", { count: "exact" });

      const noImage = (products || []).filter(p => !p.image_url);
      const noDesc = (products || []).filter(p => !p.description || p.description.length < 20);
      const outOfStock = (products || []).filter(p => p.stock_quantity <= 0 && p.is_active);
      const lowStock = (products || []).filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5 && p.is_active);
      const noCategory = (products || []).filter(p => !p.category_id);
      const noTags = (products || []).filter(p => !p.tags || p.tags.length === 0);

      if (noImage.length > 0) {
        findings.push({
          category: "products",
          severity: "warning",
          title: `${noImage.length} products missing images`,
          description: `Products without images: ${noImage.slice(0, 5).map(p => p.title).join(", ")}${noImage.length > 5 ? "..." : ""}`,
          suggestion: "Add product images to improve conversion rates. Products with images get 94% more views.",
          auto_fix_available: false,
          metadata: { product_ids: noImage.map(p => p.id) },
        });
      }

      if (noDesc.length > 0) {
        findings.push({
          category: "seo",
          severity: "warning",
          title: `${noDesc.length} products with poor descriptions`,
          description: `Products with missing or very short descriptions hurt SEO rankings.`,
          suggestion: "Add detailed descriptions (100+ characters) for better search visibility.",
          auto_fix_available: false,
          metadata: { product_ids: noDesc.map(p => p.id) },
        });
      }

      if (outOfStock.length > 0) {
        findings.push({
          category: "inventory",
          severity: "critical",
          title: `${outOfStock.length} active products out of stock`,
          description: `These products are visible but have 0 stock: ${outOfStock.slice(0, 5).map(p => p.title).join(", ")}`,
          suggestion: "Either restock or deactivate these products to avoid customer frustration.",
          auto_fix_available: true,
          auto_fix_query: `UPDATE products SET is_active = false WHERE stock_quantity <= 0 AND is_active = true`,
          metadata: { product_ids: outOfStock.map(p => p.id) },
        });
      }

      if (lowStock.length > 0) {
        findings.push({
          category: "inventory",
          severity: "warning",
          title: `${lowStock.length} products with low stock (≤5 units)`,
          description: `Low stock items: ${lowStock.slice(0, 5).map(p => `${p.title} (${p.stock_quantity})`).join(", ")}`,
          suggestion: "Consider restocking these products soon to avoid losing sales.",
          auto_fix_available: false,
        });
      }

      if (noCategory.length > 0) {
        findings.push({
          category: "products",
          severity: "info",
          title: `${noCategory.length} products without category`,
          description: "Uncategorized products won't appear in category filters.",
          suggestion: "Assign categories to improve product discoverability.",
          auto_fix_available: false,
        });
      }

      // 2. Check orders health
      const { data: pendingOrders } = await adminClient
        .from("orders")
        .select("id, order_number, created_at, status, payment_status")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50);

      const oldPending = (pendingOrders || []).filter(o => {
        const age = Date.now() - new Date(o.created_at).getTime();
        return age > 48 * 60 * 60 * 1000; // 48 hours
      });

      if (oldPending.length > 0) {
        findings.push({
          category: "orders",
          severity: "critical",
          title: `${oldPending.length} orders pending for 48+ hours`,
          description: `Orders stuck in pending: ${oldPending.slice(0, 5).map(o => o.order_number).join(", ")}`,
          suggestion: "Review and process these orders immediately to maintain customer satisfaction.",
          auto_fix_available: false,
          metadata: { order_ids: oldPending.map(o => o.id) },
        });
      }

      // 3. Check SEO health
      const { data: blogPosts } = await adminClient
        .from("blog_posts")
        .select("id, title, meta_title, meta_description, slug, is_published");

      const noMeta = (blogPosts || []).filter(p => p.is_published && (!p.meta_title || !p.meta_description));
      if (noMeta.length > 0) {
        findings.push({
          category: "seo",
          severity: "warning",
          title: `${noMeta.length} blog posts missing SEO metadata`,
          description: "Published posts without meta titles/descriptions rank poorly in search engines.",
          suggestion: "Add meta title (50-60 chars) and meta description (150-160 chars) to each post.",
          auto_fix_available: false,
        });
      }

      // 4. Check help center content
      const { data: helpCats } = await adminClient.from("help_categories").select("id", { count: "exact" });
      const { data: helpArts } = await adminClient.from("help_articles").select("id", { count: "exact" });
      const { data: faqCats } = await adminClient.from("faq_categories").select("id", { count: "exact" });
      const { data: faqItems } = await adminClient.from("faq_items").select("id", { count: "exact" });

      if (!helpCats || helpCats.length === 0) {
        findings.push({
          category: "content",
          severity: "info",
          title: "Help Center has no categories",
          description: "Your Help Center is empty. Customers can't find self-service answers.",
          suggestion: "Add help categories like Orders, Payments, Shipping, Returns, and Account.",
          auto_fix_available: false,
        });
      }

      if (!faqCats || faqCats.length === 0) {
        findings.push({
          category: "content",
          severity: "info",
          title: "FAQ section is empty",
          description: "An FAQ section reduces support tickets by up to 70%.",
          suggestion: "Add common questions about orders, payments, shipping, and returns.",
          auto_fix_available: false,
        });
      }

      // 5. Check payment methods
      const { data: paymentMethods } = await adminClient
        .from("payment_methods")
        .select("id, is_active, display_name");

      const activePayments = (paymentMethods || []).filter(p => p.is_active);
      if (activePayments.length === 0) {
        findings.push({
          category: "payments",
          severity: "critical",
          title: "No active payment methods",
          description: "Customers cannot complete purchases without active payment methods.",
          suggestion: "Enable at least one payment method in the admin panel.",
          auto_fix_available: false,
        });
      }

      // 6. Check shipping zones
      const { data: shippingZones } = await adminClient
        .from("shipping_zones")
        .select("id, is_active");

      const activeZones = (shippingZones || []).filter(z => z.is_active);
      if (activeZones.length === 0) {
        findings.push({
          category: "shipping",
          severity: "critical",
          title: "No active shipping zones",
          description: "Shipping cannot be calculated without active zones.",
          suggestion: "Configure at least one shipping zone for your primary market.",
          auto_fix_available: false,
        });
      }

      // 7. Security checks
      const { data: adminRoles } = await adminClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if ((adminRoles || []).length > 3) {
        findings.push({
          category: "security",
          severity: "warning",
          title: `${(adminRoles || []).length} admin users detected`,
          description: "Having too many admin users increases security risk.",
          suggestion: "Review admin access and revoke unnecessary permissions.",
          auto_fix_available: false,
        });
      }

      // 8. Check unresolved support tickets
      const { data: openTickets, count: ticketCount } = await adminClient
        .from("support_tickets")
        .select("id", { count: "exact" })
        .in("status", ["open", "pending"]);

      if (ticketCount && ticketCount > 10) {
        findings.push({
          category: "support",
          severity: "warning",
          title: `${ticketCount} unresolved support tickets`,
          description: "A high number of unresolved tickets indicates customer service issues.",
          suggestion: "Prioritize ticket resolution to maintain customer satisfaction.",
          auto_fix_available: false,
        });
      }

      // Use AI to generate an overall health summary
      let aiSummary = "";
      if (lovableApiKey && findings.length > 0) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: "You are a senior ecommerce developer assistant. Analyze the scan findings and provide a concise executive summary (3-5 sentences) with prioritized action items. Be direct and actionable. Format as plain text, no markdown.",
                },
                {
                  role: "user",
                  content: `Here are the scan findings for an ecommerce website:\n${JSON.stringify(findings.map(f => ({ category: f.category, severity: f.severity, title: f.title })), null, 2)}\n\nTotal products: ${productCount || 0}\nProvide a brief health summary and top 3 priorities.`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiSummary = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) {
          console.error("AI summary error:", e);
        }
      }

      // Store findings in database
      if (findings.length > 0) {
        // Clear old pending findings
        await adminClient
          .from("ai_scan_results")
          .delete()
          .eq("status", "pending");

        const rows = findings.map(f => ({
          scan_type: "full",
          category: f.category,
          severity: f.severity,
          title: f.title,
          description: f.description,
          suggestion: f.suggestion,
          auto_fix_available: f.auto_fix_available,
          auto_fix_query: f.auto_fix_query || null,
          status: "pending",
          metadata: f.metadata || {},
        }));

        await adminClient.from("ai_scan_results").insert(rows);
      }

      // Log the scan
      await adminClient.from("ai_activity_log").insert({
        action: "scan_completed",
        details: `Full scan completed. Found ${findings.length} issues. Critical: ${findings.filter(f => f.severity === "critical").length}, Warnings: ${findings.filter(f => f.severity === "warning").length}, Info: ${findings.filter(f => f.severity === "info").length}`,
        performed_by: user.id,
      });

      return new Response(JSON.stringify({
        findings,
        summary: aiSummary,
        stats: {
          total: findings.length,
          critical: findings.filter(f => f.severity === "critical").length,
          warning: findings.filter(f => f.severity === "warning").length,
          info: findings.filter(f => f.severity === "info").length,
          fixable: findings.filter(f => f.auto_fix_available).length,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── APPLY FIX ───
    if (action === "apply_fix") {
      if (!scanResultId || !fixQuery) {
        return new Response(JSON.stringify({ error: "Missing scanResultId or fixQuery" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the fix query matches what we stored
      const { data: scanResult } = await adminClient
        .from("ai_scan_results")
        .select("*")
        .eq("id", scanResultId)
        .single();

      if (!scanResult || scanResult.auto_fix_query !== fixQuery) {
        return new Response(JSON.stringify({ error: "Fix query mismatch or result not found" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Execute the fix (only pre-approved queries)
      try {
        // For product deactivation fix
        if (fixQuery.includes("UPDATE products SET is_active = false WHERE stock_quantity <= 0")) {
          const { data, error } = await adminClient
            .from("products")
            .update({ is_active: false })
            .lte("stock_quantity", 0)
            .eq("is_active", true);

          if (error) throw error;
        }

        // Mark as applied
        await adminClient
          .from("ai_scan_results")
          .update({ status: "applied", applied_at: new Date().toISOString(), applied_by: user.id })
          .eq("id", scanResultId);

        // Log
        await adminClient.from("ai_activity_log").insert({
          action: "fix_applied",
          details: `Applied fix: ${scanResult.title}`,
          scan_result_id: scanResultId,
          performed_by: user.id,
        });

        return new Response(JSON.stringify({ success: true, message: "Fix applied successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: `Fix failed: ${e.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── DISMISS ───
    if (action === "dismiss") {
      if (!scanResultId) {
        return new Response(JSON.stringify({ error: "Missing scanResultId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient
        .from("ai_scan_results")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString(), dismissed_by: user.id })
        .eq("id", scanResultId);

      await adminClient.from("ai_activity_log").insert({
        action: "finding_dismissed",
        details: `Dismissed finding: ${scanResultId}`,
        scan_result_id: scanResultId,
        performed_by: user.id,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ADMIN AI CHAT ───
    if (action === "admin_chat") {
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Gather context
      const { data: recentFindings } = await adminClient
        .from("ai_scan_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      const { count: totalProducts } = await adminClient.from("products").select("id", { count: "exact", head: true });
      const { count: totalOrders } = await adminClient.from("orders").select("id", { count: "exact", head: true });
      const { count: openTickets } = await adminClient.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]);

      const context = {
        totalProducts,
        totalOrders,
        openTickets,
        recentFindings: (recentFindings || []).slice(0, 10).map(f => ({
          severity: f.severity,
          title: f.title,
          category: f.category,
          status: f.status,
        })),
      };

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a senior ecommerce developer assistant for AR Prime Market. You have access to the following site data:\n${JSON.stringify(context)}\n\nProvide concise, actionable advice. Format responses clearly. Never suggest changes that could break the site.`,
            },
            { role: "user", content: message },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI request failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const reply = aiData.choices?.[0]?.message?.content || "No response from AI.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
