/**
 * Support service — client-side helpers for garden support contributions.
 * Connects to Stripe checkout via edge function.
 */
import { supabase } from "@/integrations/supabase/client";

export interface CreateCheckoutParams {
  amount: number; // in minor units (pence)
  mode: "one_time" | "recurring";
  tierId?: string;
}

export async function createSupportCheckout(params: CreateCheckoutParams): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke("create-support-checkout", {
    body: {
      amount: params.amount,
      mode: params.mode,
      tierId: params.tierId,
      returnUrl: window.location.origin,
    },
  });

  if (error || !data?.url) {
    console.warn("[supportService] checkout failed", error);
    return null;
  }

  return data.url as string;
}

export async function getUserContributions(userId: string) {
  const { data } = await supabase
    .from("value_contributions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}
