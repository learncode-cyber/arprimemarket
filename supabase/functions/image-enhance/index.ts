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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: require admin role
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) return json({ error: "Forbidden: admin access required" }, 403);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { action, image_url, product_title } = await req.json();

    if (action === "enhance") {
      if (!image_url) return json({ error: "image_url required" }, 400);

      const prompt = product_title
        ? `Remove the background from this product image and place the product on a clean, pure white background. Make the product look professional and well-lit for an ecommerce listing. The product is: ${product_title}. Ensure the product is centered, well-exposed, and the white background is seamless.`
        : `Remove the background from this product image and place it on a clean, pure white background. Make it look professional for an ecommerce product listing. Center the product, ensure good lighting, and create a seamless white background.`;

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image_url } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
        if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
        const t = await res.text();
        console.error("AI image error:", res.status, t);
        return json({ error: "Image enhancement failed" }, 500);
      }

      const data = await res.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        return json({ error: "No enhanced image generated" }, 500);
      }

      return json({ success: true, enhanced_image: imageData });
    }

    if (action === "generate") {
      if (!product_title) return json({ error: "product_title required" }, 400);

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Generate a professional ecommerce product photo for: "${product_title}". The product should be on a clean white background, well-lit, centered, with professional studio lighting. Make it look like a high-end Amazon product listing photo.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
        if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
        return json({ error: "Image generation failed" }, 500);
      }

      const data = await res.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) return json({ error: "No image generated" }, 500);

      return json({ success: true, generated_image: imageData });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[image-enhance]", msg);
    return json({ error: msg }, 500);
  }
});
