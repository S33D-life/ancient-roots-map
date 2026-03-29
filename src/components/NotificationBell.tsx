/**
 * NotificationBell — now powered by Heart Signals.
 * Shows unread signal count badge and opens a compact dropdown.
 * Includes gateway to Hearth Notification Settings.
 */
import { useState, useEffect } from "react";
import { Bell, CheckCheck, X, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHeartSignals } from "@/hooks/use-heart-signals";
import { SIGNAL_TYPE_EMOJI } from "@/lib/heart-signal-types";
import { usePopupGate } from "@/contexts/UIFlowContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const popupsAllowed = usePopupGate();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { signals, unreadCount, markRead, markAllRead, dismiss } = useHeartSignals(userId);

  if (!userId) return null;

  const handleClick = (s: { id: string; deep_link: string | null }) => {
    markRead(s.id);
    if (s.deep_link) navigate(s.deep_link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1 md:p-1.5 rounded-full hover:bg-accent/20 transition-colors">
          <Bell className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/40 md:text-foreground/50" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 md:min-w-[16px] md:h-4 rounded-full text-[9px] md:text-[10px] font-bold flex items-center justify-center px-0.5"
              style={{
                background: "hsl(var(--primary) / 0.85)",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 border-border/50 bg-popover/95 backdrop-blur"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-serif tracking-wider text-foreground">Heart Signals</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] font-serif gap-1 text-muted-foreground"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {signals.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-2xl block mb-2">🌿</span>
              <p className="text-xs text-muted-foreground font-serif">The forest is quiet… for now</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {signals.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/10 transition-colors ${!s.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => handleClick(s)}
                >
                  <span className="text-lg mt-0.5">{SIGNAL_TYPE_EMOJI[s.signal_type] || "✨"}</span>
                   <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={`text-sm font-serif leading-snug truncate ${!s.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {s.title}
                    </p>
                    {s.body && (
                      <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">{s.body}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(s.id); }}
                    className="p-1 rounded hover:bg-accent/20 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Settings gateway */}
        <div className="border-t border-border/30 px-4 py-2">
          <button
            onClick={() => navigate("/dashboard?tab=notifications")}
            className="flex items-center gap-2 w-full text-left text-xs font-serif text-muted-foreground hover:text-foreground transition-colors py-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Notification Settings
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
