/**
 * InviteStatusPage — small curator-only debug viewer for a single invite link.
 * Calls the admin_invite_status RPC (SECURITY DEFINER, curator-gated) to
 * surface code / creator / used state / used_at / created_at / recipient.
 */
import { useState } from "react";
import { useHasRole } from "@/hooks/use-role";
import Header from "@/components/Header";
import { Shield, Loader2, Search, KeySquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface InviteStatusRow {
  code: string;
  created_at: string;
  is_used: boolean;
  used_at: string | null;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  creator_id: string;
  creator_name: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export default function InviteStatusPage() {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const [code, setCode] = useState("");
  const [row, setRow] = useState<InviteStatusRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setRow(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("admin_invite_status", {
        p_code: trimmed,
      });
      if (rpcError) throw rpcError;
      const first = Array.isArray(data) ? (data[0] as InviteStatusRow | undefined) : (data as any);
      if (!first) {
        setError("No invite link found with that code.");
      } else {
        setRow(first);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
          <Shield className="w-8 h-8 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-serif">Curator access only</h1>
          <p className="text-sm text-muted-foreground font-serif">
            This room is for the keepers of the grove.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <KeySquare className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-serif">Invite Status</h1>
        </div>
        <p className="text-sm text-muted-foreground font-serif">
          Look up a single invite link by its code. Read-only — never consumes
          the invite.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-serif">Lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-code-lookup" className="text-xs uppercase tracking-wider text-muted-foreground">
                Invite code
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="invite-code-lookup"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") lookup(); }}
                  placeholder="e.g. 1a2b3c4d5e6f7a8b"
                  className="font-mono text-sm"
                />
                <Button onClick={lookup} disabled={loading || !code.trim()} className="font-serif gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Look up
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-muted-foreground font-serif border-l-2 border-primary/30 pl-3">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {row && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-serif">
                <span className="font-mono text-sm">{row.code}</span>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    row.is_used
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {row.is_used ? "used" : "unused"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Created at" value={fmt(row.created_at)} />
                <Field label="Used at" value={fmt(row.used_at)} />
                <Field
                  label="Creator"
                  value={
                    <>
                      <div>{row.creator_name ?? "Wanderer"}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/60 break-all">
                        {row.creator_id}
                      </div>
                    </>
                  }
                />
                <Field
                  label="Recipient"
                  value={
                    row.recipient_id ? (
                      <>
                        <div>{row.recipient_name ?? "Wanderer"}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/60 break-all">
                          {row.recipient_id}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
                <Field label="Uses" value={`${row.uses_count}${row.max_uses ? ` / ${row.max_uses}` : ""}`} />
                <Field label="Expires at" value={fmt(row.expires_at)} />
              </dl>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-serif text-foreground">{value}</dd>
    </div>
  );
}
