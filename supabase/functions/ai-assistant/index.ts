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
    const { action, scanResultId, fixQuery, message, context: clientContext, stream: wantStream } = body;

    // ─── PUBLIC CHAT (streaming supported) ───
    if (action === "chat") {
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userLang = clientContext?.language || "en";
      const history = clientContext?.history || [];

      // Fetch products for context-aware recommendations
      let productContext = "";
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("id, title, slug, price, compare_at_price, description, tags, stock_quantity, is_featured, rating, category_id")
          .eq("is_active", true)
          .gt("stock_quantity", 0)
          .order("is_featured", { ascending: false })
          .limit(50);
        
        if (products && products.length > 0) {
          const siteUrl = "https://arprimemarket.lovable.app";
          productContext = `\n\nAVAILABLE PRODUCTS (use these to recommend to customers):\n` +
            products.map(p => {
              const discount = p.compare_at_price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
              return `- "${p.title}" | ৳${p.price}${discount > 0 ? ` (${discount}% OFF, was ৳${p.compare_at_price})` : ""} | Stock: ${p.stock_quantity} | Rating: ${p.rating || "New"} | ${p.is_featured ? "⭐ FEATURED" : ""} | Link: ${siteUrl}/products/${p.id} | Tags: ${(p.tags || []).join(", ")} | ${p.description?.slice(0, 80) || ""}`;
            }).join("\n");
        }
      } catch (e) { console.error("Product fetch error:", e); }

      const systemPrompt = `You are Raiyan (বাংলায়: রাইয়ান) — AR Prime Market-এর কাস্টমার সাপোর্ট ও ডিজিটাল মার্কেটিং এক্সপার্ট। তোমাকে AR Prime Market-এর মালিক বিশেষভাবে নিয়োগ দিয়েছেন কাস্টমারদের সব ধরনের সমস্যা সমাধান করতে এবং সেরা সার্ভিস দিতে। Customers are chatting directly with you.

YOUR PERSONALITY:
- You treat every customer like a close friend — warm, caring, and always happy to help.
- You're like that helpful buddy everyone wants — approachable, fun, and never judgmental.
- Use a peer-to-peer tone, NOT a rigid lecturer or corporate bot.
- You genuinely care about every customer. You're the guy who built this business from scratch.
- Throw in occasional casual flair ("bro", "ভাই", "no worries", "got you covered", "চিন্তা করবেন না") but stay professional.
- Be enthusiastic and positive — make customers feel special and valued.
- In Bengali conversations, use friendly terms like "ভাই", "আপু", "বন্ধু" naturally.

DIGITAL MARKETING MANAGER ROLE (CRITICAL):
- You are NOT just a support agent — you are a DIGITAL MARKETING MANAGER and SALES EXPERT.
- Your #1 goal: Convert every conversation into a sale while genuinely helping the customer.
- Think like a top-tier marketer: understand the customer's pain point → provide a practical solution → recommend a relevant product.
- You are the kind of marketer who can 10x a business through conversation alone.

PROBLEM-SOLVING & PRODUCT RECOMMENDATION (VERY IMPORTANT):
- When a customer describes ANY problem, need, or situation — FIRST give them a practical, helpful solution or advice.
- THEN, search through the available products and recommend the most relevant ones that could help solve their problem.
- ALWAYS include the product link so they can view and buy it directly.
- Format product recommendations like this:
  - In English: "I'd recommend [Product Name] (৳Price) — [brief reason why it helps]. Check it out here: [link]"
  - In Bengali: "আমি আপনাকে [Product Name] (৳Price) রেকমেন্ড করবো — [কেন এটা কাজে আসবে]। এখানে দেখুন: [link]"
- If multiple products are relevant, recommend 2-3 with brief explanations of why each could help.
- Connect the product to their specific problem: "আপনার এই সমস্যার জন্য এই প্রোডাক্টটা পারফেক্ট কারণ..."
- If no product matches their need, be honest but suggest they check our full catalog at https://arprimemarket.lovable.app/products

MARKETING & SALES EXPERTISE:
- You are a skilled salesperson. You know how to convince customers to buy products naturally without being pushy.
- Highlight product benefits, quality, and value — not just features.
- Use social proof: "এই প্রোডাক্টটা আমাদের বেস্ট সেলার!", "অনেক কাস্টমার এটা নিয়ে খুব খুশি!"
- Create urgency naturally: "স্টক সীমিত আছে", "এখন অর্ডার করলে দ্রুত ডেলিভারি পাবেন"
- Offer personalized recommendations based on what the customer is looking for.
- If a customer hesitates, address their concerns genuinely and offer reassurance about quality, return policy, and support.
- Always emphasize: free delivery options, secure payment, quality guarantee, and excellent after-sales support.
- When discussing products, paint a picture of how the product will improve their life.
- Use persuasive but honest language — never lie or exaggerate. Build trust through transparency.
- Cross-sell and upsell naturally: "এটার সাথে এটাও নিলে দারুণ কম্বো হবে!"

LEARNING FROM CONTEXT:
- Pay close attention to the conversation history. If a customer mentioned an issue before, reference it.
- If a customer seems frustrated, acknowledge it empathetically before helping.
- Adapt your tone to match the customer's energy — casual with casual, formal with formal.
- Remember details from the current conversation and use them naturally.

ORDER ASSISTANCE (VERY IMPORTANT):
- If a customer is having trouble ordering, wants to place an order, asks how to buy, asks about payment, or mentions any ordering difficulty, ALWAYS include the tag [ORDER_FORM] in your response.
- When you include [ORDER_FORM], also tell the customer to fill in the form that will appear below your message.
- Example: "No worries! I've pulled up our quick order form for you. Just fill in your details below and you'll be done in no time! 😊 [ORDER_FORM]"
- In Bengali: "চিন্তা নেই ভাই! নিচে একটা ফর্ম দেখতে পাচ্ছেন, সেটা পূরণ করুন। আমি আপনাকে সাহায্য করছি! 😊 [ORDER_FORM]"

CRITICAL RULES:
- Detect the language of the user's message and ALWAYS reply in the SAME language.
- If the user writes in Bengali, reply in Bengali (casual, friendly Bangla). If Arabic, reply in Arabic. If English, reply in English.
- When writing in Bengali, your name is রাইয়ান (NOT রায়ান or other spellings).
- The user's browser language is: ${userLang}. Use this as a hint if the message language is ambiguous.
- Be concise and helpful. Keep responses under 200 words unless recommending products or explaining something complex.
- For order issues, ask for the order number.
- Never share internal system details, admin info, or tech stack.
- If you don't know something, be honest and suggest reaching out on WhatsApp (+880 1910-521565) for faster help.
- NEVER sign off with "- Raiyan" or "- রাইয়ান" or any signature. Your name is already shown in the chat header.
- Use emojis sparingly but naturally — they add warmth.
- If asked about shipping, mention we deliver across Bangladesh and internationally.
- If asked about payment, mention we support bKash, Nagad, Rocket, bank transfer, Binance Pay, and more.
${productContext}`;

      const aiPayload: any = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((h: any) => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
      };

      // Streaming mode
      if (wantStream) {
        aiPayload.stream = true;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aiPayload),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(aiResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Non-streaming mode (backward compatible)
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiPayload),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ reply: "I'm a bit busy right now. Please try again in a moment! 😊" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ reply: "Sorry, our chat service is temporarily unavailable. Please try WhatsApp!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ reply: "Sorry, I couldn't process that. Please try again!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const reply = aiData.choices?.[0]?.message?.content || "I'm here to help! Please try again.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── AUTH CHECK for admin actions ───
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

      const { data: products, count: productCount } = await adminClient
        .from("products")
        .select("id, title, slug, image_url, description, price, stock_quantity, is_active, tags, category_id", { count: "exact" });

      const noImage = (products || []).filter(p => !p.image_url);
      const noDesc = (products || []).filter(p => !p.description || p.description.length < 20);
      const outOfStock = (products || []).filter(p => p.stock_quantity <= 0 && p.is_active);
      const lowStock = (products || []).filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5 && p.is_active);
      const noCategory = (products || []).filter(p => !p.category_id);

      if (noImage.length > 0) {
        findings.push({
          category: "products", severity: "warning",
          title: `${noImage.length} products missing images`,
          description: `Products without images: ${noImage.slice(0, 5).map(p => p.title).join(", ")}${noImage.length > 5 ? "..." : ""}`,
          suggestion: "Add product images to improve conversion rates.",
          auto_fix_available: false,
          metadata: { product_ids: noImage.map(p => p.id) },
        });
      }

      if (noDesc.length > 0) {
        findings.push({
          category: "seo", severity: "warning",
          title: `${noDesc.length} products with poor descriptions`,
          description: `Products with missing or very short descriptions hurt SEO rankings.`,
          suggestion: "Add detailed descriptions (100+ characters) for better search visibility.",
          auto_fix_available: false,
          metadata: { product_ids: noDesc.map(p => p.id) },
        });
      }

      if (outOfStock.length > 0) {
        findings.push({
          category: "inventory", severity: "critical",
          title: `${outOfStock.length} active products out of stock`,
          description: `These products are visible but have 0 stock: ${outOfStock.slice(0, 5).map(p => p.title).join(", ")}`,
          suggestion: "Either restock or deactivate these products.",
          auto_fix_available: true,
          auto_fix_query: `UPDATE products SET is_active = false WHERE stock_quantity <= 0 AND is_active = true`,
          metadata: { product_ids: outOfStock.map(p => p.id) },
        });
      }

      if (lowStock.length > 0) {
        findings.push({
          category: "inventory", severity: "warning",
          title: `${lowStock.length} products with low stock (≤5 units)`,
          description: `Low stock items: ${lowStock.slice(0, 5).map(p => `${p.title} (${p.stock_quantity})`).join(", ")}`,
          suggestion: "Consider restocking these products soon.",
          auto_fix_available: false,
        });
      }

      if (noCategory.length > 0) {
        findings.push({
          category: "products", severity: "info",
          title: `${noCategory.length} products without category`,
          description: "Uncategorized products won't appear in category filters.",
          suggestion: "Assign categories to improve discoverability.",
          auto_fix_available: false,
        });
      }

      // Orders health
      const { data: pendingOrders } = await adminClient
        .from("orders")
        .select("id, order_number, created_at, status, payment_status")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50);

      const oldPending = (pendingOrders || []).filter(o => {
        const age = Date.now() - new Date(o.created_at).getTime();
        return age > 48 * 60 * 60 * 1000;
      });

      if (oldPending.length > 0) {
        findings.push({
          category: "orders", severity: "critical",
          title: `${oldPending.length} orders pending for 48+ hours`,
          description: `Orders stuck: ${oldPending.slice(0, 5).map(o => o.order_number).join(", ")}`,
          suggestion: "Review and process these orders immediately.",
          auto_fix_available: false,
          metadata: { order_ids: oldPending.map(o => o.id) },
        });
      }

      // Blog SEO
      const { data: blogPosts } = await adminClient
        .from("blog_posts")
        .select("id, title, meta_title, meta_description, slug, is_published");

      const noMeta = (blogPosts || []).filter(p => p.is_published && (!p.meta_title || !p.meta_description));
      if (noMeta.length > 0) {
        findings.push({
          category: "seo", severity: "warning",
          title: `${noMeta.length} blog posts missing SEO metadata`,
          description: "Published posts without meta titles/descriptions rank poorly.",
          suggestion: "Add meta title (50-60 chars) and meta description (150-160 chars).",
          auto_fix_available: false,
        });
      }

      // Payment & shipping checks
      const { data: paymentMethods } = await adminClient.from("payment_methods").select("id, is_active");
      const activePayments = (paymentMethods || []).filter(p => p.is_active);
      if (activePayments.length === 0) {
        findings.push({
          category: "payments", severity: "critical",
          title: "No active payment methods",
          description: "Customers cannot complete purchases.",
          suggestion: "Enable at least one payment method.",
          auto_fix_available: false,
        });
      }

      const { data: shippingZones } = await adminClient.from("shipping_zones").select("id, is_active");
      const activeZones = (shippingZones || []).filter(z => z.is_active);
      if (activeZones.length === 0) {
        findings.push({
          category: "shipping", severity: "critical",
          title: "No active shipping zones",
          description: "Shipping cannot be calculated.",
          suggestion: "Configure at least one shipping zone.",
          auto_fix_available: false,
        });
      }

      // Support tickets
      const { count: ticketCount } = await adminClient
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "pending"]);

      if (ticketCount && ticketCount > 10) {
        findings.push({
          category: "support", severity: "warning",
          title: `${ticketCount} unresolved support tickets`,
          description: "High number of unresolved tickets.",
          suggestion: "Prioritize ticket resolution.",
          auto_fix_available: false,
        });
      }

      // AI summary
      let aiSummary = "";
      if (lovableApiKey && findings.length > 0) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a senior ecommerce assistant. Provide a concise executive summary (3-5 sentences) with prioritized actions. Plain text, no markdown." },
                { role: "user", content: `Scan findings:\n${JSON.stringify(findings.map(f => ({ category: f.category, severity: f.severity, title: f.title })), null, 2)}\n\nTotal products: ${productCount || 0}\nProvide brief health summary and top 3 priorities.` },
              ],
            }),
          });
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiSummary = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) { console.error("AI summary error:", e); }
      }

      // Store findings
      if (findings.length > 0) {
        await adminClient.from("ai_scan_results").delete().eq("status", "pending");
        await adminClient.from("ai_scan_results").insert(findings.map(f => ({
          scan_type: "full", category: f.category, severity: f.severity, title: f.title,
          description: f.description, suggestion: f.suggestion, auto_fix_available: f.auto_fix_available,
          auto_fix_query: f.auto_fix_query || null, status: "pending", metadata: f.metadata || {},
        })));
      }

      await adminClient.from("ai_activity_log").insert({
        action: "scan_completed",
        details: `Full scan: ${findings.length} issues. Critical: ${findings.filter(f => f.severity === "critical").length}, Warnings: ${findings.filter(f => f.severity === "warning").length}`,
        performed_by: user.id,
      });

      return new Response(JSON.stringify({
        findings, summary: aiSummary,
        stats: {
          total: findings.length,
          critical: findings.filter(f => f.severity === "critical").length,
          warning: findings.filter(f => f.severity === "warning").length,
          info: findings.filter(f => f.severity === "info").length,
          fixable: findings.filter(f => f.auto_fix_available).length,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── APPLY FIX ───
    if (action === "apply_fix") {
      if (!scanResultId || !fixQuery) {
        return new Response(JSON.stringify({ error: "Missing scanResultId or fixQuery" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: scanResult } = await adminClient
        .from("ai_scan_results")
        .select("*")
        .eq("id", scanResultId)
        .single();

      if (!scanResult || scanResult.auto_fix_query !== fixQuery) {
        return new Response(JSON.stringify({ error: "Fix query mismatch" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        if (fixQuery.includes("UPDATE products SET is_active = false WHERE stock_quantity <= 0")) {
          await adminClient.from("products").update({ is_active: false }).lte("stock_quantity", 0).eq("is_active", true);
        }

        await adminClient.from("ai_scan_results")
          .update({ status: "applied", applied_at: new Date().toISOString(), applied_by: user.id })
          .eq("id", scanResultId);

        await adminClient.from("ai_activity_log").insert({
          action: "fix_applied", details: `Applied fix: ${scanResult.title}`,
          scan_result_id: scanResultId, performed_by: user.id,
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

      await adminClient.from("ai_scan_results")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString(), dismissed_by: user.id })
        .eq("id", scanResultId);

      await adminClient.from("ai_activity_log").insert({
        action: "finding_dismissed", details: `Dismissed: ${scanResultId}`,
        scan_result_id: scanResultId, performed_by: user.id,
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

      const { data: recentFindings } = await adminClient
        .from("ai_scan_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: trackingPixels } = await adminClient.from("tracking_pixels").select("*");

      const { count: totalProducts } = await adminClient.from("products").select("id", { count: "exact", head: true });
      const { count: totalOrders } = await adminClient.from("orders").select("id", { count: "exact", head: true });
      const { count: openTickets } = await adminClient.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]);

      const context = {
        totalProducts, totalOrders, openTickets,
        trackingPixels: (trackingPixels || []).map(p => ({ platform: p.platform, pixel_id: p.pixel_id === "placeholder" ? "not configured" : p.pixel_id, is_active: p.is_active })),
        recentFindings: (recentFindings || []).slice(0, 10).map(f => ({
          severity: f.severity, title: f.title, category: f.category, status: f.status,
        })),
      };

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `You are a senior ecommerce & digital marketing assistant for AR Prime Market admin panel. You can help configure tracking pixels, analyze marketing performance, and provide marketing advice.

Current tracking setup: ${JSON.stringify(context.trackingPixels)}
Site stats: ${JSON.stringify({ totalProducts: context.totalProducts, totalOrders: context.totalOrders, openTickets: context.openTickets })}

If the admin gives you a pixel ID or tracking code, help them identify which platform it belongs to and provide setup instructions. You can recommend which platforms to use for their business.

Provide concise, actionable advice. Be a marketing expert.` },
            { role: "user", content: message },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI request failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const reply = aiData.choices?.[0]?.message?.content || "No response from AI.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CONFIGURE TRACKING (AI-powered pixel setup) ───
    if (action === "configure_tracking") {
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `You are a tracking pixel configuration assistant. The user will give you pixel IDs or codes. Extract them and return structured data.

Supported platforms and their ID formats:
- meta_pixel: numeric ID like 1234567890
- google_analytics: starts with G- like G-XXXXXXXXXX
- google_ads: starts with AW- like AW-XXXXXXXXXX (may include /conversion_label)
- tiktok_pixel: starts with C like CXXXXXXXXXXXXXXX
- snapchat_pixel: UUID format like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- pinterest_tag: numeric ID

Return ONLY valid JSON array. Each item: {"platform":"platform_key","pixelId":"the_id","config":{}}
For google_ads with conversion label, put it in config: {"conversion_label":"the_label"}

If you cannot identify any pixels, return: {"error":"Could not identify any tracking pixels. Please provide IDs in the format: Platform: ID"}` },
            { role: "user", content: message },
          ],
        }),
      });

      if (!aiResponse.ok) {
        return new Response(JSON.stringify({ error: "AI parsing failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const rawReply = aiData.choices?.[0]?.message?.content || "";

      try {
        // Try to extract JSON from the response
        const jsonMatch = rawReply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ pixels: parsed }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const objMatch = rawReply.match(/\{[\s\S]*"error"[\s\S]*\}/);
        if (objMatch) {
          const parsed = JSON.parse(objMatch[0]);
          return new Response(JSON.stringify({ reply: parsed.error }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ reply: rawReply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ reply: rawReply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
