/**
 * /auth/diagnostics?diag=1 — evidence panel for the installed-app sign-in
 * investigation. Read-only: it records where a sign-in journey started, where
 * it landed, and whether this particular storage context holds a session.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isStandaloneDisplay, readPendingHandoff } from "@/lib/auth/pwaHandoff";

const MARKER_KEY = "s33d_context_marker";

function contextMarker(): string {
  try {
    const existing = localStorage.getItem(MARKER_KEY);
    if (existing) return existing;
    const created = `${isStandaloneDisplay() ? "app" : "browser"}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(MARKER_KEY, created);
    return created;
  } catch {
    return "unavailable";
  }
}

export default function AuthDiagnosticsPage() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const pending = readPendingHandoff();
      setRows([
        ["Checked at", new Date().toISOString()],
        ["Display mode", isStandaloneDisplay() ? "installed app (standalone)" : "browser tab"],
        ["Context marker", contextMarker()],
        ["Session here", data.session ? `yes (${data.session.user.email ?? data.session.user.id})` : "no"],
        ["Pending handoff", pending ? `${pending.id} (started ${new Date(pending.createdAt).toISOString()})` : "none"],
        ["Service worker", "serviceWorker" in navigator ? "supported" : "unsupported"],
        ["URL", window.location.href],
        ["User agent", navigator.userAgent],
      ]);
    })();
  }, []);

  if (params.get("diag") !== "1") return null;

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <h1 className="font-serif text-lg text-foreground">Sign-in diagnostics</h1>
      <dl className="mt-6 space-y-3 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-border/30 pb-2">
            <dt className="font-serif uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-all font-mono text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
