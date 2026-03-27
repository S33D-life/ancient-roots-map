/**
 * TeotagChatPanel — a calm, inviting panel for connecting with TEOTAG via Telegram.
 * Designed for Hearth and Support. Future-ready for in-app chat / AI guidance.
 *
 * TEOTAG is one guide across the whole ecosystem — Telegram, app, and forest.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronDown, MessageCircle, Users } from "lucide-react";
import TeotagFace from "@/components/TeotagFace";
import { BOT_CONFIG } from "@/config/bot";

interface TeotagChatPanelProps {
  /** Visual variant */
  variant?: "hearth" | "support";
  /** Whether the panel starts expanded */
  defaultOpen?: boolean;
  className?: string;
}

export default function TeotagChatPanel({
  variant = "hearth",
  defaultOpen = true,
  className = "",
}: TeotagChatPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const botLink = BOT_CONFIG.telegramBotLink("chat");

  if (!BOT_CONFIG.hasTelegramBot) return null;

  return (
    <div
      className={`rounded-2xl border border-border/20 overflow-hidden transition-colors duration-300 ${className}`}
      style={{
        background: variant === "hearth"
          ? "linear-gradient(180deg, hsl(var(--card) / 0.6), hsl(var(--card) / 0.35))"
          : "hsl(var(--card) / 0.5)",
      }}
    >
      {/* Header — always visible, toggles expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer group"
      >
        <TeotagFace size="sm" delay={0} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-serif text-foreground/80 tracking-wide">
            TEOTAG
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/45 leading-relaxed">
            Your guide through the forest
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Divider */}
              <div className="h-px w-full" style={{ background: "hsl(var(--border) / 0.12)" }} />

              {/* Gentle prompt */}
              <p className="text-xs font-serif text-muted-foreground/55 leading-relaxed italic">
                Ask about trees, the atlas, offerings, councils — or just say hello. TEOTAG listens.
              </p>

              {/* Primary action — TEOTAG bot */}
              <a
                href={botLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-serif tracking-wide transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.06))",
                  color: "hsl(var(--primary))",
                  border: "1px solid hsl(var(--primary) / 0.2)",
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Speak with TEOTAG
                <ExternalLink className="w-3 h-3 opacity-40" />
              </a>
              <p className="text-[9px] font-serif text-muted-foreground/35 text-center">
                Opens in Telegram
              </p>

              {/* Community group */}
              <div className="h-px w-full" style={{ background: "hsl(var(--border) / 0.08)" }} />
              <p className="text-[10px] font-serif text-muted-foreground/40 italic text-center">
                The grove is gathering here
              </p>
              <a
                href="https://t.me/s33dlife"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs font-serif tracking-wide transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "hsl(var(--card) / 0.6)",
                  color: "hsl(var(--foreground) / 0.7)",
                  border: "1px solid hsl(var(--border) / 0.15)",
                }}
              >
                <Users className="w-3.5 h-3.5" />
                Join @s33dlife
                <ExternalLink className="w-3 h-3 opacity-30" />
              </a>
              <p className="text-[9px] font-serif text-muted-foreground/35 text-center leading-relaxed">
                Community, support, and forest updates · Opens in Telegram
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
