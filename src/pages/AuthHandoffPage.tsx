/**
 * /auth/handoff — the landing place for a Google sign-in that was started
 * inside the installed web app and finished in Safari.
 *
 * It carries only an opaque handoff id. Here we confirm the session that
 * Safari just created and bind it to that handoff, so the installed app can
 * claim its own session when it is reopened.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { bindHandoff, claimHandoff, isStandaloneDisplay } from "@/lib/auth/pwaHandoff";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type State = "working" | "bound" | "restored" | "failed";

export default function AuthHandoffPage() {
  const [params] = useSearchParams();
  const handoffId = params.get("h") ?? "";
  const [state, setState] = useState<State>("working");

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!handoffId) {
        if (active) setState("failed");
        return;
      }
      // If iOS did return us straight into the installed app, finish here.
      if (isStandaloneDisplay()) {
        const claimed = await claimHandoff();
        if (!active) return;
        if (claimed.status === "signed-in") {
          setState("restored");
          window.location.replace("/");
          return;
        }
      }
      const result = await bindHandoff(handoffId);
      if (!active) return;
      setState(result.ok ? "bound" : "failed");
    })();
    return () => { active = false; };
  }, [handoffId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-card/70 p-8 text-center backdrop-blur">
        {state === "working" && (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-4 font-serif text-sm text-muted-foreground">Settling your sign-in…</p>
          </>
        )}
        {state === "bound" && (
          <>
            <CheckCircle2 className="mx-auto h-7 w-7 text-primary" />
            <h1 className="mt-4 font-serif text-xl text-foreground">You're signed in</h1>
            <p className="mt-3 font-serif text-sm text-muted-foreground leading-relaxed">
              Return to the S33D app on your Home Screen — it will open already signed in.
            </p>
          </>
        )}
        {state === "restored" && (
          <p className="font-serif text-sm text-muted-foreground">Welcome back — opening S33D…</p>
        )}
        {state === "failed" && (
          <>
            <AlertCircle className="mx-auto h-7 w-7 text-destructive" />
            <h1 className="mt-4 font-serif text-xl text-foreground">This sign-in didn't settle</h1>
            <p className="mt-3 font-serif text-sm text-muted-foreground leading-relaxed">
              Open the S33D app again and try signing in once more.
            </p>
            <a href="/auth" className="mt-6 inline-block font-serif text-sm text-primary hover:underline">
              Back to sign in
            </a>
          </>
        )}
      </div>
    </main>
  );
}
