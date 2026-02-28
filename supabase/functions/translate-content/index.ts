import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts, target_lang, content_type = "product", content_id } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !target_lang) {
      return new Response(JSON.stringify({ error: "texts (array) and target_lang required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't translate English to English
    if (target_lang === "en") {
      return new Response(JSON.stringify({ translations: texts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit batch size
    if (texts.length > 10) {
      return new Response(JSON.stringify({ error: "Max 10 texts per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("translations_cache")
      .select("source_text, translated_text")
      .eq("target_lang", target_lang)
      .in("source_text", texts);

    const cachedMap = new Map((cached || []).map((c: any) => [c.source_text, c.translated_text]));
    const uncachedTexts = texts.filter((t: string) => !cachedMap.has(t));

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      const translations = texts.map((t: string) => cachedMap.get(t) || t);
      return new Response(JSON.stringify({ translations, source: "cache" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Translate uncached texts using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: return original texts if no AI key
      return new Response(JSON.stringify({ translations: texts, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langNames: Record<string, string> = {
      bn: "Bengali", ar: "Arabic", sa: "Arabic", hi: "Hindi", es: "Spanish",
      fr: "French", de: "German", zh: "Chinese (Simplified)", ja: "Japanese",
      pt: "Portuguese", ko: "Korean", ru: "Russian", tr: "Turkish", th: "Thai",
      vi: "Vietnamese", id: "Indonesian", ms: "Malay", sw: "Swahili", tl: "Filipino",
      ur: "Urdu", fa: "Persian", it: "Italian", nl: "Dutch", pl: "Polish",
      uk: "Ukrainian", ro: "Romanian", sv: "Swedish", da: "Danish", no: "Norwegian",
      fi: "Finnish", el: "Greek", hu: "Hungarian", cs: "Czech", he: "Hebrew",
    };

    const targetName = langNames[target_lang] || target_lang;
    const prompt = uncachedTexts.length === 1
      ? `Translate the following text to ${targetName}. Return ONLY the translated text, nothing else:\n\n${uncachedTexts[0]}`
      : `Translate each of the following texts to ${targetName}. Return ONLY a JSON array of translated strings in the same order, no extra text:\n\n${JSON.stringify(uncachedTexts)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a professional translator. Translate accurately and naturally. For ecommerce product content, keep brand names and technical terms unchanged. Return ONLY the translation, no explanations." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Translation rate limit exceeded, try again later", translations: texts }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted", translations: texts }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ translations: texts, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content?.trim() || "";

    let translatedUncached: string[];
    if (uncachedTexts.length === 1) {
      translatedUncached = [rawContent];
    } else {
      try {
        // Try to parse as JSON array
        const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim();
        translatedUncached = JSON.parse(cleaned);
        if (!Array.isArray(translatedUncached)) throw new Error("Not array");
      } catch {
        // Fallback: split by newlines
        translatedUncached = rawContent.split("\n").filter((s: string) => s.trim());
        if (translatedUncached.length !== uncachedTexts.length) {
          translatedUncached = uncachedTexts; // give up, return originals
        }
      }
    }

    // Cache the new translations
    const insertRows = uncachedTexts.map((src: string, i: number) => ({
      source_text: src,
      source_lang: "en",
      target_lang,
      translated_text: translatedUncached[i] || src,
      content_type,
      content_id: content_id || null,
    }));

    await supabase.from("translations_cache").upsert(insertRows, { onConflict: "source_text,target_lang" });

    // Merge cached + newly translated
    let uncachedIdx = 0;
    const translations = texts.map((t: string) => {
      if (cachedMap.has(t)) return cachedMap.get(t);
      return translatedUncached[uncachedIdx++] || t;
    });

    return new Response(JSON.stringify({ translations, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
