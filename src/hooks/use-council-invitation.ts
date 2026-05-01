/**
 * useCouncilInvitation — React hook wrapping `getLatestCouncilInvitation`.
 *
 * Returns the local fallback synchronously on first render so the page
 * never blanks, then upgrades to async-resolved data when available.
 */
import { useEffect, useState } from "react";
import {
  getFallbackCouncilInvitation,
  getLatestCouncilInvitation,
} from "@/lib/council/getLatestCouncilInvitation";
import type { CouncilInvitation } from "@/lib/council/CouncilInvitation";

export function useCouncilInvitation(refreshKey?: number): CouncilInvitation {
  const [invitation, setInvitation] = useState<CouncilInvitation>(
    () => getFallbackCouncilInvitation(),
  );

  useEffect(() => {
    let cancelled = false;
    getLatestCouncilInvitation()
      .then((next) => { if (!cancelled) setInvitation(next); })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [refreshKey]);

  return invitation;
}
