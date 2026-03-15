import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { ethers } from "https://esm.sh/ethers@6.13.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * mint-nftree edge function — EIP-712 authorization model
 *
 * 1. Authenticates the caller via Supabase JWT
 * 2. Validates staff ownership in DB + on-chain
 * 3. Generates real ERC-721 metadata JSON and stores it
 * 4. Creates a pending nftree_mints row
 * 5. Signs an EIP-712 MintAuth struct for the NFTree contract
 * 6. Returns the signed authorization for the frontend to submit on-chain
 *
 * POST body:
 *   { treeId, offeringId, staffId, staffTokenId, minterAddress, title, description, imageUri }
 *
 * Returns:
 *   { mintId, authorization: { metadataUri, staffTokenId, treeRef, offeringRef, nonce, deadline, signature }, chainId }
 */

// EIP-712 type hash — must match the contract's MINT_AUTH_TYPEHASH
const MINT_AUTH_TYPES = {
  MintAuth: [
    { name: "minter", type: "address" },
    { name: "staffTokenId", type: "uint256" },
    { name: "treeRef", type: "bytes32" },
    { name: "offeringRef", type: "bytes32" },
    { name: "metadataURI", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { treeId, offeringId, staffId, staffTokenId, minterAddress, title, description, imageUri } = body;

    if (!treeId || !staffId || !staffTokenId || !minterAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: treeId, staffId, staffTokenId, minterAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // ── 1. Verify staff ownership in DB ──
    const { data: staff, error: staffErr } = await supabaseAdmin
      .from("staffs")
      .select("id, token_id, owner_address, owner_user_id, species, verified_at")
      .eq("id", staffId)
      .single();

    if (staffErr || !staff) {
      return new Response(JSON.stringify({ error: "Staff not found in registry" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (staff.owner_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Staff is not owned by authenticated user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (staff.owner_address?.toLowerCase() !== minterAddress.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Wallet address does not match staff owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Verify Staff ownership on-chain ──
    const rpcUrl = Deno.env.get("BASE_RPC_URL") || "https://mainnet.base.org";
    const staffContractAddress = Deno.env.get("STAFF_CONTRACT_ADDRESS");

    if (staffContractAddress) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const staffContract = new ethers.Contract(
          staffContractAddress,
          ["function ownerOf(uint256 tokenId) view returns (address)"],
          provider
        );
        const onChainOwner = await staffContract.ownerOf(Number(staffTokenId));
        if (onChainOwner.toLowerCase() !== minterAddress.toLowerCase()) {
          return new Response(
            JSON.stringify({ error: "On-chain verification failed: wallet does not own this Staff NFT" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (chainErr: any) {
        console.error("On-chain Staff verification failed:", chainErr.message);
        return new Response(
          JSON.stringify({ error: "Could not verify Staff NFT ownership on-chain. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── 3. Fetch tree data for metadata ──
    const { data: tree } = await supabaseAdmin
      .from("trees")
      .select("id, name, species, latitude, longitude, nation")
      .eq("id", treeId)
      .single();

    // ── 4. Generate ERC-721 metadata JSON ──
    const metadata = {
      name: title || tree?.name || `NFTree #${treeId.slice(0, 8)}`,
      description: description || `An Ancient Friend sealed on-chain by a ${staff.species || "Staff"} holder.`,
      image: imageUri || "",
      external_url: `https://ancient-roots-map.lovable.app/tree/${treeId}`,
      attributes: [
        { trait_type: "Tree Species", value: tree?.species || "Unknown" },
        { trait_type: "Staff Species", value: staff.species || "Unknown" },
        { trait_type: "Staff Token ID", value: Number(staffTokenId) },
        { trait_type: "Nation", value: tree?.nation || "Unknown" },
        ...(tree?.latitude ? [{ trait_type: "Latitude", value: tree.latitude, display_type: "number" }] : []),
        ...(tree?.longitude ? [{ trait_type: "Longitude", value: tree.longitude, display_type: "number" }] : []),
        { trait_type: "Tree ID", value: treeId },
        ...(offeringId ? [{ trait_type: "Offering ID", value: offeringId }] : []),
        { trait_type: "Sealed At", value: new Date().toISOString() },
      ],
    };

    // Store metadata JSON in Supabase Storage
    const metadataFileName = `nftree-metadata/${treeId}/${Date.now()}.json`;
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("offerings")
      .upload(metadataFileName, metadataBlob, {
        contentType: "application/json",
        cacheControl: "31536000", // immutable
        upsert: false,
      });

    let metadataUri: string;
    if (uploadErr) {
      console.error("Metadata upload failed:", uploadErr);
      // Fallback: encode metadata as data URI (not ideal but ensures mint can proceed)
      metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    } else {
      const { data: urlData } = supabaseAdmin.storage.from("offerings").getPublicUrl(metadataFileName);
      metadataUri = urlData.publicUrl;
    }

    // ── 5. Generate authorization ──
    const chainId = Number(Deno.env.get("NFTREE_CHAIN_ID") || "8453");
    const nftreeContractAddress = Deno.env.get("NFTREE_CONTRACT_ADDRESS");
    const authorizerPrivateKey = Deno.env.get("NFTREE_AUTHORIZER_PRIVATE_KEY");

    if (!nftreeContractAddress || !authorizerPrivateKey) {
      // Contract not deployed yet — create pending record without authorization
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
          metadata_uri: metadataUri,
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
          status: "pending_deployment",
          message: "NFTree contract is not yet deployed. Your mint has been recorded and will be available once the contract is live.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 6. Compute refs and sign EIP-712 ──
    const treeRef = ethers.keccak256(ethers.toUtf8Bytes(treeId));
    const offeringRef = offeringId
      ? ethers.keccak256(ethers.toUtf8Bytes(offeringId))
      : ethers.ZeroHash;

    const nonce = BigInt("0x" + crypto.randomUUID().replace(/-/g, ""));
    const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes

    const domain = {
      name: "NFTree",
      version: "1",
      chainId,
      verifyingContract: nftreeContractAddress,
    };

    const authWallet = new ethers.Wallet(authorizerPrivateKey);
    const signature = await authWallet.signTypedData(domain, MINT_AUTH_TYPES, {
      minter: minterAddress,
      staffTokenId: Number(staffTokenId),
      treeRef,
      offeringRef,
      metadataURI: metadataUri,
      nonce,
      deadline,
    });

    // ── 7. Create pending mint record ──
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
        contract_address: nftreeContractAddress,
        metadata_uri: metadataUri,
        image_uri: imageUri || null,
        mint_status: "authorized",
        authorization_nonce: nonce.toString(),
        authorization_deadline: new Date(deadline * 1000).toISOString(),
        authorization_signature: signature,
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
        chainId,
        authorization: {
          metadataUri,
          staffTokenId: Number(staffTokenId),
          treeRef,
          offeringRef,
          nonce: nonce.toString(),
          deadline,
          signature,
        },
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
