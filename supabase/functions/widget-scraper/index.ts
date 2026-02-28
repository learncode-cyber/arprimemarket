import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { widget_id, url } = await req.json();
    if (!widget_id || !url) {
      return new Response(JSON.stringify({ error: "widget_id and url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify widget exists
    const { data: widget } = await supabase
      .from("widget_configs")
      .select("id, site_url")
      .eq("id", widget_id)
      .single();

    if (!widget) {
      return new Response(JSON.stringify({ error: "Widget not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scrape the website - fetch main page and key subpages
    const pagesToScrape = [
      url,
      `${url}/products`,
      `${url}/about`,
      `${url}/faq`,
      `${url}/contact`,
    ];

    let allContent = "";
    let pagesScraped = 0;

    for (const pageUrl of pagesToScrape) {
      try {
        const resp = await fetch(pageUrl, {
          headers: { "User-Agent": "AR-Prime-AI-Bot/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (resp.ok) {
          const html = await resp.text();
          // Extract text content (strip HTML tags)
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 5000); // Limit per page
          if (text.length > 100) {
            allContent += `\n--- Page: ${pageUrl} ---\n${text}\n`;
            pagesScraped++;
          }
        }
      } catch (e) {
        console.log(`Failed to scrape ${pageUrl}:`, e);
      }
    }

    // Use AI to summarize and structure the scraped content
    let structuredData: any = { pages_count: pagesScraped, raw_length: allContent.length };

    if (lovableApiKey && allContent.length > 0) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "You extract and structure website content into JSON. Return ONLY valid JSON with these fields: products (string summary of products/services), faqs (common questions and answers), about (company info), pages_summary (brief overview of all pages), products_count (number), faqs_count (number)."
              },
              {
                role: "user",
                content: `Extract structured data from this website content:\n${allContent.slice(0, 15000)}`
              },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Try to parse JSON from AI response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              structuredData = { ...structuredData, ...parsed };
            } catch {}
          }
        }
      } catch (e) {
        console.error("AI summarization error:", e);
      }
    }

    // Save scraped data to widget config
    await supabase
      .from("widget_configs")
      .update({
        scraped_data: structuredData,
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", widget_id);

    return new Response(JSON.stringify({
      success: true,
      pages_scraped: pagesScraped,
      data_summary: structuredData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Scraper error:", err);
    return new Response(JSON.stringify({ error: "Scraping failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
