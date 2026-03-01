/**
 * Notification bell icon for the header — shows unread count badge.
 * Opens a dropdown inbox. Respects popup suppression.
 */
import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";
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

  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications(userId);

  if (!userId) return null;

  const handleClick = (n: AppNotification) => {
    markRead(n.id);
    if (n.deep_link) navigate(n.deep_link);
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "whisper": return "🕊";
      case "council": return "🌿";
      case "presence": return "📍";
      case "weather": return "☁️";
      case "heart": return "❤️";
      case "referral": return "🎁";
      default: return "🔔";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 rounded-lg hover:bg-accent/20 transition-colors">
          <Bell className="w-5 h-5 text-foreground/70" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1"
              style={{
                background: "hsl(var(--primary))",
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
          <h3 className="text-sm font-serif tracking-wider text-foreground">Notifications</h3>
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
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-serif">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/10 transition-colors ${!n.read_at ? "bg-primary/5" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="text-lg mt-0.5">{categoryIcon(n.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-serif ${!n.read_at ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="p-1 rounded hover:bg-accent/20 text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
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

export default NotificationBell;
