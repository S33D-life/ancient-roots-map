/**
 * MapAtlasControl — standalone Atlas navigation button for the map screen.
 * Placed in the map control stack. Always visible, always clickable.
 */
import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Z } from "@/lib/z-index";

/** Globe-on-book icon reused from FloatingAtlasButton */
const GlobeOnBook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="6" />
    <ellipse cx="12" cy="9" rx="2.4" ry="6" />
    <line x1="6" y1="9" x2="18" y2="9" />
    <path d="M4 20 C4 18, 8 17.5, 12 18.5 C16 17.5, 20 18, 20 20" />
    <line x1="12" y1="18.5" x2="12" y2="21" />
    <path d="M4 20 C4 21, 8 21.5, 12 21" />
    <path d="M20 20 C20 21, 16 21.5, 12 21" />
  </svg>
);

const MapAtlasControl = () => {
  const navigate = useNavigate();
  const guardRef = useRef(false);

  const handleClick = useCallback(() => {
    if (guardRef.current) return;
    guardRef.current = true;
    

    try {
      navigate("/atlas");
    } catch (err) {
      console.error("[Atlas] navigation failed", err);
      toast.error("Couldn't open Atlas — please try again.");
    } finally {
      setTimeout(() => { guardRef.current = false; }, 400);
    }
  }, [navigate]);

  return (
    <button
      onClick={handleClick}
      aria-label="Open World Atlas"
      className="flex items-center gap-1.5 rounded-full px-3 py-2 shadow-md
        text-xs font-serif tracking-wide
        transition-transform hover:scale-105 active:scale-95
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        zIndex: Z.FLOATING,
        background: "hsl(var(--card) / 0.92)",
        color: "hsl(var(--foreground))",
        border: "1px solid hsl(var(--border) / 0.4)",
        backdropFilter: "blur(12px)",
      }}
    >
      <GlobeOnBook className="w-4 h-4" />
      <span>Atlas</span>
    </button>
  );
};

export default MapAtlasControl;
