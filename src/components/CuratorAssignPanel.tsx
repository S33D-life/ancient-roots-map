import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, UserPlus, Search, X, Check } from "lucide-react";
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

export default function CuratorAssignPanel({ staffCode, onAssigned }: CuratorAssignPanelProps) {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const [expanded, setExpanded] = useState(false);
  const [wanderers, setWanderers] = useState<WandererOption[]>([]);
  const [currentOwner, setCurrentOwner] = useState<WandererOption | null>(null);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load staff owner + wanderers when expanded
  const loadData = useCallback(async () => {
    if (loaded) return;
    const [staffRes, profileRes] = await Promise.all([
      supabase.from("staffs").select("owner_user_id").eq("id", staffCode).single(),
      supabase.from("profiles").select("id, full_name, avatar_url").eq("is_discoverable", true).order("full_name"),
    ]);
    const ownerId = staffRes.data?.owner_user_id || null;
    setCurrentOwnerId(ownerId);
    setSelectedId(ownerId || "");
    const profiles = (profileRes.data as WandererOption[]) || [];
    setWanderers(profiles);
    if (ownerId) {
      setCurrentOwner(profiles.find((p) => p.id === ownerId) || null);
    }
    setLoaded(true);
  }, [staffCode, loaded]);

  useEffect(() => {
    if (expanded && hasRole) loadData();
  }, [expanded, hasRole, loadData]);

  // Reset when staffCode changes
  useEffect(() => {
    setLoaded(false);
    setExpanded(false);
    setCurrentOwner(null);
    setCurrentOwnerId(null);
    setSearchQ("");
    setSelectedId("");
  }, [staffCode]);

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return wanderers;
    const q = searchQ.toLowerCase();
    return wanderers.filter((w) => w.full_name?.toLowerCase().includes(q) || w.id.includes(q));
  }, [wanderers, searchQ]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    const { error } = await supabase
      .from("staffs")
      .update({ owner_user_id: selectedId })
      .eq("id", staffCode);
    if (error) {
      toast.error("Failed to assign: " + error.message);
    } else {
      const w = wanderers.find((w) => w.id === selectedId);
      toast.success(`${staffCode} → ${w?.full_name || "wanderer"}`);
      setCurrentOwner(w || null);
      setCurrentOwnerId(selectedId);
      onAssigned?.();
    }
    setSaving(false);
  };

  const handleUnassign = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("staffs")
      .update({ owner_user_id: null })
      .eq("id", staffCode);
    if (error) {
      toast.error("Failed to unassign: " + error.message);
    } else {
      toast.success(`${staffCode} unassigned`);
      setCurrentOwner(null);
      setCurrentOwnerId(null);
      setSelectedId("");
      onAssigned?.();
    }
    setSaving(false);
  };

  if (roleLoading || !hasRole) return null;

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs font-serif border-primary/20 text-primary hover:bg-primary/10"
        onClick={() => setExpanded(true)}
      >
        <Shield className="w-3.5 h-3.5" />
        Curator: Assign Steward
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
            className="text-muted-foreground hover:text-destructive transition-colors ml-auto"
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
