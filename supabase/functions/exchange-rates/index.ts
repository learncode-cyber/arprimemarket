import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FALLBACK_RATES: Record<string, number> = {
  BDT: 1,
  USD: 0.0083,
  CAD: 0.012,
  AED: 0.031,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use exchangerate-api.com free tier (no key needed for open access)
    const res = await fetch("https://open.er-api.com/v6/latest/BDT", {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API returned ${res.status}`);
    }

    const data = await res.json();

    if (data.result !== "success" || !data.rates) {
      throw new Error("Invalid response from exchange rate API");
    }

    const rates: Record<string, number> = {
      BDT: 1,
      USD: data.rates.USD || FALLBACK_RATES.USD,
      CAD: data.rates.CAD || FALLBACK_RATES.CAD,
      AED: data.rates.AED || FALLBACK_RATES.AED,
    };

    return new Response(JSON.stringify({ rates, source: "live", timestamp: data.time_last_update_utc }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("Exchange rate fetch error:", error);

    // Return fallback rates on error
    return new Response(JSON.stringify({ rates: FALLBACK_RATES, source: "fallback", timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
