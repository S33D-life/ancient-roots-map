/**
 * OAuth consent screen for MCP clients connecting to S33D.
 * Routed at /.lovable/oauth/consent — Supabase redirects here to approve a client.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type AuthorizationDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsentPage() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/auth?returnTo=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error: decisionError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? "an agent";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-card/70 p-8 backdrop-blur">
        {error ? (
          <>
            <h1 className="font-serif text-xl text-foreground">This request could not be opened</h1>
            <p className="mt-3 text-sm text-muted-foreground font-serif">{error}</p>
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground font-serif">Listening for the request…</p>
        ) : (
          <>
            <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-primary/70">S33D</p>
            <h1 className="mt-2 font-serif text-2xl text-foreground">Connect {clientName}</h1>
            <p className="mt-3 text-sm text-muted-foreground font-serif leading-relaxed">
              {clientName} is asking to walk the atlas as you — reading the ancient friends,
              offerings and profile your keeper account can already reach.
            </p>
            <div className="mt-8 flex gap-3">
              <Button className="flex-1 font-serif" disabled={busy} onClick={() => void decide(true)}>
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-serif"
                disabled={busy}
                onClick={() => void decide(false)}
              >
                Deny
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
