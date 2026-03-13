/**
 * ComingSoonGate — wraps pages that aren't ready for public release.
 * Shows a calm "coming soon" message instead of the actual content.
 * In dev mode, shows the content with a subtle dev badge.
 */
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Sprout, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const ComingSoonGate = ({ title, description, children }: Props) => {
  // In dev mode, show the actual content with a subtle indicator
  if (import.meta.env.DEV) {
    return (
      <div className="relative">
        <div
          className="fixed top-16 right-2 z-[200] px-2 py-1 rounded text-[10px] font-mono pointer-events-none"
          style={{
            background: "hsl(280 60% 50% / 0.8)",
            color: "white",
          }}
        >
          DEV ONLY
        </div>
        {children}
      </div>
    );
  }

  // In production, show coming soon
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex flex-col items-center justify-center px-4 pt-24 pb-28 text-center min-h-[60vh]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.04), transparent 60%)",
          }}
        />
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
        >
          <Sprout className="w-7 h-7 text-primary/50" />
        </div>
        <h1 className="text-2xl font-serif text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground font-serif mb-1 max-w-md">
          {description || "This part of the forest is still being planted."}
        </p>
        <p className="text-xs text-muted-foreground/50 font-serif mb-8">
          It will bloom when the time is right.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="default" className="font-serif text-xs gap-2">
            <Link to="/"><ArrowLeft className="w-3.5 h-3.5" /> Return Home</Link>
          </Button>
          <Button asChild variant="outline" className="font-serif text-xs gap-2">
            <Link to="/map">Explore the Map</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ComingSoonGate;
