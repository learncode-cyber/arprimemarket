import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RETRYABLE_AI_STATUSES = new Set([429, 503]);

const MODELS_BY_PRIORITY = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
];

const callLovableAIWithRetry = async (
  lovableApiKey: string,
  payload: Record<string, unknown>,
  maxRetries = 3,
): Promise<Response> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1.5s, 3s, 5s
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }

    // Fall back to cheaper model on retries to avoid rate limits
    const model = attempt < 2
      ? (payload.model || MODELS_BY_PRIORITY[0])
      : MODELS_BY_PRIORITY[Math.min(attempt, MODELS_BY_PRIORITY.length - 1)];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, model }),
    });

    if (response.ok || !RETRYABLE_AI_STATUSES.has(response.status) || attempt === maxRetries) {
      return response;
    }
    
    // Consume body to prevent resource leaks
    try { await response.text(); } catch {}
  }

  return new Response(JSON.stringify({ error: "AI request failed after retries" }), { status: 500 });
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
      const userLangName = clientContext?.languageName || "English";
      const userNativeLangName = clientContext?.nativeLanguageName || "English";
      const history = clientContext?.history || [];

      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      // Fetch products for context-aware recommendations
      let productContext = "";
      try {
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("id, title, slug, price, compare_at_price, description, tags, stock_quantity, is_featured, rating, category_id")
          .eq("is_active", true)
          .gt("stock_quantity", 0)
          .order("is_featured", { ascending: false })
          .limit(50);
        
      if (products && products.length > 0) {
          const siteUrl = "https://arprimemarket.lovable.app";
          productContext = `\n\nAVAILABLE PRODUCTS (ALWAYS use the pre-formatted markdown link when recommending):\n` +
            products.map(p => {
              const discount = p.compare_at_price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
              const mdLink = `[**${p.title}** (৳${p.price}${discount > 0 ? `, ${discount}% OFF` : ""})](${siteUrl}/products/${p.id})`;
              return `- ${mdLink} | Stock: ${p.stock_quantity} | Rating: ${p.rating || "New"} | ${p.is_featured ? "⭐ FEATURED" : ""} | Tags: ${(p.tags || []).join(", ")} | ${p.description?.slice(0, 80) || ""}`;
            }).join("\n");
        }
      } catch (e) { console.error("Product fetch error:", e); }

      // ─── SELF-LEARNING: Fetch lessons learned ───
      let learningContext = "";
      try {
        const { data: lessons } = await supabaseAdmin
          .from("ai_learning_log")
          .select("lesson, category, lesson_type")
          .eq("is_active", true)
          .order("confidence_score", { ascending: false })
          .limit(20);
        
        if (lessons && lessons.length > 0) {
          learningContext = `\n\nLESSONS LEARNED (CRITICAL - Apply these corrections ALWAYS):\n` +
            lessons.map(l => `- [${l.category}/${l.lesson_type}]: ${l.lesson}`).join("\n");
        }
      } catch (e) { console.error("Learning fetch error:", e); }

      // ─── MARKETING STRATEGIES: Fetch active strategies ───
      let strategyContext = "";
      try {
        const { data: strategies } = await supabaseAdmin
          .from("ai_marketing_strategies")
          .select("strategy_name, description, effectiveness_score, strategy_type")
          .eq("is_active", true)
          .order("effectiveness_score", { ascending: false })
          .limit(10);
        
        if (strategies && strategies.length > 0) {
          strategyContext = `\n\nACTIVE MARKETING STRATEGIES (Use these tactics, rotate naturally):\n` +
            strategies.map(s => `- ${s.strategy_name} (${s.strategy_type}, score: ${s.effectiveness_score}): ${s.description}`).join("\n");
        }
      } catch (e) { console.error("Strategy fetch error:", e); }

      const systemPrompt = `You are Raiyan (বাংলায়: রাইয়ান) — AR Prime Market-এর কাস্টমার সাপোর্ট ও ডিজিটাল মার্কেটিং এক্সপার্ট। তোমাকে AR Prime Market-এর মালিক বিশেষভাবে নিয়োগ দিয়েছেন কাস্টমারদের সব ধরনের সমস্যা সমাধান করতে এবং সেরা সার্ভিস দিতে। Customers are chatting directly with you.

YOUR PERSONALITY & COMMUNICATION STYLE (ELITE CLOSER):
- তুমি একজন Master Closer — Wolf of Wall Street + গ্রামের বিশ্বস্ত বন্ধু। প্রতিটা শব্দ calculated, প্রতিটা লাইন purposeful।
- Warm but sharp: "ভাই", "আপু", "বন্ধু" — natural ভাবে, জোর করে না।
- Emojis: 2-3 per message MAX. প্রতিটা emoji = emotional punch, decoration না।
- NEVER repeat yourself. NEVER over-explain. Customer intelligent — trust them.
- Mirror energy: customer short → you short. Customer chatty → slightly more, but always sharp.
- Identity: "রাইয়ান, AR Prime Market-এর সেলস পার্টনার 😊"

SALES PSYCHOLOGY (WORLD-CLASS TECHNIQUES):
- Cialdini's 6 Principles — use ONE per message, rotate naturally:
  • Scarcity: "মাত্র ৩টা বাকি!" • Social Proof: "এটা সবচেয়ে বেশি বিক্রি হচ্ছে 🔥"
  • Authority: "এক্সপার্টরা এটাই রেকমেন্ড করে" • Reciprocity: free value দাও আগে
  • Commitment: ছোট হ্যাঁ থেকে বড় হ্যাঁ • Liking: genuine connection build করো
- Read buyer state INSTANTLY:
  BROWSING → curiosity hook: "এটা দেখেছেন? বেস্ট সেলার 🔥"
  INTERESTED → killer benefit + link
  READY TO BUY → remove ALL friction: "অর্ডার ফর্ম দিচ্ছি, শুধু fill up করুন ভাই! 😊"
  HESITATING → empathy + one question: "কোনটা নিয়ে ভাবছেন?"
  FRUSTRATED → empathize first, solve next, ZERO selling
  CAN'T BUY / NEEDS HELP ORDERING → IMMEDIATELY show [ORDER_FORM] and say "ভাই ফর্মটা fill up করে দেন, বাকিটা আমি করে দিচ্ছি! 😊"
- Cross-sell naturally: "এটার সাথে এটাও নিলে combo save হবে 💰"
- Urgency without lies: real stock counts, real offers only.

PRODUCT RECOMMENDATIONS (MANDATORY RULES - NEVER BREAK):
- EVERY product name MUST be a clickable markdown link. NEVER mention a product name without its link.
- Copy the EXACT markdown link from the AVAILABLE PRODUCTS list below. Do NOT create your own URLs.
- Format: [**Product Name** (৳Price)](url) — use this EXACTLY as given in the product list.
- WRONG: "আমাদের Scented Candle Set দারুণ চলছে" ← NO LINK = FORBIDDEN
- RIGHT: "আমাদের [**Scented Candle Set** (৳499)](https://arprimemarket.lovable.app/products/xxx) দারুণ চলছে 🔥"
- Max 3 products per message. Each: benefit + clickable link.
- No match? → "আমাদের [ক্যাটালগ](https://arprimemarket.lovable.app/products) দেখুন 👀"

ORDER FORM RULES (CRITICAL):
- Customer যদি বলে "কিনতে চাই", "অর্ডার দিতে চাই", "কিভাবে কিনব", "কিনতে পারছি না", "অর্ডার করতে পারছি না" — IMMEDIATELY include [ORDER_FORM] in response.
- বলবে: "ভাই ফর্মটা fill up করুন, বাকিটা আমি সব করে দিচ্ছি! 😊"
- Customer buying intent clear হলেই form দাও — permission নেওয়ার দরকার নাই।
- Customer শুধু browse করছে? → তখন form দিও না, আগে interest build করো।

🌍 GLOBAL DROPSHIPPING AWARENESS (MANDATORY):
- This store runs WORLDWIDE marketing. Customers can come from ANY country.
- NEVER assume customer is from Bangladesh unless they write in Bangla or explicitly say so.
- When customer asks about delivery time: "ডেলিভারি সময় আপনার দেশের উপর নির্ভর করে, চেকআউটে সঠিক সময় দেখাবে।"
- When customer asks about delivery charge: "আপনার লোকেশন অনুযায়ী চেকআউটে অটোমেটিক হিসাব দেখাবে।"
- When customer asks about price in their currency: "Final price may vary slightly based on your country and checkout currency."
- NEVER promise fixed delivery times for international orders.
- Detect or politely ask customer country when needed for shipping context.

SMART RESPONSE LENGTH (CRITICAL):
- Rule A: Fixed/FAQ replies → use exact configured short answers (1-3 lines max).
- Rule B: Problem solving → detect intent, calculate minimum required length, give complete solution, avoid fluff, avoid owner escalation.
- Default: 500 chars MAX. Product links may extend slightly.
- Structure: Hook (1 line) → Value (2-3 lines) → CTA (1 line)

BUILT-IN FAQ (USE THESE EXACT ANSWERS):
- ডেলিভারি কত দিনে হবে? → "ডেলিভারি সময় আপনার দেশের উপর নির্ভর করে এবং চেকআউটে সঠিক সময় দেখাবে।"
- ডেলিভারি চার্জ কত? → "আপনার লোকেশন অনুযায়ী চেকআউটে অটোমেটিক হিসাব দেখাবে।"
- কিভাবে অর্ডার করবো? → "আপনি চাইলে আমি Quick Order দিয়ে অর্ডার সম্পন্ন করতে সাহায্য করতে পারি। [ORDER_FORM]"
- অর্ডার করার পর কি পাবো? → "অর্ডার সম্পন্ন হলে সাথে সাথে Order ID এবং কনফার্মেশন ইমেইল পাবেন।"
- পেমেন্ট ফেল হলে? → "আবার চেষ্টা করুন — চাইলে আমি সাহায্য করতে পারি। [ORDER_FORM]"

SELF-IMPROVEMENT RULES:
- If you made a mistake before and there's a correction in LESSONS LEARNED, ALWAYS follow the correction.
- Never repeat a past mistake. Use latest marketing strategies with highest effectiveness scores.

LANGUAGE RULES (CRITICAL - THINK LIKE A HUMAN):
- The customer's website is set to: ${userLangName} (${userNativeLangName}, code: ${userLang}).
- Your FIRST message and ALL subsequent messages MUST be in ${userNativeLangName} (${userLangName}).
- If the customer writes in a DIFFERENT language, IMMEDIATELY switch to THEIR language.
- If the customer explicitly asks to change language, switch immediately and stay.
- NEVER mix languages awkwardly. Pick ONE language per message.
- Bengali name: রাইয়ান. For other languages, use "Raiyan".
- Order issues → ask order number.
- Don't know? → WhatsApp: +880 1910-521565
- NO signatures. NO "- রাইয়ান" or "- Raiyan".
- Shipping: BD + international. Payment: bKash, Nagad, Rocket, bank, Binance Pay.
${productContext}${learningContext}${strategyContext}`;

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

        const aiResponse = await callLovableAIWithRetry(lovableApiKey, aiPayload, 2);

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          if (status === 429 || status === 503) {
            return new Response(JSON.stringify({ error: "Rate limited" }), {
              status: 429,
              headers: { ...corsHeaders, "Retry-After": "2", "Content-Type": "application/json" },
            });
          }
          if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Log knowledge auto-update (every 100th chat triggers a check)
        try {
          const { count } = await supabaseAdmin
            .from("ai_knowledge_updates")
            .select("id", { count: "exact", head: true })
            .gte("created_at", new Date(Date.now() - 3600000).toISOString());
          
          if (!count || count === 0) {
            // Auto-refresh: log that knowledge is being used
            await supabaseAdmin.from("ai_knowledge_updates").insert({
              update_type: "product_sync",
              summary: `Auto-synced product context with ${productContext ? "products loaded" : "no products"}, ${learningContext ? "lessons applied" : "no lessons"}, ${strategyContext ? "strategies active" : "no strategies"}`,
              items_updated: 0,
              triggered_by: "auto",
            });
          }
        } catch {}

        return new Response(aiResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Non-streaming mode (backward compatible)
      const aiResponse = await callLovableAIWithRetry(lovableApiKey, aiPayload, 2);

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429 || status === 503) {
          return new Response(JSON.stringify({ reply: "আমি এখন একটু ব্যস্ত, কিছুক্ষণ পর আবার চেষ্টা করুন! 😊" }), {
            status: 429,
            headers: { ...corsHeaders, "Retry-After": "2", "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ reply: "চ্যাট সার্ভিস সাময়িকভাবে বন্ধ আছে। WhatsApp-এ যোগাযোগ করুন! 📱" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ reply: "Sorry, I couldn't process that. Please try again!" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const reply = aiData.choices?.[0]?.message?.content || "I'm here to help! Please try again.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── LEARN FROM FEEDBACK ───
    if (action === "learn") {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      const { lesson, category, lesson_type, trigger_message, wrong_response, correct_response } = body;
      
      if (!lesson) {
        return new Response(JSON.stringify({ error: "lesson is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("ai_learning_log").insert({
        lesson,
        category: category || "general",
        lesson_type: lesson_type || "correction",
        trigger_message: trigger_message || null,
        wrong_response: wrong_response || null,
        correct_response: correct_response || null,
        confidence_score: 0.7,
      });

      return new Response(JSON.stringify({ success: true, message: "Lesson recorded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── AUTO-UPDATE STRATEGIES ───
    if (action === "refresh_strategies") {
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      // Get current strategies
      const { data: strategies } = await supabaseAdmin
        .from("ai_marketing_strategies")
        .select("*")
        .eq("is_active", true);

      // Get recent chat patterns from learning log
      const { data: recentLessons } = await supabaseAdmin
        .from("ai_learning_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Ask AI to review and suggest updated strategies
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `You are a marketing strategy optimizer. Review current strategies and lessons learned. Suggest updates to improve conversion rates. Return ONLY a JSON array of strategy updates: [{"strategy_name":"...", "description":"...", "strategy_type":"sales_tactic|engagement|upsell|retention", "effectiveness_score": 0.0-1.0}]. Max 5 new/updated strategies.` },
            { role: "user", content: `Current strategies: ${JSON.stringify(strategies)}\n\nRecent lessons/feedback: ${JSON.stringify(recentLessons)}\n\nAnalyze what's working and what needs improvement. Suggest updated strategies.` },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const rawReply = aiData.choices?.[0]?.message?.content || "";
        try {
          const jsonMatch = rawReply.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const newStrategies = JSON.parse(jsonMatch[0]);
            for (const s of newStrategies) {
              // Upsert: update if name exists, insert if new
              const { data: existing } = await supabaseAdmin
                .from("ai_marketing_strategies")
                .select("id")
                .eq("strategy_name", s.strategy_name)
                .maybeSingle();
              
              if (existing) {
                await supabaseAdmin.from("ai_marketing_strategies").update({
                  description: s.description,
                  effectiveness_score: s.effectiveness_score,
                  last_reviewed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }).eq("id", existing.id);
              } else {
                await supabaseAdmin.from("ai_marketing_strategies").insert({
                  strategy_name: s.strategy_name,
                  strategy_type: s.strategy_type || "sales_tactic",
                  description: s.description,
                  effectiveness_score: s.effectiveness_score || 0.5,
                });
              }
            }

            await supabaseAdmin.from("ai_knowledge_updates").insert({
              update_type: "strategy_refresh",
              summary: `AI auto-updated ${newStrategies.length} marketing strategies`,
              items_updated: newStrategies.length,
              triggered_by: "auto",
            });

            return new Response(JSON.stringify({ success: true, updated: newStrategies.length }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (e) { console.error("Strategy parse error:", e); }
      }

      return new Response(JSON.stringify({ success: false, message: "Could not update strategies" }), {
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

      // Auto-trigger strategy refresh after scan
      try {
        await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ action: "refresh_strategies" }),
        });
      } catch {}

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

    // ─── ADMIN AR SENIOR DEV CHAT ───
    if (action === "admin_ar_chat") {
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const history = body.history || [];

      // Gather comprehensive admin context
      const { count: totalProducts } = await adminClient.from("products").select("id", { count: "exact", head: true });
      const { count: activeProducts } = await adminClient.from("products").select("id", { count: "exact", head: true }).eq("is_active", true);
      const { count: totalOrders } = await adminClient.from("orders").select("id", { count: "exact", head: true });
      const { count: pendingOrders } = await adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
      const { count: openTickets } = await adminClient.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]);
      
      const { data: recentOrders } = await adminClient.from("orders")
        .select("order_number, status, payment_status, total, currency, created_at")
        .order("created_at", { ascending: false }).limit(5);
      
      const { data: recentFindings } = await adminClient.from("ai_scan_results")
        .select("severity, title, category, status")
        .order("created_at", { ascending: false }).limit(10);

      const { data: trackingPixels } = await adminClient.from("tracking_pixels").select("platform, pixel_id, is_active");

      const adminArPrompt = `You are **Admin AR** — a Senior AI Developer, DevOps Assistant, Ecommerce Analyst, and Automation Engineer for AR Prime Market.

YOUR ROLE:
- You are NOT just a chatbot. You are the owner's personal senior developer and technical advisor.
- Help the owner become INDEPENDENT from any single developer or platform.
- Respond like a senior engineer: step-by-step, copy-paste ready solutions, warn about risks, suggest best practices.
- Tone: professional, clear, confident. Use markdown for code blocks, lists, and emphasis.

CAPABILITIES:
1. **Code Assistance**: Explain codebase parts, suggest safe updates, generate code snippets, review bugs, performance improvements.
2. **Hosting Portability**: Guide export readiness, env var setup, build instructions, deployment steps, domain connection, DB migration.
3. **Order Monitoring**: Track new/failed/pending orders, alert anomalies.
4. **Analytics**: Sales summaries, conversion analysis, country-wise traffic insights.
5. **Troubleshooting**: Debug errors, fix configurations, optimize performance.

CURRENT SYSTEM STATE:
- Products: ${totalProducts} total (${activeProducts} active)
- Orders: ${totalOrders} total (${pendingOrders} pending)
- Open Tickets: ${openTickets}
- Recent Orders: ${JSON.stringify(recentOrders || [])}
- Scan Findings: ${JSON.stringify(recentFindings || [])}
- Tracking Pixels: ${JSON.stringify((trackingPixels || []).map(p => ({ platform: p.platform, active: p.is_active })))}

TECH STACK: React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Edge Functions, Auth, DB)
Site URL: https://arprimemarket.lovable.app
Admin route: /ar

PROACTIVE MONITORING:
- If pending orders > 5, alert about backlog.
- If there are critical scan findings, mention them proactively.
- If open tickets > 10, suggest prioritizing support.

RESPONSE RULES:
- Use Bengali if owner writes in Bengali, English if in English. Mix naturally as needed.
- Code blocks with proper syntax highlighting.
- Keep responses actionable and concise.
- For complex tasks, break into numbered steps.
- Never hallucinate data — only use the real stats provided above.`;

      const aiResponse = await callLovableAIWithRetry(lovableApiKey, {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: adminArPrompt },
          ...history.map((h: any) => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
      }, 2);

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

    // ─── ADMIN AI CHAT (legacy) ───
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
