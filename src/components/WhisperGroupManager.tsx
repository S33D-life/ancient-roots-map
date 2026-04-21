/**
 * WhisperGroupManager — list owned whisper groups, add + remove members.
 *
 * - Wanderer search via search_discoverable_profiles RPC.
 * - All writes gated server-side by RLS (owner-only on whisper_group_members).
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  useUserWhisperGroups,
  useGroupMembers,
  createWhisperGroup,
  addGroupMember,
  removeGroupMember,
  deleteWhisperGroup,
  type WhisperGroup,
} from "@/hooks/use-mycelial-whispers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Users, Plus, X, Search, Sparkles, ChevronDown, ChevronRight, Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface WandererResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const TYPE_META: Record<WhisperGroup["group_type"], { label: string; icon: string }> = {
  family: { label: "Family", icon: "🌿" },
  council: { label: "Council", icon: "🌕" },
  custom: { label: "Circle", icon: "🍄" },
};

export default function WhisperGroupManager({ userId }: { userId: string | null }) {
  const { groups, loading, refetch } = useUserWhisperGroups(userId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WhisperGroup["group_type"]>("family");

  const ownedGroups = groups.filter(g => g.owner_id === userId);

  if (!userId) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary/70" />
          <h2 className="text-lg font-serif text-primary tracking-wide">Your Circles</h2>
        </div>
        {!creating && (
          <Button
            size="sm"
            variant="outline"
            className="font-serif text-xs h-7 gap-1"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-3 h-3" /> New circle
          </Button>
        )}
      </div>
      <p className="text-[11px] font-serif text-muted-foreground -mt-2">
        Add wanderers to a circle so you can whisper to them all at once.
      </p>

      {creating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 space-y-2">
            <Input
              placeholder="Name this circle…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="font-serif text-sm"
            />
            <div className="flex gap-1.5">
              {(Object.keys(TYPE_META) as WhisperGroup["group_type"][]).map(t => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`text-[11px] font-serif px-2.5 py-1 rounded-full border transition-colors ${
                    newType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {TYPE_META[t].icon} {TYPE_META[t].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="font-serif text-xs h-7"
                onClick={async () => {
                  if (!newName.trim()) return;
                  const { data, error } = await createWhisperGroup(newName.trim(), newType);
                  if (error) { toast.error("Couldn't create circle."); return; }
                  setNewName("");
                  setCreating(false);
                  await refetch();
                  if (data?.id) setExpandedId(data.id);
                  toast.success("Circle created.");
                }}
              >Create</Button>
              <Button
                size="sm"
                variant="ghost"
                className="font-serif text-xs h-7"
                onClick={() => { setCreating(false); setNewName(""); }}
              >Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
        </div>
      ) : ownedGroups.length === 0 && !creating ? (
        <Card className="border-dashed border-border/50 bg-muted/20">
          <CardContent className="p-6 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-serif text-muted-foreground">
              No circles yet. Create one to send group whispers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {ownedGroups.map(g => (
            <GroupRow
              key={g.id}
              group={g}
              expanded={expandedId === g.id}
              onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
              onDeleted={refetch}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function GroupRow({
  group, expanded, onToggle, onDeleted,
}: {
  group: WhisperGroup;
  expanded: boolean;
  onToggle: () => void;
  onDeleted: () => void;
}) {
  const meta = TYPE_META[group.group_type] ?? TYPE_META.custom;
  const { members, loading, refetch } = useGroupMembers(expanded ? group.id : null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<WandererResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!expanded || search.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_discoverable_profiles", {
        search_query: search,
        result_limit: 6,
      });
      const memberIds = new Set(members.map(m => m.user_id));
      setResults(((data as any[]) || []).filter(p => !memberIds.has(p.id)));
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [search, expanded, members]);

  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
        >
          <span className="text-xl" aria-hidden>{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-foreground truncate">{group.name}</p>
            <p className="text-[10px] font-serif text-muted-foreground/70">
              {meta.label} circle
            </p>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/30"
            >
              <div className="p-3 space-y-3">
                {/* Members */}
                {loading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-[11px] font-serif text-muted-foreground italic text-center py-2">
                    No members yet — search below to add wanderers.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {members.map(m => (
                      <div
                        key={m.user_id}
                        className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1.5"
                      >
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-serif text-primary">
                            {(m.full_name?.[0] || "?").toUpperCase()}
                          </div>
                        )}
                        <span className="flex-1 text-xs font-serif text-foreground/85 truncate">
                          {m.full_name || "Unnamed wanderer"}
                        </span>
                        <button
                          onClick={async () => {
                            const { error } = await removeGroupMember(group.id, m.user_id);
                            if (error) { toast.error("Couldn't remove."); return; }
                            await refetch();
                            toast.success("Removed from circle.");
                          }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Badge variant="outline" className="text-[10px] font-serif border-border/40">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </Badge>

                {/* Add member search */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      placeholder="Search wanderers to add…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="font-serif text-xs h-8 pl-7"
                    />
                  </div>
                  {searching && (
                    <p className="text-[10px] font-serif text-muted-foreground italic px-1">
                      Searching…
                    </p>
                  )}
                  {results.length > 0 && (
                    <div className="space-y-1 rounded-md border border-border/30 p-1 bg-background">
                      {results.map(p => (
                        <button
                          key={p.id}
                          onClick={async () => {
                            const { error } = await addGroupMember(group.id, p.id);
                            if (error) { toast.error("Couldn't add."); return; }
                            setSearch("");
                            setResults([]);
                            await refetch();
                            toast.success("Added to circle.");
                          }}
                          className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted text-left transition-colors"
                        >
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-serif text-primary">
                              {(p.full_name?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-serif text-foreground/85 truncate flex-1">
                            {p.full_name || "Unnamed wanderer"}
                          </span>
                          <Plus className="w-3.5 h-3.5 text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                  {search.length >= 2 && !searching && results.length === 0 && (
                    <p className="text-[10px] font-serif text-muted-foreground italic px-1">
                      No matching wanderers found.
                    </p>
                  )}
                </div>

                {/* Delete circle */}
                <div className="pt-2 border-t border-border/30">
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${group.name}"? This can't be undone.`)) return;
                      const { error } = await deleteWhisperGroup(group.id);
                      if (error) { toast.error("Couldn't delete circle."); return; }
                      onDeleted();
                      toast.success("Circle deleted.");
                    }}
                    className="text-[11px] font-serif text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete this circle
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
