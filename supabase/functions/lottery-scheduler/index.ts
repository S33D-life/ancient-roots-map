// Lottery scheduler — runs every hour via pg_cron.
//
// Responsibilities:
//   1. Execute any pending lottery_draws whose scheduled_at <= now()
//   2. Re-seed the next 4 lunar draws (idempotent) so there's always a queue
//
// All DB writes go through SECURITY DEFINER RPCs in public schema, called
// with the service-role key. No client-facing endpoints needed.

import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import * as Astro from "npm:astronomy-engine@2.1.19";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PendingDraw {
  id: string;
  draw_type: string;
  scheduled_at: string;
}

function nextUtcMidnightAfter(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0)
  );
}

type LunarType = "lunar_new" | "lunar_full";
type SolarType =
  | "solar_equinox_spring"
  | "solar_solstice_summer"
  | "solar_equinox_autumn"
  | "solar_solstice_winter";

function nextLunarMoments(count: number, from: Date): Array<{
  draw_type: LunarType;
  scheduled_at: Date;
}> {
  const out: Array<{ draw_type: LunarType; scheduled_at: Date }> = [];
  let cursor = new Date(from.getTime());
  while (out.length < count) {
    const nm = Astro.SearchMoonPhase(0, cursor, 40);
    if (nm) {
      out.push({ draw_type: "lunar_new", scheduled_at: nextUtcMidnightAfter(nm.date) });
    }
    if (out.length >= count) break;
    const fm = Astro.SearchMoonPhase(180, nm ? nm.date : cursor, 40);
    if (fm) {
      out.push({ draw_type: "lunar_full", scheduled_at: nextUtcMidnightAfter(fm.date) });
    }
    cursor = new Date((fm ?? nm)!.date.getTime() + 60 * 60 * 1000);
  }
  return out
    .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime())
    .slice(0, count);
}

/**
 * Returns the next `count` solar events (equinox/solstice) at or after `from`,
 * snapped to the lottery moment (next UTC midnight after the astronomical event).
 * Walks year-by-year so we always have a horizon ≥ 1 year of solar draws queued.
 */
function nextSolarMoments(count: number, from: Date): Array<{
  draw_type: SolarType;
  scheduled_at: Date;
}> {
  const out: Array<{ draw_type: SolarType; scheduled_at: Date }> = [];
  let year = from.getUTCFullYear();
  while (out.length < count) {
    const sea = Astro.Seasons(year);
    const candidates: Array<{ draw_type: SolarType; date: Date }> = [
      { draw_type: "solar_equinox_spring", date: sea.mar_equinox.date },
      { draw_type: "solstice_summer" as never, date: sea.jun_solstice.date },
      { draw_type: "solar_equinox_autumn", date: sea.sep_equinox.date },
      { draw_type: "solar_solstice_winter", date: sea.dec_solstice.date },
    ].map((c, i) => ({
      // Re-map to canonical names; index ensures correctness regardless of typo above
      draw_type: (
        ["solar_equinox_spring", "solar_solstice_summer", "solar_equinox_autumn", "solar_solstice_winter"] as SolarType[]
      )[i],
      date: c.date,
    }));
    for (const c of candidates) {
      if (c.date.getTime() >= from.getTime() && out.length < count) {
        out.push({ draw_type: c.draw_type, scheduled_at: nextUtcMidnightAfter(c.date) });
      }
    }
    year += 1;
    if (year > from.getUTCFullYear() + 5) break; // safety
  }
  return out
    .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime())
    .slice(0, count);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_env" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const log: Record<string, unknown> = { executed: [], scheduled: [] };

  try {
    // ─── 1. Execute pending draws past their scheduled moment ────
    const { data: pending, error: pendingErr } = await supabase
      .from("lottery_draws")
      .select("id, draw_type, scheduled_at")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (pendingErr) throw pendingErr;

    for (const draw of (pending ?? []) as PendingDraw[]) {
      const { data, error } = await supabase.rpc("execute_lottery_draw", {
        p_draw_id: draw.id,
      });
      (log.executed as unknown[]).push({
        draw_id: draw.id,
        draw_type: draw.draw_type,
        scheduled_at: draw.scheduled_at,
        result: data ?? null,
        error: error?.message ?? null,
      });
    }

    // ─── 2. Re-seed the next 4 lunar + next 4 solar draws (idempotent) ─
    const lunar = nextLunarMoments(4, new Date());
    const solar = nextSolarMoments(4, new Date());
    const moments = [...lunar, ...solar];
    for (const m of moments) {
      const { data, error } = await supabase.rpc("schedule_lottery_draw", {
        p_draw_type: m.draw_type,
        p_scheduled_at: m.scheduled_at.toISOString(),
      });
      (log.scheduled as unknown[]).push({
        draw_type: m.draw_type,
        scheduled_at: m.scheduled_at.toISOString(),
        draw_id: data ?? null,
        error: error?.message ?? null,
      });
    }

    return new Response(JSON.stringify({ ok: true, ...log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[lottery-scheduler] error:", msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg, ...log }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
