/**
 * HeartwoodRoomShell — Shared visual wrapper for all Heartwood Library rooms.
 * Provides: Header, HeartwoodBackground, breadcrumb, swipe navigation, room dots, Footer.
 */
import { ReactNode, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import TetolBridge from "@/components/TetolBridge";
import Footer from "@/components/Footer";
import CompanionPairDialog from "@/components/companion/CompanionPairDialog";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    items: roomSequence,
    activeItem: currentRoom || "",
    onNavigate: onNavigateRoom || (() => {}),
    threshold: 60,
  });

  // Keyboard arrow navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!canSwipe) return;
      if (e.key === "ArrowLeft" && hasPrev) {
        onNavigateRoom!(roomSequence[currentIndex - 1]);
      } else if (e.key === "ArrowRight" && hasNext) {
        onNavigateRoom!(roomSequence[currentIndex + 1]);
      }
    },
    [canSwipe, hasPrev, hasNext, currentIndex, roomSequence, onNavigateRoom]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen relative botanical-heartwood bg-background">
      <HeartwoodBackground />
      <Header />

      <main
        className="relative z-10 container mx-auto px-4 pb-12"
        style={{ paddingTop: "calc(var(--content-top) + 0.5rem)" }}
        onTouchStart={canSwipe ? onTouchStart : undefined}
        onTouchEnd={canSwipe ? onTouchEnd : undefined}
      >
        {/* Breadcrumb + context + nav arrows */}
        <div className="flex items-center justify-between mb-4">
          <div>
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

          <div className="flex items-center gap-1">
            {canSwipe && (
              <>
                <button
                  onClick={() => hasPrev && onNavigateRoom!(roomSequence[currentIndex - 1])}
                  disabled={!hasPrev}
                  aria-label="Previous room"
                  className="p-1.5 rounded-full text-muted-foreground/50 hover:text-foreground/80 disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => hasNext && onNavigateRoom!(roomSequence[currentIndex + 1])}
                  disabled={!hasNext}
                  aria-label="Next room"
                  className="p-1.5 rounded-full text-muted-foreground/50 hover:text-foreground/80 disabled:opacity-20 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <CompanionPairDialog />
          </div>
        </div>

        {/* Room position dots */}
        {canSwipe && (
          <div className="flex items-center justify-center gap-1.5 mb-5" role="tablist" aria-label="Room navigation">
            {roomSequence.map((room, i) => (
              <button
                key={room}
                onClick={() => onNavigateRoom!(room)}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={roomLabels[room] || room}
                title={roomLabels[room] || room}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? "w-2.5 h-2.5 bg-primary/80"
                    : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Room content with slide transition */}
        {prefersReduced || !canSwipe ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoom}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
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
