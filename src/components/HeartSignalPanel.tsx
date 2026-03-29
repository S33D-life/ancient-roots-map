/**
 * HeartSignalPanel — the unified signal center for the Orb.
 * Shows filtered heart signals with poetic language, deep links, and soft animations.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import type { HeartSignal, HeartSignalFilter } from "@/lib/heart-signal-types";
import { SIGNAL_FILTER_OPTIONS, SIGNAL_TYPE_EMOJI, SIGNAL_TYPE_HUE } from "@/lib/heart-signal-types";
import { Z } from "@/lib/z-index";

interface HeartSignalPanelProps {
  open: boolean;
  onClose: () => void;
  signals: HeartSignal[];
  unreadCount: number;
  filter: HeartSignalFilter;
  onFilterChange: (f: HeartSignalFilter) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export default function HeartSignalPanel({
  open,
  onClose,
  signals,
  unreadCount,
  filter,
  onFilterChange,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: HeartSignalPanelProps) {
  const navigate = useNavigate();

  const handleClick = (s: HeartSignal) => {
    onMarkRead(s.id);
    if (s.deep_link) {
      onClose();
      setTimeout(() => navigate(s.deep_link!), 150);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            data-capture-exclude
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ zIndex: Z.FLOATING + 5, background: "hsl(var(--background) / 0.4)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-96 max-h-[70vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              zIndex: Z.FLOATING + 6,
              background: "hsl(var(--card) / 0.97)",
              border: "1px solid hsl(var(--border) / 0.3)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px hsl(var(--primary) / 0.1), 0 0 80px hsl(var(--primary) / 0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="text-sm font-serif tracking-wider text-foreground">Heart Signals</h3>
                {unreadCount > 0 && (
                  <span
                    className="min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-serif gap-1 text-muted-foreground" onClick={onMarkAllRead}>
                    <CheckCheck className="w-3 h-3" />
                    Read all
                  </Button>
                )}
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent/20 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b border-border/10">
              {SIGNAL_FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange(opt.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-serif whitespace-nowrap transition-all duration-200
                    ${filter === opt.value
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"}`}
                >
                  <span className="text-[10px]">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Signal list */}
            <ScrollArea className="flex-1 max-h-[50vh]">
              {signals.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-3xl block mb-3">🌿</span>
                  <p className="text-xs text-muted-foreground font-serif">The forest is quiet… for now</p>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {signals.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/8 transition-colors ${!s.is_read ? "bg-primary/5" : ""}`}
                      onClick={() => handleClick(s)}
                    >
                      {/* Type indicator with glow */}
                      <div className="relative mt-0.5 shrink-0">
                        <span className="text-base">{SIGNAL_TYPE_EMOJI[s.signal_type] || "✨"}</span>
                        {!s.is_read && (
                          <span
                            className="absolute -inset-1 rounded-full animate-pulse pointer-events-none"
                            style={{
                              background: `radial-gradient(circle, hsl(${SIGNAL_TYPE_HUE[s.signal_type]} / 0.3), transparent 70%)`,
                            }}
                          />
                        )}
                      </div>

                       <div className="flex-1 min-w-0 space-y-0.5">
                        <p className={`text-sm font-serif leading-snug truncate ${!s.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {s.title}
                        </p>
                        {s.body && (
                          <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">{s.body}</p>
                        )}
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5 font-mono">{timeAgo(s.created_at)}</p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); onDismiss(s.id); }}
                        className="p-1 rounded hover:bg-accent/20 text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0 mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer — link to full Heartwood */}
            <div className="px-4 py-2 border-t border-border/15 text-center">
              <button
                onClick={() => { onClose(); setTimeout(() => navigate("/library"), 150); }}
                className="text-[10px] font-serif text-primary/60 hover:text-primary transition-colors"
              >
                Open Heartwood Library →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
