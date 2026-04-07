/**
 * DailyHearthSummary — calm daily aggregation of hearts earned and whispers received.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Wind } from "lucide-react";

interface DailyHearthSummaryProps {
  userId: string;
}

interface DailySummary {
  heartsToday: number;
  whispersToday: number;
}

export default function DailyHearthSummary({ userId }: DailyHearthSummaryProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isoStart = todayStart.toISOString();

    const fetchSummary = async () => {
      const [heartsRes, whispersRes] = await Promise.all([
        supabase
          .from("heart_transactions")
          .select("amount")
          .eq("user_id", userId)
          .gte("created_at", isoStart),
        supabase
          .from("whisper_receipts")
          .select("id")
          .eq("recipient_user_id", userId)
          .gte("received_at", isoStart),
      ]);

      const hearts = (heartsRes.data || []).reduce((s, h) => s + (h.amount || 0), 0);
      const whispers = whispersRes.data?.length || 0;

      setSummary({ heartsToday: hearts, whispersToday: whispers });
    };

    fetchSummary();
  }, [userId]);

  if (!summary || (summary.heartsToday === 0 && summary.whispersToday === 0)) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-1"
      style={{
        background: "hsl(var(--card) / 0.4)",
        border: "1px solid hsl(var(--border) / 0.15)",
      }}
    >
      <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">
        Today
      </p>
      <div className="flex items-center gap-4">
        {summary.heartsToday > 0 && (
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" style={{ color: "hsl(140 40% 55%)" }} />
            <span className="text-sm font-serif" style={{ color: "hsl(140 40% 55%)" }}>
              {summary.heartsToday} heart{summary.heartsToday !== 1 ? "s" : ""} gathered
            </span>
          </div>
        )}
        {summary.whispersToday > 0 && (
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5" style={{ color: "hsl(260 40% 60%)" }} />
            <span className="text-sm font-serif" style={{ color: "hsl(260 40% 60%)" }}>
              {summary.whispersToday} whisper{summary.whispersToday !== 1 ? "s" : ""} received
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
