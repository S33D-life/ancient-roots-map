/**
 * ManualStaffPicker — Allows a user to manually link a staff as their
 * primary identity, bypassing the wallet/on-chain flow.
 * Reads available staffs from the DB and updates profiles.active_staff_id.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Wand2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StaffOption {
  id: string;
  species: string;
  species_code: string;
  token_id: number;
  circle_id: number;
  staff_number: number;
  is_origin_spiral: boolean;
  image_url: string | null;
}

interface ManualStaffPickerProps {
  userId: string;
  currentStaffId: string | null;
  onLinked: (staff: StaffOption | null) => void;
}

export default function ManualStaffPicker({ userId, currentStaffId, onLinked }: ManualStaffPickerProps) {
  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(currentStaffId);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("staffs")
        .select("id, species, species_code, token_id, circle_id, staff_number, is_origin_spiral, image_url")
        .order("token_id", { ascending: true });
      setStaffs((data as unknown as StaffOption[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    setSelectedId(currentStaffId);
  }, [currentStaffId]);

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return staffs;
    const q = searchQ.toLowerCase();
    return staffs.filter(
      (s) =>
        s.species.toLowerCase().includes(q) ||
        s.species_code.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        String(s.token_id).includes(q)
    );
  }, [staffs, searchQ]);

  const handleLink = async () => {
    if (!selectedId) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ active_staff_id: selectedId } as any)
      .eq("id", userId);

    if (error) {
      toast.error("Failed to link staff: " + error.message);
    } else {
      const staff = staffs.find((s) => s.id === selectedId) || null;
      // Also persist to localStorage for JourneyStatusBar fallback
      if (staff) {
        localStorage.setItem("linked_staff_code", staff.id);
        localStorage.setItem("linked_staff_name", staff.species);
        localStorage.setItem("linked_staff_token_id", String(staff.token_id));
      }
      toast.success(`Staff linked: ${staff?.species || selectedId}`);
      onLinked(staff);
    }
    setSaving(false);
  };

  const handleUnlink = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ active_staff_id: null } as any)
      .eq("id", userId);

    if (error) {
      toast.error("Failed to unlink: " + error.message);
    } else {
      localStorage.removeItem("linked_staff_code");
      localStorage.removeItem("linked_staff_name");
      localStorage.removeItem("linked_staff_token_id");
      setSelectedId(null);
      toast.success("Staff unlinked");
      onLinked(null);
    }
    setSaving(false);
  };

  const current = staffs.find((s) => s.id === currentStaffId);

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-serif flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-primary/70" />
            Link Staff (Manual)
          </h3>
          {current && (
            <Badge
              variant="outline"
              className="text-[10px] font-serif border-primary/30 text-primary gap-1"
            >
              {current.species} · #{current.token_id}
            </Badge>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Temporarily assign a staff as your primary identity. This links before full on-chain verification.
        </p>

        {/* Current linked staff */}
        {current && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
            <div className="w-10 h-10 rounded-md overflow-hidden border border-primary/30 shrink-0">
              <img
                src={current.image_url || `/images/staffs/${current.species_code.toLowerCase()}.jpeg`}
                alt={current.species}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-foreground">{current.species}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {current.id} · Token #{current.token_id}
              </p>
            </div>
            <button
              onClick={handleUnlink}
              disabled={saving}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Unlink staff"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search by species, code, or token #…"
            className="pl-8 h-8 text-xs font-serif"
          />
        </div>

        {/* Staff grid */}
        <div className="max-h-52 overflow-y-auto space-y-0.5 rounded-md border border-border/30 p-1.5">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-6 font-serif">
              {staffs.length === 0 ? "No staffs in the database yet" : "No matches"}
            </p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                  selectedId === s.id
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <div className="w-7 h-7 rounded overflow-hidden border border-border/40 shrink-0">
                  <img
                    src={s.image_url || `/images/staffs/${s.species_code.toLowerCase()}.jpeg`}
                    alt={s.species}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-serif truncate block">{s.species}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    #{s.token_id} · {s.is_origin_spiral ? "Origin" : `C${s.circle_id}`}
                  </span>
                </div>
                {selectedId === s.id && <Check className="w-3 h-3 ml-auto shrink-0" />}
              </button>
            ))
          )}
        </div>

        {/* Link button */}
        <Button
          size="sm"
          className="w-full gap-2 text-xs font-serif"
          onClick={handleLink}
          disabled={!selectedId || selectedId === currentStaffId || saving}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {currentStaffId ? "Change Linked Staff" : "Link Staff"}
        </Button>
      </CardContent>
    </Card>
  );
}
