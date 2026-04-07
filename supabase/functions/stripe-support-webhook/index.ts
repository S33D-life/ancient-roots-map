/**
 * stripe-support-webhook — Handles Stripe webhook events for garden support.
 * Confirms contributions, grants gratitude hearts (idempotently).
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

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Hearts per £1 of support
const HEARTS_PER_POUND = 10;

function calculateGratitudeHearts(amountMinor: number): number {
  const pounds = amountMinor / 100;
  return Math.max(1, Math.floor(pounds * HEARTS_PER_POUND));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (WEBHOOK_SECRET && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
    } else {
      // Sandbox / dev fallback — parse directly
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`[webhook] Received: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const sessionId = session.id;

      if (!userId) {
        console.warn("[webhook] No user_id in metadata, skipping");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Idempotency: check if already confirmed
      const { data: existing } = await supabase
        .from("value_contributions")
        .select("id, status, hearts_granted")
        .eq("rail_session_id", sessionId)
        .eq("rail", "stripe")
        .maybeSingle();

      if (existing?.status === "confirmed") {
        console.log("[webhook] Already confirmed, skipping");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const amountMinor = session.amount_total || 0;
      const hearts = calculateGratitudeHearts(amountMinor);
      const idempotencyKey = `support_gratitude:${sessionId}`;

      // Update or insert contribution
      if (existing) {
        await supabase
          .from("value_contributions")
          .update({
            status: "confirmed",
            amount_minor: amountMinor,
            hearts_granted: hearts,
            hearts_granted_at: new Date().toISOString(),
            rail_subscription_id: (session.subscription as string) || null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("value_contributions").insert({
          user_id: userId,
          rail: "stripe",
          rail_session_id: sessionId,
          amount_minor: amountMinor,
          currency: session.currency || "gbp",
          contribution_mode: session.mode === "subscription" ? "recurring" : "one_time",
          status: "confirmed",
          hearts_granted: hearts,
          hearts_granted_at: new Date().toISOString(),
          rail_subscription_id: (session.subscription as string) || null,
          metadata: session.metadata || {},
        });
      }

      // Grant gratitude hearts via heart_ledger ONLY (idempotent via unique key)
      // heart_transactions is optional/legacy — skip to avoid duplicates
      const { error: ledgerErr } = await supabase.from("heart_ledger").insert({
        user_id: userId,
        amount: hearts,
        transaction_type: "earn_support_gratitude",
        currency_type: "S33D",
        source: "stripe_contribution",
        entity_type: "value_contribution",
        entity_id: sessionId,
        status: "confirmed",
        chain_state: "offchain",
        idempotency_key: idempotencyKey,
        metadata: {
          amount_minor: amountMinor,
          currency: session.currency,
          contribution_mode: session.mode,
        },
      });

      if (ledgerErr) {
        // If idempotency_key unique violation, that's expected on replays
        if (ledgerErr.code === "23505") {
          console.log("[webhook] Ledger entry already exists (idempotent), skipping");
        } else {
          console.error("[webhook] Ledger insert error:", ledgerErr);
        }
      }

      console.log(`[webhook] Confirmed contribution ${sessionId}, granted ${hearts} hearts to ${userId}`);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("value_contributions")
        .update({ status: "cancelled" })
        .eq("rail_session_id", session.id)
        .eq("rail", "stripe")
        .eq("status", "pending");
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("value_contributions")
        .update({
          status: "cancelled",
          metadata: { cancelled_at: new Date().toISOString() },
        })
        .eq("rail_subscription_id", sub.id)
        .eq("rail", "stripe");
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("[webhook] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
