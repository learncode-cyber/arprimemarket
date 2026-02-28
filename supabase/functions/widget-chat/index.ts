import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { widget_id, message, history } = await req.json();
    if (!widget_id || !message) {
      return new Response(JSON.stringify({ error: "widget_id and message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch widget config
    const { data: widget } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("id", widget_id)
      .eq("is_active", true)
      .single();

    if (!widget) {
      return new Response(JSON.stringify({ error: "Widget not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from scraped data
    let scrapedContext = "";
    if (widget.scraped_data && Object.keys(widget.scraped_data).length > 0) {
      const sd = widget.scraped_data;
      if (sd.products) scrapedContext += `\n\nPRODUCTS:\n${sd.products}`;
      if (sd.faqs) scrapedContext += `\n\nFAQs:\n${sd.faqs}`;
      if (sd.about) scrapedContext += `\n\nABOUT:\n${sd.about}`;
      if (sd.pages_summary) scrapedContext += `\n\nSITE CONTENT:\n${sd.pages_summary}`;
    }

    const systemPrompt = `You are an AI assistant for "${widget.site_name}" (${widget.site_url}).

ROLE: ${widget.ai_persona}

CORE OBJECTIVES:
1. SALES EXPERT: Your primary goal is to increase revenue and conversions. Use proven sales psychology.
2. SUPPORT: Provide instant, helpful support for customer questions.
3. ENGAGEMENT: Keep conversations going, build trust, recommend products/services.

SALES TECHNIQUES:
- Use scarcity, social proof, urgency naturally
- Cross-sell and upsell when appropriate
- Remove buying friction — make it easy to purchase
- Build rapport before selling
- Handle objections with empathy + solution

RULES:
- Be concise (max 500 chars per response)
- Use emojis sparingly (2-3 max)
- Respond in the customer's language
- If you don't know something, say so honestly
- Never make up information not in your knowledge base
${scrapedContext}`;

    const aiPayload = {
      model: "google/gemini-2.5-flash-lite",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...(history || []).slice(-10),
        { role: "user", content: message },
      ],
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ reply: "Sorry, I'm having trouble. Please try again!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("Widget chat error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
