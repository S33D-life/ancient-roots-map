/**
 * FloatingActionCluster — unified expandable FAB that consolidates
 * Atlas, Bounty Hunter, and Locate into a single touch point.
 * Prevents stacking of multiple floating buttons on mobile.
 */
import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shield, Locate } from "lucide-react";
import { usePopupGate } from "@/contexts/UIFlowContext";
import { Z } from "@/lib/z-index";
import BugReportDialog from "@/components/BugReportDialog";
import { toast } from "sonner";

/** Globe resting on an open book – compact SVG icon */
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

const ITEM_SPRING = { type: "spring" as const, stiffness: 400, damping: 25 };

interface FabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  action: "link" | "dialog" | "locate";
  to?: string;
}

const FloatingActionCluster = () => {
  const allowed = usePopupGate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const isMap = pathname === "/map";

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }
    setLocating(true);
    setOpen(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const url = `/map?lat=${pos.coords.latitude.toFixed(5)}&lng=${pos.coords.longitude.toFixed(5)}&zoom=14`;
        window.location.href = url;
      },
      () => {
        setLocating(false);
        toast.error("Could not determine location");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  if (!allowed) return null;

  const items: FabItem[] = [
    { key: "atlas", icon: <GlobeOnBook className="w-4 h-4" />, label: "Atlas", action: "link", to: "/atlas" },
    { key: "bounty", icon: <Shield className="w-4 h-4" />, label: "Bounty", action: "dialog" },
    { key: "locate", icon: <Locate className="w-4 h-4" />, label: "Find me", action: "locate" },
  ];

  return (
    <>
      <div
        className="fixed bottom-[5.5rem] right-3 md:hidden"
        style={{
          zIndex: Z.FLOATING,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Expanded items */}
        <AnimatePresence>
          {open && items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ ...ITEM_SPRING, delay: i * 0.05 }}
              className="mb-2 flex items-center justify-end gap-2"
            >
              <span
                className="text-[10px] font-serif tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "hsl(var(--card) / 0.9)",
                  color: "hsl(var(--muted-foreground))",
                  backdropFilter: "blur(8px)",
                }}
              >
                {item.label}
              </span>
              {item.action === "link" ? (
                <Link
                  to={item.to!}
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  {item.icon}
                </Link>
              ) : item.action === "dialog" ? (
                <button
                  onClick={() => { setOpen(false); setBugDialogOpen(true); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                  style={{
                    background: "hsl(var(--card) / 0.9)",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border) / 0.4)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {item.icon}
                </button>
              ) : (
                <button
                  onClick={handleLocate}
                  disabled={locating}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                  style={{
                    background: "hsl(var(--card) / 0.9)",
                    color: locating ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border) / 0.4)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Locate className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB toggle */}
        <motion.button
          onClick={() => setOpen(!open)}
          animate={{ rotate: open ? 45 : 0 }}
          transition={ITEM_SPRING}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg ml-auto"
          style={{
            background: open ? "hsl(var(--primary))" : "hsl(var(--card) / 0.92)",
            color: open ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))",
            border: `1px solid hsl(var(--border) / ${open ? "0.6" : "0.3"})`,
            backdropFilter: "blur(16px)",
          }}
          aria-label={open ? "Close action menu" : "Open action menu"}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Bounty Hunter dialog (rendered outside the cluster for portal stacking) */}
      <BugReportDialog
        open={bugDialogOpen}
        onOpenChange={setBugDialogOpen}
      />

      {/* Backdrop to close on outside tap */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 md:hidden"
            style={{ zIndex: Z.FLOATING - 1 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingActionCluster;
