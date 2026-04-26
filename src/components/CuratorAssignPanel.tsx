import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, UserPlus, Search, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WandererOption {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface CuratorAssignPanelProps {
  staffCode: string;
  onAssigned?: () => void;
}

interface AssignResult {
  success: boolean;
  code: string;
  message: string;
  staff_code?: string;
  owner_user_id?: string | null;
  owner_name?: string | null;
  previous_owner_id?: string | null;
  sqlstate?: string;
}

export default function CuratorAssignPanel({ staffCode, onAssigned }: CuratorAssignPanelProps) {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const { hasRole: isKeeper } = useHasRole("keeper");
  const canModerate = hasRole || isKeeper;

  const [expanded, setExpanded] = useState(false);
  const [wanderers, setWanderers] = useState<WandererOption[]>([]);
  const [currentOwner, setCurrentOwner] = useState<WandererOption | null>(null);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Load staff owner + wanderers
  const loadData = useCallback(async (force = false) => {
    if (loaded && !force) return;
    const [staffRes, profileRes] = await Promise.all([
      supabase.from("staffs").select("owner_user_id").eq("id", staffCode).maybeSingle(),
      supabase.rpc("search_discoverable_profiles", { search_query: "", result_limit: 200 }),
    ]);
    const ownerId = staffRes.data?.owner_user_id || null;
    setCurrentOwnerId(ownerId);
    setSelectedId(ownerId || "");
    const profiles = (profileRes.data as WandererOption[]) || [];
    setWanderers(profiles);
    if (ownerId) {
      // Try profile list first; if missing, fetch directly so we can always show the assignee
      const fromList = profiles.find((p) => p.id === ownerId) || null;
      if (fromList) {
        setCurrentOwner(fromList);
      } else {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", ownerId)
          .maybeSingle();
        setCurrentOwner((prof as WandererOption) || null);
      }
    } else {
      setCurrentOwner(null);
    }
    setLoaded(true);
  }, [staffCode, loaded]);

  useEffect(() => {
    if (expanded && canModerate) loadData();
  }, [expanded, canModerate, loadData]);

  // Reset on staff change
  useEffect(() => {
    setLoaded(false);
    setExpanded(false);
    setCurrentOwner(null);
    setCurrentOwnerId(null);
    setSearchQ("");
    setSelectedId("");
    setLastError(null);
  }, [staffCode]);

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return wanderers;
    const q = searchQ.toLowerCase();
    return wanderers.filter((w) => w.full_name?.toLowerCase().includes(q) || w.id.includes(q));
  }, [wanderers, searchQ]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    setLastError(null);
    try {
      const { data, error } = await supabase.rpc("assign_staff_steward", {
        p_staff_code: staffCode,
        p_new_owner_id: selectedId,
      });

      if (error) {
        // Network/transport error
        console.error("[curator-assign] RPC transport error:", error);
        const msg = error.message || "Network error reaching the assignment service.";
        setLastError(msg);
        toast.error(`Couldn't assign: ${msg}`);
        return;
      }

      const result = data as unknown as AssignResult | null;
      if (!result) {
        setLastError("Empty response from server.");
        toast.error("Couldn't assign: empty response from server.");
        return;
      }

      if (!result.success) {
        console.error("[curator-assign] Assignment rejected:", result);
        setLastError(result.message);
        toast.error(result.message, {
          description: result.code === "forbidden"
            ? "Ask a senior curator to grant you the curator role."
            : result.code === "profile_not_found"
              ? "The wanderer's profile may have been removed. Refresh and try again."
              : result.code === "staff_not_found"
                ? `Staff code "${staffCode}" wasn't found in the database.`
                : undefined,
        });
        return;
      }

      // Success
      const w = wanderers.find((w) => w.id === selectedId);
      const ownerName = result.owner_name || w?.full_name || "wanderer";
      toast.success(`${staffCode} → ${ownerName}`, {
        description: result.code === "unchanged" ? "Already the steward." : undefined,
      });
      setCurrentOwner(w || { id: selectedId, full_name: result.owner_name || null, avatar_url: null });
      setCurrentOwnerId(selectedId);
      setLastError(null);
      onAssigned?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[curator-assign] Unexpected error:", err);
      setLastError(msg);
      toast.error(`Couldn't assign: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    setLastError(null);
    try {
      const { data, error } = await supabase.rpc("unassign_staff_steward", {
        p_staff_code: staffCode,
      });
      if (error) {
        console.error("[curator-assign] Unassign transport error:", error);
        setLastError(error.message);
        toast.error(`Couldn't unassign: ${error.message}`);
        return;
      }
      const result = data as unknown as AssignResult | null;
      if (!result || !result.success) {
        const msg = result?.message || "Unknown error.";
        console.error("[curator-assign] Unassign rejected:", result);
        setLastError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`${staffCode} unassigned`);
      setCurrentOwner(null);
      setCurrentOwnerId(null);
      setSelectedId("");
      onAssigned?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[curator-assign] Unassign unexpected error:", err);
      setLastError(msg);
      toast.error(`Couldn't unassign: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || !canModerate) return null;

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs font-serif border-primary/20 text-primary hover:bg-primary/10"
        onClick={() => setExpanded(true)}
      >
        <Shield className="w-3.5 h-3.5" />
        {currentOwnerId ? "Curator: Reassign Steward" : "Curator: Assign Steward"}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-serif font-medium text-primary">Assign Steward</span>
        </div>
        <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Current owner */}
      {currentOwner && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Current:</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-serif gap-1">
            {currentOwner.full_name || "Unnamed"}
          </Badge>
          <button
            onClick={handleUnassign}
            disabled={saving}
            className="text-muted-foreground hover:text-destructive transition-colors ml-auto disabled:opacity-50"
            title="Unassign"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {!currentOwner && loaded && (
        <p className="text-[10px] text-muted-foreground italic">No steward assigned</p>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search wanderers…"
          className="pl-8 h-8 text-xs font-serif"
        />
      </div>

      {/* Wanderer list */}
      <div className="max-h-40 overflow-y-auto space-y-0.5 rounded-md border border-border/30 p-1.5">
        {!loaded ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3 font-serif">No wanderers found</p>
        ) : (
          filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                selectedId === w.id
                  ? "bg-primary/15 text-primary"
                  : "hover:bg-muted/50 text-foreground"
              }`}
            >
              {w.avatar_url ? (
                <img src={w.avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  {(w.full_name || "?")[0]}
                </div>
              )}
              <span className="font-serif truncate">{w.full_name || "Unnamed"}</span>
              {selectedId === w.id && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))
        )}
      </div>

      {/* Inline error so curator sees the actual reason without dismissing the toast */}
      {lastError && (
        <div className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[10px] text-destructive font-serif">
          <AlertCircle className="w-3 h-3 mt-px shrink-0" />
          <span className="leading-tight">{lastError}</span>
        </div>
      )}

      {/* Assign button */}
      <Button
        size="sm"
        className="w-full gap-2 text-xs font-serif"
        onClick={handleAssign}
        disabled={!selectedId || selectedId === currentOwnerId || saving}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
        {currentOwnerId ? "Reassign" : "Assign"} Staff
      </Button>
    </div>
  );
}
