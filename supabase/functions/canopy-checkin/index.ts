import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHECKIN_RADIUS_M = 100;
const MIN_ACCURACY_M = 80;
const COOLDOWN_MINUTES = 10;
const MAX_USER_CHECKINS_PER_DAY = 50;
const MAX_TREE_CHECKINS_PER_DAY = 200;
const WITNESS_WINDOW_MINUTES = 10;

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const nowIso = () => new Date().toISOString();

const utcDayStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
};

type CheckinRejectReason =
  | "too_far"
  | "too_soon"
  | "low_accuracy"
  | "user_daily_cap"
  | "tree_daily_cap"
  | "missing_location";

const reasonMessage: Record<CheckinRejectReason, string> = {
  too_far: "You are outside this canopy radius right now.",
  too_soon: "Please wait before checking in to this tree again.",
  low_accuracy: "Location accuracy is too low for a verified check-in.",
  user_daily_cap: "You reached your daily check-in limit.",
  tree_daily_cap: "This tree reached its daily check-in limit.",
  missing_location: "We need your location to verify this check-in.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData } = await userClient.auth.getUser();
    const user = authData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = String(body?.action || "checkin");

    if (action === "witness") {
      const checkinId = String(body?.checkin_id || "").trim();
      const lat = Number(body?.latitude);
      const lng = Number(body?.longitude);
      const accuracyM = Number(body?.accuracy_m);

      if (!checkinId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return new Response(JSON.stringify({ error: "checkin_id, latitude, longitude are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!Number.isFinite(accuracyM) || accuracyM > MIN_ACCURACY_M) {
        return new Response(JSON.stringify({ error: "Witness location accuracy too low", reason: "low_accuracy" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: checkin, error: checkinError } = await adminClient
        .from("tree_checkins")
        .select("id,user_id,tree_id,checked_in_at,confidence_score,proof_types")
        .eq("id", checkinId)
        .maybeSingle();

      if (checkinError || !checkin) {
        return new Response(JSON.stringify({ error: "Check-in not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (checkin.user_id === user.id) {
        return new Response(JSON.stringify({ error: "You cannot witness your own check-in" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const checkinAgeMs = Date.now() - new Date(checkin.checked_in_at).getTime();
      if (checkinAgeMs > WITNESS_WINDOW_MINUTES * 60_000) {
        return new Response(JSON.stringify({ error: "Witness window expired", reason: "too_late" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tree } = await adminClient
        .from("trees")
        .select("latitude,longitude")
        .eq("id", checkin.tree_id)
        .maybeSingle();

      if (tree?.latitude == null || tree?.longitude == null) {
        return new Response(JSON.stringify({ error: "Tree location unavailable" }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const distanceM = haversineMeters(lat, lng, Number(tree.latitude), Number(tree.longitude));
      if (distanceM > CHECKIN_RADIUS_M) {
        return new Response(JSON.stringify({ error: "Witness is outside canopy radius", reason: "too_far" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: witnessError } = await adminClient.from("tree_checkin_witnesses").insert({
        checkin_id: checkin.id,
        witness_user_id: user.id,
        latitude: lat,
        longitude: lng,
        accuracy_m: accuracyM,
      });

      if (witnessError) {
        return new Response(JSON.stringify({ error: witnessError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const priorProof = Array.isArray(checkin.proof_types) ? checkin.proof_types : [];
      const nextProof = Array.from(new Set([...priorProof, "witness"]));
      const nextConfidence = Math.min(100, Math.max(Number(checkin.confidence_score || 0), 40) + 15);

      await adminClient
        .from("tree_checkins")
        .update({ proof_types: nextProof, confidence_score: nextConfidence })
        .eq("id", checkin.id);

      await adminClient.from("heart_transactions").insert({
        user_id: checkin.user_id,
        tree_id: checkin.tree_id,
        heart_type: "checkin_witness_bonus",
        amount: 1,
      });

      return new Response(JSON.stringify({
        ok: true,
        confidence_score: nextConfidence,
        proof_types: nextProof,
        hearts_awarded: 1,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const treeId = String(body?.tree_id || "").trim();
    const seasonStage = String(body?.season_stage || "other");
    const weather = body?.weather ? String(body.weather) : null;
    const reflection = body?.reflection ? String(body.reflection) : null;
    const moodScore = body?.mood_score == null ? null : Number(body.mood_score);
    const birdsongHeard = Boolean(body?.birdsong_heard);
    const fungiPresent = Boolean(body?.fungi_present);
    const healthNotes = body?.health_notes ? String(body.health_notes) : null;
    const softMode = false; // Soft mode disabled — proximity is required
    const hasOffering = Boolean(body?.has_offering);
    const lat = body?.latitude == null ? null : Number(body.latitude);
    const lng = body?.longitude == null ? null : Number(body.longitude);
    const accuracyM = body?.accuracy_m == null ? null : Number(body.accuracy_m);

    if (!treeId) {
      return new Response(JSON.stringify({ error: "tree_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tree, error: treeError } = await adminClient
      .from("trees")
      .select("id,latitude,longitude")
      .eq("id", treeId)
      .maybeSingle();

    if (treeError || !tree) {
      return new Response(JSON.stringify({ error: "Tree not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dayStartIso = utcDayStart();

    const [{ count: userCount, error: userCountError }, { count: treeCount, error: treeCountError }] = await Promise.all([
      adminClient.from("tree_checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("checked_in_at", dayStartIso),
      adminClient.from("tree_checkins").select("id", { count: "exact", head: true }).eq("tree_id", treeId).gte("checked_in_at", dayStartIso),
    ]);

    if (userCountError || treeCountError) {
      throw userCountError || treeCountError;
    }

    if ((userCount || 0) >= MAX_USER_CHECKINS_PER_DAY) {
      const reason: CheckinRejectReason = "user_daily_cap";
      return new Response(JSON.stringify({ accepted: false, reason, message: reasonMessage[reason] }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((treeCount || 0) >= MAX_TREE_CHECKINS_PER_DAY) {
      const reason: CheckinRejectReason = "tree_daily_cap";
      return new Response(JSON.stringify({ accepted: false, reason, message: reasonMessage[reason] }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recentOwn } = await adminClient
      .from("tree_checkins")
      .select("checked_in_at")
      .eq("user_id", user.id)
      .eq("tree_id", treeId)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOwn?.checked_in_at) {
      const elapsedMs = Date.now() - new Date(recentOwn.checked_in_at).getTime();
      if (elapsedMs < COOLDOWN_MINUTES * 60_000) {
        const reason: CheckinRejectReason = "too_soon";
        return new Response(JSON.stringify({ accepted: false, reason, message: reasonMessage[reason] }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let canopyProof = false;
    let confidence = 20;
    const proofTypes: string[] = [];

    if (!softMode) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        const reason: CheckinRejectReason = "missing_location";
        return new Response(JSON.stringify({ accepted: false, reason, message: reasonMessage[reason] }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!Number.isFinite(accuracyM) || Number(accuracyM) > MIN_ACCURACY_M) {
        const reason: CheckinRejectReason = "low_accuracy";
        return new Response(JSON.stringify({ accepted: false, reason, message: reasonMessage[reason] }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (tree.latitude != null && tree.longitude != null) {
        const distanceM = haversineMeters(Number(lat), Number(lng), Number(tree.latitude), Number(tree.longitude));
        if (distanceM > CHECKIN_RADIUS_M) {
          const reason: CheckinRejectReason = "too_far";
          return new Response(JSON.stringify({ accepted: false, reason, message: reasonMessage[reason] }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      canopyProof = true;
      confidence = 70;
      proofTypes.push("gps");
      if (Number(accuracyM) <= 20) confidence += 10;
    }

    if (hasOffering) {
      proofTypes.push("offering");
      confidence += 15;
    }

    confidence = Math.min(100, confidence);

    const { data: inserted, error: insertError } = await adminClient
      .from("tree_checkins")
      .insert({
        tree_id: treeId,
        user_id: user.id,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
        season_stage: seasonStage,
        weather,
        reflection,
        mood_score: Number.isFinite(moodScore) ? moodScore : null,
        canopy_proof: canopyProof,
        birdsong_heard: birdsongHeard,
        fungi_present: fungiPresent,
        health_notes: healthNotes,
        accuracy_m: Number.isFinite(accuracyM) ? accuracyM : null,
        proof_types: proofTypes,
        confidence_score: confidence,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw insertError;
    }

    let heartsAwarded = 0;

    if (canopyProof) {
      await adminClient.from("heart_transactions").insert({
        user_id: user.id,
        tree_id: treeId,
        heart_type: "checkin",
        amount: 1,
      });
      heartsAwarded += 1;

      if (hasOffering) {
        await adminClient.from("heart_transactions").insert({
          user_id: user.id,
          tree_id: treeId,
          heart_type: "checkin_offering_bonus",
          amount: 1,
        });
        heartsAwarded += 1;
      }
    }

    return new Response(JSON.stringify({
      accepted: true,
      checkin_id: inserted.id,
      canopy_proof: canopyProof,
      confidence_score: confidence,
      proof_types: proofTypes,
      hearts_awarded: heartsAwarded,
      cooldown_minutes: COOLDOWN_MINUTES,
      limits: {
        max_user_checkins_per_day: MAX_USER_CHECKINS_PER_DAY,
        max_tree_checkins_per_day: MAX_TREE_CHECKINS_PER_DAY,
      },
      checked_in_at: nowIso(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
