/**
 * InvitationConsumer — records a pending invitation once a Wanderer is signed
 * in, whichever way they arrived. Mounted once inside the router.
 *
 * It reacts to settled session state (useSessionState), never inside
 * onAuthStateChange, so no Supabase call runs while the SDK holds its lock.
 * It never navigates and never touches the URL: callback credentials stay the
 * SDK's alone (#74).
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionState } from "@/hooks/use-session-state";
import { useToast } from "@/hooks/use-toast";
import { trackInviteEvent } from "@/lib/invite-analytics";
import { clearPendingInvite, readPendingInvite } from "@/lib/invitations/pendingInvite";
import { consumeInvitation, declineMessage } from "@/lib/invitations/consumeInvitation";

export default function InvitationConsumer() {
  const { status, user } = useSessionState();
  // Re-check after in-app navigation: a shared link may store a code mid-session.
  const { pathname } = useLocation();
  const { toast } = useToast();
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (status !== "AUTHENTICATED" || !user) return;
    const code = readPendingInvite();
    if (!code) return;
    const key = `${user.id}:${code.toLowerCase()}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);

    void consumeInvitation(user, code, {
      rpc: (fn, args) => supabase.rpc(fn, args),
      clear: () => clearPendingInvite(code),
      track: (event, c, userId, metadata) => {
        void trackInviteEvent(event, { code: c, source: "system", userId, metadata });
      },
    }).then((outcome) => {
      if (outcome.kind === "consumed" && !outcome.alreadyConsumed) {
        toast({ title: "Your invitation has taken root 🌱", description: "Your lineage is now part of the grove." });
      } else if (outcome.kind === "declined") {
        const description = declineMessage(outcome.reason);
        if (description) toast({ title: "This invitation could not be recorded", description });
      }
      // Only a transient failure may be tried again (on the next navigation).
      if (outcome.kind === "retry") inFlight.current.delete(key);
    });
  }, [status, user, pathname, toast]);

  return null;
}
