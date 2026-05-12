import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, TreePine, BookOpen, Compass, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

/**
 * /welcome — landing screen after the user clicks the email confirmation link.
 *
 * Two states:
 *  • signed-in: warm success card + curated next steps into the grove.
 *  • not-signed-in (e.g. link opened in a different browser): gentle nudge to sign in.
 */
const WelcomePage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data.session;
      setSignedIn(!!session);
      const name =
        (session?.user?.user_metadata?.display_name as string | undefined) ??
        (session?.user?.user_metadata?.full_name as string | undefined) ??
        session?.user?.email?.split("@")[0] ??
        null;
      setDisplayName(name);
      setChecking(false);
    };
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(!!session);
      if (session) setChecking(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span className="text-sm">Confirming your email…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background px-4 py-10 flex items-start justify-center">
      <div className="w-full max-w-xl">
        <Card className="border-primary/20 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 via-emerald-50 to-background dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-background px-6 pt-8 pb-6 text-center">
            <div
              className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
              aria-hidden
            >
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="font-serif text-3xl text-foreground">
              {signedIn ? (
                <>Welcome to the grove{displayName ? `, ${displayName}` : ""} 🌱</>
              ) : (
                <>Your email is confirmed 🌱</>
              )}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {signedIn
                ? "Your seed has taken root. The grove is open — wander gently and notice what calls to you."
                : "Thank you for confirming. To enter the grove, please sign in on the device where you began."}
            </p>
          </div>

          <CardContent className="p-6 space-y-3">
            {signedIn ? (
              <>
                <NextStep
                  to="/map"
                  icon={<Compass className="h-5 w-5" aria-hidden />}
                  title="Open the living map"
                  body="Find Ancient Friends and Life Groves nearby."
                />
                <NextStep
                  to="/library/ancient-friends"
                  icon={<TreePine className="h-5 w-5" aria-hidden />}
                  title="Meet the Ancient Friends"
                  body="Trees with stories already gathered around them."
                />
                <NextStep
                  to="/library"
                  icon={<BookOpen className="h-5 w-5" aria-hidden />}
                  title="Wander the library"
                  body="Rooms of offerings, whispers, and seasonal records."
                />
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="text-muted-foreground"
                  >
                    Or visit your dashboard
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full" aria-label="Sign in to enter the grove">
                  <Link to="/auth">Sign in to enter</Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Tip: open this link in the same browser where you signed up so we can recognise you.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

const NextStep = ({
  to,
  icon,
  title,
  body,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <Link
    to={to}
    className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
  >
    <div className="mt-0.5 text-primary">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{body}</div>
    </div>
    <ArrowRight
      className="h-4 w-4 mt-1 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      aria-hidden
    />
  </Link>
);

export default WelcomePage;
