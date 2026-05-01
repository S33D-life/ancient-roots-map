/**
 * getLatestCouncilInvitation — resolves the current Council invitation.
 *
 * Today: builds a CouncilInvitation from local cycle data + curator
 * overrides, plus the cycle Notion URLs from `councilInvitation` config.
 *
 * ─── Future Notion / Supabase sync — wire one of these in here ───
 *
 *   Option A — Supabase Edge Function pulls Notion:
 *     A scheduled edge function uses NOTION_API_KEY (server-side only) to
 *     fetch the current invitation page and writes it to a
 *     `council_invitations` table. This function then reads the latest row
 *     via supabase-js and falls back to the local resolver on any error.
 *
 *   Option B — Curator paste / import:
 *     A small admin form writes a CouncilInvitation row to Supabase. This
 *     function returns the latest row when present.
 *
 *   Option C — Notion webhook → Supabase:
 *     Notion automation hits a webhook edge function that upserts the
 *     invitation row in Supabase. Same read path as A/B.
 *
 * In every option above, secrets stay on the server. The browser only ever
 * reads the synced row — never calls Notion directly.
 */

import { getCurrentCouncilWithOverrides } from "@/data/council/curatorOverrides";
import {
  formatGatheringDate,
  moonLabel,
} from "@/data/council/councilCycles";
import {
  COUNCIL_INVITATION_EMBED_URL,
  COUNCIL_INVITATION_PUBLIC_URL,
} from "@/config/councilInvitation";
import type { CouncilInvitation } from "./CouncilInvitation";

/**
 * Build the local fallback invitation from cycle data.
 * Pure / synchronous — safe to call from any render path.
 */
export function getFallbackCouncilInvitation(): CouncilInvitation {
  const c = getCurrentCouncilWithOverrides();
  return {
    id: c.id,
    title: c.title,
    moonType: moonLabel(c.moonPhase),
    date: formatGatheringDate(c.gatheringDate),
    time: c.time,
    curator: c.curator,
    openingInvocation: c.agenda.invocation,
    thisMoon: c.agenda.thisMoon,
    timeTreeQuestion: c.agenda.timeTreeQuestion,
    focusAreas: c.agenda.focusAreas,
    inFocus: {
      plant: c.highlights?.plant,
      tree: c.highlights?.tree,
      project: c.highlights?.project,
    },
    notionEmbedUrl: COUNCIL_INVITATION_EMBED_URL,
    notionPublicUrl: COUNCIL_INVITATION_PUBLIC_URL,
  };
}

/**
 * Resolve the latest CouncilInvitation.
 *
 * Async signature so a real Notion/Supabase fetch can drop in later
 * without changing call sites. Always returns the local fallback today.
 * Any future fetch must catch errors and fall back to the local copy —
 * the page must never break because Notion is down.
 */
export async function getLatestCouncilInvitation(): Promise<CouncilInvitation> {
  // TODO: replace with Supabase read of synced `council_invitations` row.
  // try {
  //   const { data } = await supabase
  //     .from("council_invitations")
  //     .select("*")
  //     .order("updated_at", { ascending: false })
  //     .limit(1)
  //     .maybeSingle();
  //   if (data) return mapRowToInvitation(data);
  // } catch (_err) { /* fall through to fallback */ }
  return getFallbackCouncilInvitation();
}
