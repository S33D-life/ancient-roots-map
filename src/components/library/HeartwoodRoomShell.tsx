/**
 * HeartwoodRoomShell — Shared visual wrapper for all Heartwood Library rooms.
 * Provides: Header, HeartwoodBackground, breadcrumb back to library, Footer.
 * Preserves the feeling of entering distinct chambers in a living library.
 */
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import TetolBridge from "@/components/TetolBridge";
import Footer from "@/components/Footer";

interface HeartwoodRoomShellProps {
  roomLabel: string;
  children: ReactNode;
}

const HeartwoodRoomShell = ({ roomLabel, children }: HeartwoodRoomShellProps) => {
  return (
    <div className="min-h-screen relative" style={{ background: "hsl(20 25% 6%)" }}>
      <HeartwoodBackground />
      <Header />

      <main className="relative z-10 container mx-auto px-4 pt-28 pb-12">
        {/* Breadcrumb — calm, contextual */}
        <nav
          aria-label="Library breadcrumb"
          className="flex items-center gap-1.5 text-xs font-serif text-muted-foreground/70 mb-6 select-none"
        >
          <Link
            to="/library"
            className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded px-1"
          >
            Heartwood Library
          </Link>
          <span className="text-border/50" aria-hidden>›</span>
          <span className="text-foreground/60 truncate max-w-[200px]" aria-current="page">
            {roomLabel}
          </span>
        </nav>

        {/* Room content */}
        {children}
      </main>

      <TetolBridge />
      <Footer />
    </div>
  );
};

export default HeartwoodRoomShell;
