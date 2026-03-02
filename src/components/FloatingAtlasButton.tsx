/**
 * FloatingAtlasButton — persistent globe button for quick Atlas access on mobile.
 * Hidden during high-focus flows via usePopupGate().
 */
import { Link } from "react-router-dom";
import { usePopupGate } from "@/contexts/UIFlowContext";

/** Globe resting on an open book – compact 20×20 SVG icon */
const GlobeOnBook = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Globe */}
    <circle cx="12" cy="9" r="6" />
    <ellipse cx="12" cy="9" rx="2.4" ry="6" />
    <line x1="6" y1="9" x2="18" y2="9" />
    {/* Open book */}
    <path d="M4 20 C4 18, 8 17.5, 12 18.5 C16 17.5, 20 18, 20 20" />
    <line x1="12" y1="18.5" x2="12" y2="21" />
    <path d="M4 20 C4 21, 8 21.5, 12 21" />
    <path d="M20 20 C20 21, 16 21.5, 12 21" />
  </svg>
);

const FloatingAtlasButton = () => {
  const allowed = usePopupGate();
  if (!allowed) return null;

  return (
    <Link
      to="/atlas"
      aria-label="Open World Atlas"
      className="fixed bottom-[7.5rem] right-4 z-[65] md:hidden w-11 h-11 rounded-full
        bg-primary text-primary-foreground shadow-lg
        flex items-center justify-center
        hover:scale-105 active:scale-95 transition-transform"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <GlobeOnBook className="w-5 h-5" />
    </Link>
  );
};

export default FloatingAtlasButton;
