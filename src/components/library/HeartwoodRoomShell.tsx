/**
 * HeartwoodRoomShell — Shared visual wrapper for all Heartwood Library rooms.
 * Provides: Header, HeartwoodBackground, breadcrumb, swipe navigation, room dots, Footer.
 */
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import TetolBridge from "@/components/TetolBridge";
import Footer from "@/components/Footer";
import CompanionPairDialog from "@/components/companion/CompanionPairDialog";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import ContextBackButton from "@/components/navigation/ContextBackButton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface HeartwoodRoomShellProps {
  roomLabel: string;
  children: ReactNode;
  currentRoom?: string;
  roomSequence?: string[];
  roomLabels?: Record<string, string>;
  onNavigateRoom?: (room: string) => void;
}

const HeartwoodRoomShell = ({
  roomLabel,
  children,
  currentRoom,
  roomSequence = [],
  roomLabels = {},
  onNavigateRoom,
}: HeartwoodRoomShellProps) => {
  const prefersReduced = useReducedMotion();
  const canSwipe = roomSequence.length > 1 && currentRoom && onNavigateRoom;
  const currentIndex = currentRoom ? roomSequence.indexOf(currentRoom) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < roomSequence.length - 1;
  const previousRoom = hasPrev ? roomSequence[currentIndex - 1] : null;
  const nextRoom = hasNext ? roomSequence[currentIndex + 1] : null;

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    items: roomSequence,
    activeItem: currentRoom || "",
    onNavigate: onNavigateRoom || (() => {}),
    threshold: 52,
    axis: "vertical",
  });

  return (
    <div className="min-h-screen relative botanical-heartwood bg-background">
      <HeartwoodBackground />
      <Header />

      <main
        className="relative z-10 container mx-auto px-4 pb-12"
        style={{ paddingTop: "calc(var(--content-top) + 0.5rem)" }}
      >
        {/* Back + room context */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <ContextBackButton fallback={ROUTES.LIBRARY} className="-ml-3 mb-1" />
            <nav
              aria-label="Library breadcrumb"
              className="flex items-center gap-1.5 text-xs font-serif text-muted-foreground/70 select-none"
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
            <p className="text-[10px] font-serif text-muted-foreground/50 mt-0.5 pl-1 select-none">
              You are in: <span className="text-foreground/50">{roomLabel}</span>
              <span className="text-border/40 mx-1">·</span>
              <span className="italic">Part of the Heartwood Library</span>
            </p>
          </div>

          <div className="flex items-center gap-1 pt-1">
            <CompanionPairDialog />
          </div>
        </div>

        {/* Dedicated climb zone: vertical gestures are captured only here. */}
        {canSwipe && (
          <div
            className="mb-6 rounded-md border border-border/40 bg-card/35 px-2 py-2 touch-none"
            aria-label="Climb between Heartwood rooms"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={!previousRoom}
                onClick={() => previousRoom && onNavigateRoom!(previousRoom)}
                aria-label={previousRoom ? `Descend to ${roomLabels[previousRoom] || previousRoom}` : "No lower room"}
                className="min-h-11 min-w-0 justify-start px-2 text-left text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-widest">Descend</span>
                  <span className="block truncate text-xs">{previousRoom ? roomLabels[previousRoom] || previousRoom : "Roots reached"}</span>
                </span>
              </Button>

              <div className="text-center font-serif" aria-live="polite">
                <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">Room</span>
                <span className="block max-w-28 truncate text-xs text-foreground">{roomLabel}</span>
                <span className="block text-[9px] text-muted-foreground">{currentIndex + 1} of {roomSequence.length}</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                disabled={!nextRoom}
                onClick={() => nextRoom && onNavigateRoom!(nextRoom)}
                aria-label={nextRoom ? `Climb to ${roomLabels[nextRoom] || nextRoom}` : "No higher room"}
                className="min-h-11 min-w-0 justify-end px-2 text-right text-muted-foreground"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-widest">Climb</span>
                  <span className="block truncate text-xs">{nextRoom ? roomLabels[nextRoom] || nextRoom : "Crown reached"}</span>
                </span>
                <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </div>
            <p className="sr-only">Swipe up here to climb, or swipe down to descend.</p>
          </div>
        )}

        {/* Room content with slide transition */}
        {prefersReduced || !canSwipe ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoom}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <TetolBridge />
      <Footer />
    </div>
  );
};

export default HeartwoodRoomShell;
