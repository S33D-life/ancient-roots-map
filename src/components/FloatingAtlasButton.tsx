/**
 * FloatingAtlasButton — persistent globe button for quick Atlas access on mobile.
 * Hidden during high-focus flows via usePopupGate().
 */
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { usePopupGate } from "@/contexts/UIFlowContext";

const FloatingAtlasButton = () => {
  const allowed = usePopupGate();
  if (!allowed) return null;

  return (
    <Link
      to="/atlas"
      aria-label="Open World Atlas"
      className="fixed bottom-20 right-4 z-30 md:hidden w-11 h-11 rounded-full
        bg-primary text-primary-foreground shadow-lg
        flex items-center justify-center
        hover:scale-105 active:scale-95 transition-transform"
    >
      <Globe className="w-5 h-5" />
    </Link>
  );
};

export default FloatingAtlasButton;
