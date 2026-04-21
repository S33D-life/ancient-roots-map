/**
 * NotificationsBadge — surfaces the existing useNotifications stream.
 * Sits alongside the Heart Signals bell. Lightweight popover list.
 *
 * Categories first surfaced: tree_visit, whisper, resonance.
 * Tap an item → marks read + navigates to deep_link if present.
 */
import { useEffect, useState } from "react";
import { Heart, CheckCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";

const CATEGORY_EMOJI: Record<string, string> = {
  tree_visit: "🌳",
  whisper: "🍄",
  resonance: "💧",
  invite: "🌱",
  general: "✨",
};

const NotificationsBadge = () => {
  const [userId, setUserId] = useState<string | null>(null);
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

  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications(userId);

  if (!userId) return null;

  const handleClick = (n: AppNotification) => {
    if (!n.read_at) markRead(n.id);
    if (n.deep_link) navigate(n.deep_link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-1 md:p-1.5 rounded-full hover:bg-accent/20 transition-colors"
          aria-label={unreadCount > 0 ? `${unreadCount} new notifications` : "Notifications"}
        >
          <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/40 md:text-foreground/50" />
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-serif tracking-wider text-foreground">What the forest sent you</h3>
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
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-6">
              <span className="text-2xl block mb-2">🌿</span>
              <p className="text-xs text-muted-foreground font-serif italic leading-relaxed">
                The grove is quiet.<br />Plant a seed, leave a whisper —<br />signs will arrive.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/10 transition-colors ${
                    !n.read_at ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <span className="text-lg mt-0.5">{CATEGORY_EMOJI[n.category] || "✨"}</span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p
                      className={`text-sm font-serif leading-snug ${
                        !n.read_at ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">
                      {new Date(n.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id);
                    }}
                    className="p-1 rounded hover:bg-accent/20 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBadge;
