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

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "product_content",
            description: "Return generated product content",
            parameters: {
              type: "object",
              properties: {
                description: { type: "string", description: "Professional product description, 150-300 words, persuasive, human-like" },
                features: { type: "array", items: { type: "string" }, description: "5-7 key feature bullet points" },
                meta_title: { type: "string", description: "SEO meta title, max 60 chars with keyword" },
                meta_description: { type: "string", description: "SEO meta description, max 160 chars" },
                tags: { type: "array", items: { type: "string" }, description: "8-12 relevant product tags for search" },
                description_bn: { type: "string", description: "Bengali translation of description" },
                description_ar: { type: "string", description: "Arabic translation of description" },
              },
              required: ["description", "features", "meta_title", "meta_description", "tags"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "product_content" } },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) return { error: "Rate limited. Try again shortly.", status: 429 };
    if (res.status === 402) return { error: "AI credits exhausted.", status: 402 };
    const t = await res.text();
    console.error("AI error:", res.status, t);
    return { error: "AI generation failed", status: 500 };
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { error: "No content generated", status: 500 };

  try {
    return { data: JSON.parse(toolCall.function.arguments), status: 200 };
  } catch {
    return { error: "Failed to parse AI response", status: 500 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { action, product_id, title, current_description, category, price } = body;

    if (action === "generate") {
      if (!title) return json({ error: "Product title required" }, 400);

      const systemPrompt = `You are an expert ecommerce copywriter and SEO specialist. Write compelling, human-like product content that converts browsers into buyers. Avoid AI-sounding phrases like "elevate your", "game-changer", "unlock". Be specific, benefit-driven, and natural. Include sensory language and social proof cues. Generate content in English, Bengali (বাংলা), and Arabic (العربية).`;

      const userPrompt = `Generate professional product content for:
Title: ${title}
Category: ${category || "General"}
Price: ${price || "N/A"}
${current_description ? `Current supplier description: ${current_description}` : ""}

Requirements:
- Rewrite any supplier description professionally (don't copy it)
- Description: 150-300 words, persuasive, highlight benefits not just features
- Features: 5-7 concise bullet points
- Meta title: Under 60 chars, include primary keyword
- Meta description: Under 160 chars, include CTA
- Tags: 8-12 relevant search tags
- Bengali & Arabic translations of description`;

      const result = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
      if (result.error) return json({ error: result.error }, result.status);

      // If product_id provided, save to DB
      if (product_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.from("products").update({
          description: result.data.description,
          tags: result.data.tags,
        }).eq("id", product_id);
      }

      return json({ success: true, content: result.data });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[ai-content]", msg);
    return json({ error: msg }, 500);
  }
});
