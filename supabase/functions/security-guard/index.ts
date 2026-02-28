import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SecurityFinding {
  category: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  suggestion: string;
  auto_fix_available: boolean;
  auto_fix_action?: string;
  metadata?: Record<string, unknown>;
}

// ─── SECURITY CHECKS ───
async function checkSQLInjectionVectors(supabase: any): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  // Check for suspicious patterns in user-submitted data
  const { data: orders } = await supabase
    .from("orders")
    .select("id, notes, shipping_name, shipping_address, shipping_email")
    .order("created_at", { ascending: false })
    .limit(200);

  const sqlPatterns = [
    /('|"|;|--|\/\*|\*\/|xp_|exec\s|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+.*set|alter\s+table)/i,
    /(script>|<img\s+.*onerror|javascript:|on\w+\s*=)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  ];

  let suspiciousCount = 0;
  const suspiciousIds: string[] = [];

  for (const order of (orders || [])) {
    const fieldsToCheck = [order.notes, order.shipping_name, order.shipping_address, order.shipping_email].filter(Boolean);
    for (const field of fieldsToCheck) {
      for (const pattern of sqlPatterns) {
        if (pattern.test(field)) {
          suspiciousCount++;
          suspiciousIds.push(order.id);
          break;
        }
      }
    }
  }

  if (suspiciousCount > 0) {
    findings.push({
      category: "security",
      severity: "critical",
      title: `${suspiciousCount} potential injection attempts detected in orders`,
      description: `Suspicious patterns (SQL/HTML injection signatures) found in order data fields. These could be attack attempts.`,
      suggestion: "Review flagged orders immediately. Consider blocking repeat offenders.",
      auto_fix_available: true,
      auto_fix_action: "sanitize_order_fields",
      metadata: { order_ids: suspiciousIds.slice(0, 20) },
    });
  }

  // Check products for XSS in descriptions
  const { data: products } = await supabase
    .from("products")
    .select("id, title, description")
    .order("updated_at", { ascending: false })
    .limit(200);

  let xssProductCount = 0;
  const xssProductIds: string[] = [];

  for (const product of (products || [])) {
    const fields = [product.title, product.description].filter(Boolean);
    for (const field of fields) {
      if (/<script|javascript:|on\w+\s*=/i.test(field)) {
        xssProductCount++;
        xssProductIds.push(product.id);
        break;
      }
    }
  }

  if (xssProductCount > 0) {
    findings.push({
      category: "security",
      severity: "critical",
      title: `${xssProductCount} products contain potential XSS code`,
      description: `Script tags or event handlers found in product data.`,
      suggestion: "Sanitize product descriptions immediately.",
      auto_fix_available: true,
      auto_fix_action: "sanitize_product_fields",
      metadata: { product_ids: xssProductIds },
    });
  }

  return findings;
}

async function checkAuthSecurity(supabase: any): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  // Check for users with admin role
  const { data: adminRoles, count: adminCount } = await supabase
    .from("user_roles")
    .select("user_id, role", { count: "exact" })
    .eq("role", "admin");

  if (adminCount && adminCount > 5) {
    findings.push({
      category: "security",
      severity: "warning",
      title: `${adminCount} admin users detected — review access`,
      description: "Too many admin accounts increases attack surface.",
      suggestion: "Review admin list and remove unnecessary admin privileges.",
      auto_fix_available: false,
    });
  }

  // Check for orphaned sessions (old active chat sessions)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { count: oldSessions } = await supabase
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lt("updated_at", twoDaysAgo);

  if (oldSessions && oldSessions > 50) {
    findings.push({
      category: "security",
      severity: "info",
      title: `${oldSessions} stale chat sessions`,
      description: "Old active sessions should be cleaned up.",
      suggestion: "Close stale sessions to reduce data exposure.",
      auto_fix_available: true,
      auto_fix_action: "close_stale_sessions",
    });
  }

  return findings;
}

async function checkPaymentSecurity(supabase: any): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  // Check for suspicious payment patterns
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentTxns } = await supabase
    .from("payment_transactions")
    .select("id, order_id, amount, payment_method_key, created_at, status")
    .gte("created_at", oneHourAgo);

  // Check for rapid-fire transactions from same method (possible fraud)
  const methodCounts: Record<string, number> = {};
  for (const txn of (recentTxns || [])) {
    methodCounts[txn.payment_method_key] = (methodCounts[txn.payment_method_key] || 0) + 1;
  }

  for (const [method, count] of Object.entries(methodCounts)) {
    if (count > 20) {
      findings.push({
        category: "security",
        severity: "critical",
        title: `Suspicious payment activity: ${count} transactions via ${method} in 1 hour`,
        description: "Unusually high transaction volume may indicate fraud or bot attacks.",
        suggestion: "Review transactions and consider temporarily disabling this payment method.",
        auto_fix_available: false,
        metadata: { method, count },
      });
    }
  }

  // Check for unpaid orders with high values
  const { data: highValueUnpaid } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status")
    .eq("payment_status", "unpaid")
    .gt("total", 50000)
    .order("created_at", { ascending: false })
    .limit(10);

  if (highValueUnpaid && highValueUnpaid.length > 3) {
    findings.push({
      category: "security",
      severity: "warning",
      title: `${highValueUnpaid.length} high-value unpaid orders (>৳50,000)`,
      description: "Multiple large unpaid orders could indicate testing or fraud attempts.",
      suggestion: "Verify these orders manually before processing.",
      auto_fix_available: false,
      metadata: { order_numbers: highValueUnpaid.map((o: any) => o.order_number) },
    });
  }

  return findings;
}

async function checkDataIntegrity(supabase: any): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  // Check for products with negative prices
  const { data: negPriceProducts, count: negCount } = await supabase
    .from("products")
    .select("id, title, price", { count: "exact" })
    .lt("price", 0);

  if (negCount && negCount > 0) {
    findings.push({
      category: "security",
      severity: "critical",
      title: `${negCount} products with negative prices`,
      description: "Negative prices can be exploited for fraudulent refunds.",
      suggestion: "Set all negative prices to 0 immediately.",
      auto_fix_available: true,
      auto_fix_action: "fix_negative_prices",
      metadata: { product_ids: (negPriceProducts || []).map((p: any) => p.id) },
    });
  }

  // Check for orders with manipulated totals
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, order_number, subtotal, total, discount_amount, shipping_cost, tax_amount")
    .order("created_at", { ascending: false })
    .limit(100);

  let mismatchCount = 0;
  for (const order of (recentOrders || [])) {
    const expected = (order.subtotal || 0) - (order.discount_amount || 0) + (order.shipping_cost || 0) + (order.tax_amount || 0);
    if (Math.abs(expected - (order.total || 0)) > 1) {
      mismatchCount++;
    }
  }

  if (mismatchCount > 0) {
    findings.push({
      category: "security",
      severity: "critical",
      title: `${mismatchCount} orders with total/subtotal mismatch`,
      description: "Order totals don't match calculated values. Possible price manipulation.",
      suggestion: "Audit flagged orders for price tampering.",
      auto_fix_available: false,
    });
  }

  return findings;
}

// ─── AUTO-FIX ACTIONS ───
async function executeAutoFix(supabase: any, action: string, metadata: Record<string, unknown>): Promise<string> {
  switch (action) {
    case "sanitize_order_fields": {
      const ids = (metadata.order_ids as string[]) || [];
      let fixed = 0;
      for (const id of ids.slice(0, 50)) {
        const { data: order } = await supabase.from("orders").select("notes, shipping_name, shipping_address").eq("id", id).single();
        if (!order) continue;
        const sanitize = (s: string | null) => s ? s.replace(/<[^>]*>/g, "").replace(/['";\-\-]/g, "") : s;
        await supabase.from("orders").update({
          notes: sanitize(order.notes),
          shipping_name: sanitize(order.shipping_name),
          shipping_address: sanitize(order.shipping_address),
        }).eq("id", id);
        fixed++;
      }
      return `Sanitized ${fixed} order records`;
    }

    case "sanitize_product_fields": {
      const ids = (metadata.product_ids as string[]) || [];
      let fixed = 0;
      for (const id of ids) {
        const { data: product } = await supabase.from("products").select("title, description").eq("id", id).single();
        if (!product) continue;
        const sanitize = (s: string | null) => s ? s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/on\w+\s*=\s*["'][^"']*["']/gi, "").replace(/javascript:/gi, "") : s;
        await supabase.from("products").update({
          title: sanitize(product.title),
          description: sanitize(product.description),
        }).eq("id", id);
        fixed++;
      }
      return `Sanitized ${fixed} product records`;
    }

    case "close_stale_sessions": {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("chat_sessions")
        .update({ status: "closed" })
        .eq("status", "active")
        .lt("updated_at", twoDaysAgo);
      return `Closed ${count || 0} stale chat sessions`;
    }

    case "fix_negative_prices": {
      const ids = (metadata.product_ids as string[]) || [];
      for (const id of ids) {
        await supabase.from("products").update({ price: 0, is_active: false }).eq("id", id);
      }
      return `Fixed ${ids.length} products with negative prices (set to 0 and deactivated)`;
    }

    default:
      return `Unknown fix action: ${action}`;
  }
}

// ─── AI SECURITY LEARNING ───
async function aiSecurityLearning(supabase: any, lovableApiKey: string, findings: SecurityFinding[]) {
  if (!lovableApiKey || findings.length === 0) return;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity expert. Based on the security findings from a daily scan, generate NEW defensive lessons to prevent future attacks. Return ONLY a JSON array: [{"lesson": "...", "category": "security", "lesson_type": "defense_tactic"}]. Max 5 lessons. Focus on latest attack vectors: SQL injection variants, XSS, CSRF, payment fraud, session hijacking, API abuse. Each lesson should be actionable and specific.`
          },
          {
            role: "user",
            content: `Today's security findings:\n${JSON.stringify(findings.map(f => ({ title: f.title, severity: f.severity, category: f.category })))}\n\nGenerate new defensive lessons the AI should learn.`
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const rawReply = data.choices?.[0]?.message?.content || "";
      const jsonMatch = rawReply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const lessons = JSON.parse(jsonMatch[0]);
        for (const lesson of lessons) {
          // Check if similar lesson exists
          const { data: existing } = await supabase
            .from("ai_learning_log")
            .select("id")
            .eq("category", "security")
            .ilike("lesson", `%${lesson.lesson.slice(0, 50)}%`)
            .maybeSingle();

          if (!existing) {
            await supabase.from("ai_learning_log").insert({
              lesson: lesson.lesson,
              category: "security",
              lesson_type: lesson.lesson_type || "defense_tactic",
              confidence_score: 0.8,
              is_active: true,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("AI security learning error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try { body = await req.json(); } catch {}
    const action = body.action || "full_scan";

    // ─── AUTH: Only admin or cron (internal) can trigger ───
    const authHeader = req.headers.get("authorization");
    const isCron = body._cron_secret === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!isCron && authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (!isCron) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── FULL SECURITY SCAN ───
    if (action === "full_scan") {
      const allFindings: SecurityFinding[] = [];

      // Run all security checks in parallel
      const [injectionFindings, authFindings, paymentFindings, dataFindings] = await Promise.all([
        checkSQLInjectionVectors(supabase),
        checkAuthSecurity(supabase),
        checkPaymentSecurity(supabase),
        checkDataIntegrity(supabase),
      ]);

      allFindings.push(...injectionFindings, ...authFindings, ...paymentFindings, ...dataFindings);

      // Auto-fix critical issues
      const autoFixResults: string[] = [];
      for (const finding of allFindings) {
        if (finding.auto_fix_available && finding.auto_fix_action && finding.severity === "critical") {
          try {
            const result = await executeAutoFix(supabase, finding.auto_fix_action, finding.metadata || {});
            autoFixResults.push(result);
          } catch (e) {
            autoFixResults.push(`Failed to fix: ${finding.title} - ${e.message}`);
          }
        }
      }

      // Store findings
      if (allFindings.length > 0) {
        // Clear old security scan results
        await supabase.from("ai_scan_results").delete().eq("scan_type", "security").eq("status", "pending");
        await supabase.from("ai_scan_results").insert(allFindings.map(f => ({
          scan_type: "security",
          category: f.category,
          severity: f.severity,
          title: f.title,
          description: f.description,
          suggestion: f.suggestion,
          auto_fix_available: f.auto_fix_available,
          auto_fix_query: f.auto_fix_action || null,
          status: f.auto_fix_available && f.severity === "critical" ? "applied" : "pending",
          metadata: f.metadata || {},
        })));
      }

      // Log activity
      await supabase.from("ai_activity_log").insert({
        action: "security_scan_completed",
        details: `Daily security scan: ${allFindings.length} issues found. ${autoFixResults.length} auto-fixed. Fixes: ${autoFixResults.join("; ") || "none needed"}`,
        performed_by: null,
      });

      // AI learns from findings
      await aiSecurityLearning(supabase, lovableApiKey, allFindings);

      // Log knowledge update
      await supabase.from("ai_knowledge_updates").insert({
        update_type: "security_scan",
        summary: `Security scan completed: ${allFindings.length} findings, ${autoFixResults.length} auto-fixed`,
        items_updated: allFindings.length,
        triggered_by: "cron",
      });

      const stats = {
        total: allFindings.length,
        critical: allFindings.filter(f => f.severity === "critical").length,
        warning: allFindings.filter(f => f.severity === "warning").length,
        info: allFindings.filter(f => f.severity === "info").length,
        auto_fixed: autoFixResults.length,
      };

      return new Response(JSON.stringify({
        success: true,
        stats,
        findings: allFindings,
        auto_fix_results: autoFixResults,
        scan_time: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Security guard error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
