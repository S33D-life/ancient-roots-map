/**
 * AncientFriendDebugPanel — DEV ONLY.
 * Shows the runtime context behind whisper / plant-hearts / check-in actions
 * so testers can quickly see why a button is allowed or refused.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHeartBalance } from "@/hooks/use-heart-balance";
import { useTreeRooting } from "@/hooks/use-tree-rooting";

interface Props {
  treeId: string;
  treeSpecies?: string | null;
  userId: string | null;
  isNearby: boolean;
  isCheckedIn: boolean;
}

export default function AncientFriendDebugPanel({
  treeId, treeSpecies, userId, isNearby, isCheckedIn,
}: Props) {
  if (!import.meta.env.DEV) return null;

  const [profileId, setProfileId] = useState<string | null>(null);
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const [checkinsToday, setCheckinsToday] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const balance = useHeartBalance(userId);
  const rooting = useTreeRooting(userId, treeId, { isNearby, isCheckedIn, hasVisited: true });

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("id").eq("id", userId).maybeSingle()
      .then(({ data }) => setProfileId((data as any)?.id ?? null));
  }, [userId]);

  useEffect(() => {
    if (!treeSpecies) return;
    supabase.from("species_index" as any).select("id").ilike("canonical_name", treeSpecies).maybeSingle()
      .then(({ data }) => setSpeciesId((data as any)?.id ?? null));
  }, [treeSpecies]);

  useEffect(() => {
    if (!userId || !treeId) return;
    supabase
      .from("tree_checkins")
      .select("created_at")
      .eq("user_id", userId)
      .eq("tree_id", treeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLastCheckin((data as any)?.created_at ?? null));
    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);
    supabase
      .from("tree_checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfDayUtc.toISOString())
      .then(({ count }) => setCheckinsToday(count ?? 0));
  }, [userId, treeId]);

  const whisperAllowed = !!userId && !!treeId;
  const plantAllowed = !!userId && rooting.canPlant && balance.totalHearts > 0;
  const witnessAllowed = isNearby || isCheckedIn;

  const Row = ({ k, v }: { k: string; v: any }) => (
    <div className="flex justify-between gap-4 py-0.5 border-b border-dashed border-foreground/10">
      <span className="text-foreground/60">{k}</span>
      <span className="font-mono text-[10px] truncate max-w-[180px]" title={String(v)}>{String(v)}</span>
    </div>
  );

  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/10 text-xs font-mono">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-amber-700 dark:text-amber-400"
      >
        <span>🛠 Ancient Friend Debug ({open ? "hide" : "show"})</span>
        <span>{plantAllowed ? "🌱" : "—"} {whisperAllowed ? "🌬" : "—"} {witnessAllowed ? "📍" : "—"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-0.5 text-[11px]">
          <Row k="user_id" v={userId ?? "—"} />
          <Row k="profile_id" v={profileId ?? "(missing!)"} />
          <Row k="tree_id" v={treeId} />
          <Row k="species" v={treeSpecies ?? "—"} />
          <Row k="species_id" v={speciesId ?? "—"} />
          <Row k="last_checkin" v={lastCheckin ?? "never"} />
          <Row k="checkins_today" v={checkinsToday} />
          <Row k="isNearby" v={isNearby} />
          <Row k="isCheckedIn" v={isCheckedIn} />
          <Row k="hearts_available" v={balance.totalHearts} />
          <Row k="hearts_planted_here" v={rooting.root?.amount ?? 0} />
          <Row k="growth_pending" v={rooting.growth} />
          <Row k="whisper_allowed" v={whisperAllowed} />
          <Row k="plant_allowed" v={plantAllowed} />
          <Row k="witness_allowed" v={witnessAllowed} />
        </div>
      )}
    </div>
  );
}
