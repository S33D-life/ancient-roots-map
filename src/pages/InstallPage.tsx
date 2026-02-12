import { Link } from "react-router-dom";
import { Share, PlusSquare, Smartphone, Wifi, Bell, Zap, ArrowLeft, TreeDeciduous } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const InstallPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-serif tracking-wide text-primary">
              Plant This App
            </h1>
            <p className="text-sm text-muted-foreground font-serif">
              Root it on your home screen — quick access, works offline
            </p>
          </div>

          {/* App identity */}
          <div className="flex items-center gap-4 px-2">
            <img
              src="/pwa-icon-192.png"
              alt="Ancient Friends icon"
              className="w-16 h-16 rounded-2xl glow-subtle"
            />
            <div>
              <p className="font-serif text-lg text-foreground">Ancient Friends</p>
              <p className="text-xs text-muted-foreground">
                A Living Map of Ancient Trees
              </p>
            </div>
          </div>

          {/* iOS instructions */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4">
            <p className="font-serif text-sm text-foreground/90">
              To plant on Safari (iOS):
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/80">1. Tap the <strong className="text-primary">Share</strong> button</p>
                  <p className="text-[11px] text-muted-foreground">The square with the upward arrow at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/80">2. Scroll down and tap <strong className="text-primary">Add to Home Screen</strong></p>
                  <p className="text-[11px] text-muted-foreground">The app will appear on your home screen like any other</p>
                </div>
              </div>
            </div>
          </div>

          {/* Android instructions */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4">
            <p className="font-serif text-sm text-foreground/90">
              To plant on Chrome (Android):
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-sm">⋮</span>
                </div>
                <div>
                  <p className="text-sm text-foreground/80">1. Tap the <strong className="text-primary">three dots</strong> menu</p>
                  <p className="text-[11px] text-muted-foreground">Top-right corner of Chrome</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground/80">2. Tap <strong className="text-primary">Add to Home screen</strong></p>
                  <p className="text-[11px] text-muted-foreground">Chrome may also show an install banner automatically</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3 px-2">
            <p className="font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
              Why plant?
            </p>
            <ul className="space-y-2.5">
              {[
                { icon: Zap, text: "Faster access — one tap from your home screen" },
                { icon: Wifi, text: "Works offline — the grove lives in your pocket" },
                { icon: Bell, text: "Notifications — when the forest whispers (coming soon)" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-primary/70 shrink-0" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Continue link */}
          <div className="pt-2">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-colors font-serif text-sm text-foreground/80"
            >
              <TreeDeciduous className="w-4 h-4 text-primary" />
              Continue to the Grove
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InstallPage;
