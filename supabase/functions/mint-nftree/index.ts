import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * mint-nftree edge function
 *
 * Validates that the caller owns a Staff NFT on-chain, then records
 * the mint intent in Supabase so the frontend can proceed with the
 * on-chain transaction. The actual contract call happens client-side
 * (or via a future relayer), and the client updates the DB row with
 * the tx hash / token ID after confirmation.
 *
 * POST body:
 *   { treeId, offeringId, staffId, staffTokenId, minterAddress, metadataUri, imageUri }
 *
 * Returns:
 *   { mintId, status: "authorized" } or { error }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client for the caller
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { treeId, offeringId, staffId, staffTokenId, minterAddress, metadataUri, imageUri } = body;

    if (!treeId || !staffId || !staffTokenId || !minterAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: treeId, staffId, staffTokenId, minterAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for trusted operations
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 1. Verify staff ownership in DB (cached from on-chain sync)
    const { data: staff, error: staffErr } = await supabaseAdmin
      .from("staffs")
      .select("id, token_id, owner_address, owner_user_id, verified_at")
      .eq("id", staffId)
      .single();

    if (staffErr || !staff) {
      return new Response(JSON.stringify({ error: "Staff not found in registry" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership matches the authenticated user
    if (staff.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Staff is not owned by authenticated user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify wallet address matches
    if (staff.owner_address?.toLowerCase() !== minterAddress.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Wallet address does not match staff owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify staff was synced from chain recently (within 24 hours)
    if (staff.verified_at) {
      const verifiedAge = Date.now() - new Date(staff.verified_at).getTime();
      const MAX_AGE_MS = 24 * 60 * 60 * 1000;
      if (verifiedAge > MAX_AGE_MS) {
        return new Response(
          JSON.stringify({ error: "Staff ownership verification is stale. Please reconnect your wallet to re-sync." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Create mint record with 'pending' status
    const chainId = 8453; // Base mainnet
    const { data: mint, error: mintErr } = await supabaseAdmin
      .from("nftree_mints")
      .insert({
        tree_id: treeId,
        offering_id: offeringId || null,
        staff_id: staffId,
        staff_token_id: Number(staffTokenId),
        minter_address: minterAddress.toLowerCase(),
        minter_user_id: user.id,
        chain_id: chainId,
        metadata_uri: metadataUri || null,
        image_uri: imageUri || null,
        mint_status: "pending",
      })
      .select("id")
      .single();

    if (mintErr) {
      console.error("Failed to create mint record:", mintErr);
      return new Response(JSON.stringify({ error: "Failed to create mint record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        mintId: mint.id,
        status: "authorized",
        staffTokenId: staff.token_id,
        chainId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("mint-nftree error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
