/**
 * create-support-checkout — Creates a Stripe Checkout session for garden support.
 * Supports one-time and recurring contributions.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-03-31.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Parse request
    const body = await req.json();
    const { amount, mode, tierId, returnUrl } = body as {
      amount: number;
      mode: "one_time" | "recurring";
      tierId?: string;
      returnUrl?: string;
    };

    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: "Minimum contribution is £1" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = returnUrl || req.headers.get("origin") || "https://ancient-roots-map.lovable.app";

    // Build Stripe session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: mode === "recurring" ? "subscription" : "payment",
      success_url: `${origin}/support?result=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/support?result=cancelled`,
      metadata: {
        user_id: userId,
        tier_id: tierId || "custom",
        contribution_mode: mode,
      },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: amount,
            product_data: {
              name: mode === "recurring"
                ? `Monthly Garden Support${tierId ? ` — ${tierId}` : ""}`
                : "Garden Support",
              description: "Supporting the S33D grove and ancient tree network",
            },
            ...(mode === "recurring" ? { recurring: { interval: "month" } } : {}),
          },
          quantity: 1,
        },
      ],
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record pending contribution
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("value_contributions").insert({
      user_id: userId,
      rail: "stripe",
      rail_session_id: session.id,
      amount_minor: amount,
      currency: "gbp",
      contribution_mode: mode,
      status: "pending",
      metadata: { tier_id: tierId },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
