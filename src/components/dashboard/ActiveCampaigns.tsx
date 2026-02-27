import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Flame, Timer } from "lucide-react";

const ActiveCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("heart_campaigns")
      .select("*")
      .eq("status", "active")
      .order("ends_at", { ascending: true })
      .limit(5)
      .then(({ data }) => setCampaigns(data || []));
  }, []);

  if (campaigns.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-card/40 border border-border/20 text-center">
        <p className="text-sm text-muted-foreground font-serif italic">No active campaigns right now. The grove rests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Flame className="w-4 h-4 text-primary" />
        <h3 className="font-serif text-sm tracking-widest text-primary uppercase">Active Campaigns</h3>
      </div>
      {campaigns.map((c) => {
        const now = Date.now();
        const end = new Date(c.ends_at).getTime();
        const start = new Date(c.starts_at).getTime();
        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

        return (
          <div key={c.id} className="p-4 rounded-xl bg-card/60 backdrop-blur border border-border/30 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-serif text-sm text-foreground">{c.title}</h4>
                {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Timer className="w-3.5 h-3.5" />
                {daysLeft}d
              </div>
            </div>
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{c.hearts_distributed}/{c.heart_pool} hearts</span>
                <span>{Math.round(progress)}% elapsed</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveCampaigns;
