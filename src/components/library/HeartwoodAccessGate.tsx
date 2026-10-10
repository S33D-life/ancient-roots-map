import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { AccessLevel } from "@/config/heartwoodRooms";
import { supabase } from "@/integrations/supabase/client";

/** Navigation labels are not authority. Resolve protected entrances before mounting content.
 * Server RLS remains responsible for data access; no metadata or preview-host bypass.
 */
export default function HeartwoodAccessGate({ access, children }: { access: AccessLevel; children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "allowed" | "signed-out" | "restricted" | "error">("checking");
  useEffect(() => {
    let current = true;
    let generation = 0;
    const check = async () => {
      const request = ++generation;
      setStatus("checking");
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error && error.name !== "AuthSessionMissingError") throw error;
        let next: typeof status = "signed-out";
        if (data.user) {
          next = "allowed";
          if (access !== "member") {
            // Existing operational authority uses curator/keeper; there is no admin/dev enum.
            const roles = await Promise.all(["curator", "keeper"].map(role => supabase.rpc("has_role", { _user_id: data.user!.id, _role: role as "curator" | "keeper" })));
            if (roles.some(role => role.error)) throw new Error("Role verification failed");
            next = roles.some(role => role.data === true) ? "allowed" : "restricted";
          }
        }
        if (current && request === generation) setStatus(next);
      } catch {
        if (current && request === generation) setStatus("error");
      }
    };
    if (access === "visitor") { setStatus("allowed"); return; }
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Defer auth API calls out of Supabase's synchronous auth callback.
      ++generation;
      setStatus("checking");
      queueMicrotask(() => { if (current) void check(); });
    });
    return () => { current = false; ++generation; subscription.unsubscribe(); };
  }, [access]);
  if (access === "visitor" || status === "allowed") return <>{children}</>;
  return <section className="max-w-xl mx-auto px-6 py-12 space-y-4" aria-live="polite">
    <h2 className="text-2xl font-serif">{status === "checking" ? "Checking this threshold" : "A protected Heartwood room"}</h2>
    <p>{status === "checking" ? "Please wait while access is checked." : status === "error" ? "Access could not be verified. Please try again later." : status === "signed-out" ? "Sign in to continue. Some rooms also require a curator or keeper role." : "This room requires a curator or keeper role."}</p>
    {status === "signed-out" && <Link className="inline-flex min-h-11 items-center underline" to="/auth" state={{ from: location.pathname }}>Sign in</Link>}
    <Link className="flex min-h-11 items-center underline" to="/library" state={location.state}>Return to the Hall</Link>
  </section>;
}
