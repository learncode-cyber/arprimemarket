import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Binance Pay API endpoints
const BINANCE_PAY_API = "https://bpay.binanceapi.com";

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateNonce(length = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => chars[b % chars.length])
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BINANCE_MERCHANT_KEY = Deno.env.get("BINANCE_PAY_MERCHANT_KEY");
    const BINANCE_SECRET_KEY = Deno.env.get("BINANCE_PAY_SECRET_KEY");

    if (!BINANCE_MERCHANT_KEY || !BINANCE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: "Binance Pay is not configured yet. Please add your Merchant Key and Secret Key.",
        fallback: true,
      }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...params } = await req.json();

    // ── CREATE ORDER ──
    if (action === "create_order") {
      const { orderId, orderNumber, amount, currency = "USDT", description, returnUrl, cancelUrl } = params;

      if (!orderId || !amount) {
        return new Response(JSON.stringify({ error: "Missing orderId or amount" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const timestamp = Date.now();
      const nonce = generateNonce();

      const body = {
        env: { terminalType: "WEB" },
        merchantTradeNo: orderNumber || `ARP-${Date.now()}`,
        orderAmount: parseFloat(amount).toFixed(2),
        currency: currency,
        description: description || `AR Prime Market Order #${orderNumber}`,
        goodsType: "02", // Virtual goods
        returnUrl: returnUrl || "",
        cancelUrl: cancelUrl || "",
        webhookUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/binance-pay?action=webhook`,
      };

      const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
      const signature = await generateSignature(payload, BINANCE_SECRET_KEY);

      const response = await fetch(`${BINANCE_PAY_API}/binancepay/openapi/v3/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "BinancePay-Timestamp": timestamp.toString(),
          "BinancePay-Nonce": nonce,
          "BinancePay-Certificate-SN": BINANCE_MERCHANT_KEY,
          "BinancePay-Signature": signature.toUpperCase(),
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.status === "SUCCESS" && result.data) {
        // Update order with Binance prepay ID
        await supabase.from("orders").update({
          payment_reference: result.data.prepayId,
          payment_status: "awaiting_payment",
        }).eq("id", orderId);

        // Create payment transaction record
        await supabase.from("payment_transactions").insert({
          order_id: orderId,
          payment_method_key: "binance_pay",
          amount: parseFloat(amount),
          currency: currency,
          status: "pending",
          transaction_reference: result.data.prepayId,
        });

        return new Response(JSON.stringify({
          success: true,
          checkoutUrl: result.data.universalUrl || result.data.checkoutUrl,
          prepayId: result.data.prepayId,
          qrContent: result.data.qrcodeLink,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        console.error("Binance Pay API error:", result);
        return new Response(JSON.stringify({
          error: result.errorMessage || "Failed to create Binance Pay order",
          code: result.code,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── QUERY ORDER STATUS ──
    if (action === "query_order") {
      const { prepayId, merchantTradeNo } = params;

      const timestamp = Date.now();
      const nonce = generateNonce();

      const body: any = {};
      if (prepayId) body.prepayId = prepayId;
      if (merchantTradeNo) body.merchantTradeNo = merchantTradeNo;

      const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
      const signature = await generateSignature(payload, BINANCE_SECRET_KEY);

      const response = await fetch(`${BINANCE_PAY_API}/binancepay/openapi/v2/order/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "BinancePay-Timestamp": timestamp.toString(),
          "BinancePay-Nonce": nonce,
          "BinancePay-Certificate-SN": BINANCE_MERCHANT_KEY,
          "BinancePay-Signature": signature.toUpperCase(),
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── WEBHOOK (Binance Pay callback) ──
    if (action === "webhook") {
      const webhookData = params;
      console.log("Binance Pay webhook received:", JSON.stringify(webhookData));

      if (webhookData.bizType === "PAY" && webhookData.bizStatus === "PAY_SUCCESS") {
        const data = typeof webhookData.data === "string"
          ? JSON.parse(webhookData.data)
          : webhookData.data;

        const merchantTradeNo = data.merchantTradeNo;
        const transactionId = data.transactionId;

        // Update order
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("order_number", merchantTradeNo)
          .single();

        if (order) {
          await supabase.from("orders").update({
            payment_status: "paid",
            payment_reference: transactionId,
          }).eq("id", order.id);

          await supabase.from("payment_transactions").update({
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
            transaction_reference: transactionId,
          }).eq("order_id", order.id).eq("payment_method_key", "binance_pay");
        }

        return new Response(JSON.stringify({ returnCode: "SUCCESS", returnMessage: null }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ returnCode: "SUCCESS" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Binance Pay function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
