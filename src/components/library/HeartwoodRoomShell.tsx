import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompanionPairDialog from "@/components/companion/CompanionPairDialog";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { ParchmentGround, TeotagMarginNote } from "@/components/parchment/ParchmentGround";
import { ROUTES } from "@/lib/routes";

interface HeartwoodRoomShellProps {
  roomLabel: string; children: ReactNode; currentRoom?: string; roomSequence?: string[];
  roomLabels?: Record<string,string>; onNavigateRoom?: (room: string) => void;
}

export default function HeartwoodRoomShell({ roomLabel, children, currentRoom, roomSequence = [], roomLabels = {}, onNavigateRoom }: HeartwoodRoomShellProps) {
  const reduced = useReducedMotion();
  const canSwipe = roomSequence.length > 1 && currentRoom && onNavigateRoom;
  const index = currentRoom ? roomSequence.indexOf(currentRoom) : -1;
  const previous = index > 0 ? roomSequence[index - 1] : undefined;
  const next = index >= 0 && index < roomSequence.length - 1 ? roomSequence[index + 1] : undefined;
  const { onTouchStart, onTouchEnd } = useSwipeNavigation({ items: roomSequence, activeItem: currentRoom || "", onNavigate: onNavigateRoom || (() => {}), threshold: 52, axis: "vertical" });
  return <ParchmentGround realm="heartwood">
    <Header />
    <main className="parchment-main parchment-room-main">
      <div className="parchment-room-intro">
        <div><Link className="parchment-kicker" to={ROUTES.LIBRARY}>Heartwood Hall</Link><h1>{roomLabel}</h1></div>
        <TeotagMarginNote>One Tree. Each room holds a different part of its living memory.</TeotagMarginNote>
        <CompanionPairDialog />
      </div>
      {canSwipe && <nav aria-label="Climb between Heartwood rooms" className="parchment-climb touch-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <button type="button" disabled={!previous} onClick={() => previous && onNavigateRoom?.(previous)} aria-label={previous ? `Descend to ${roomLabels[previous] || previous}` : "No lower room"}><ChevronDown size={18} aria-hidden="true" /><span>{previous ? roomLabels[previous] || previous : "Roots reached"}</span></button>
        <button type="button" disabled={!next} onClick={() => next && onNavigateRoom?.(next)} aria-label={next ? `Climb to ${roomLabels[next] || next}` : "No higher room"}><span>{next ? roomLabels[next] || next : "Crown reached"}</span><ChevronUp size={18} aria-hidden="true" /></button>
      </nav>}
      <div className="parchment-room-content">{reduced || !canSwipe ? children : <AnimatePresence mode="wait"><motion.div key={currentRoom} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}>{children}</motion.div></AnimatePresence>}</div>
      <div className="parchment-journey"><span>Keep your place in the living library.</span><Link to={ROUTES.LIBRARY}>Return to Heartwood Hall →</Link></div>
    </main>
    <Footer />
  </ParchmentGround>;
}
