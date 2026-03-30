/**
 * SeedLibraryCuratorPanel — Curator moderation panel for seed libraries.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check, X, Eye, EyeOff, Star, Shield, Search,
} from "lucide-react";
import {
  useSeedLibrariesAdmin,
  useUpdateSeedLibrary,
  type SeedLibrary,
} from "@/hooks/use-seed-libraries";
import { useHasRole } from "@/hooks/use-role";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700",
  pending: "bg-amber-500/15 text-amber-700",
  hidden: "bg-red-500/15 text-red-700",
  inactive: "bg-muted text-muted-foreground",
};

export default function SeedLibraryCuratorPanel() {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const { hasRole: isKeeper } = useHasRole("keeper");
  const canModerate = hasRole || isKeeper;

  const { data: libraries = [], isLoading } = useSeedLibrariesAdmin();
  const update = useUpdateSeedLibrary();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (roleLoading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>;
  if (!canModerate) return <div className="py-8 text-center text-muted-foreground">Curator access required</div>;

  const filtered = libraries.filter((lib) => {
    if (statusFilter !== "all" && lib.status !== statusFilter) return false;
    if (search && !lib.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = (lib: SeedLibrary, action: string) => {
    switch (action) {
      case "approve":
        update.mutate({ id: lib.id, updates: { status: "active", approved_at: new Date().toISOString() } });
        break;
      case "hide":
        update.mutate({ id: lib.id, updates: { is_hidden: true, status: "hidden" } });
        break;
      case "unhide":
        update.mutate({ id: lib.id, updates: { is_hidden: false, status: "active" } });
        break;
      case "feature":
        update.mutate({ id: lib.id, updates: { is_featured: !lib.is_featured } });
        break;
      case "curator_verify":
        update.mutate({ id: lib.id, updates: { verification_status: "curator_verified" } });
        break;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-serif">🔧 Seed Library Moderation</h3>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} libraries</p>
          {filtered.map((lib) => (
            <div
              key={lib.id}
              className="rounded-lg border border-border/50 p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{lib.name}</span>
                  <Badge className={`text-[9px] ${STATUS_COLORS[lib.status] || ""}`}>
                    {lib.status}
                  </Badge>
                  {lib.is_featured && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {lib.country} · {lib.verification_count} verifs · {lib.testimonial_count} stories
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                {lib.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Approve"
                    onClick={() => handleAction(lib, "approve")}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={lib.is_hidden ? "Unhide" : "Hide"}
                  onClick={() => handleAction(lib, lib.is_hidden ? "unhide" : "hide")}
                >
                  {lib.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Feature"
                  onClick={() => handleAction(lib, "feature")}
                >
                  <Star className={`w-3.5 h-3.5 ${lib.is_featured ? "text-amber-500 fill-amber-500" : ""}`} />
                </Button>
                {lib.verification_status !== "curator_verified" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Curator Verify"
                    onClick={() => handleAction(lib, "curator_verify")}
                  >
                    <Shield className="w-3.5 h-3.5 text-primary" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
