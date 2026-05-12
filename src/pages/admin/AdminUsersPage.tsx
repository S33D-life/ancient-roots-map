/**
 * AdminUsersPage — wanderer roster for keepers and curators.
 * Backed by the security-definer RPC `admin_users_list`. Never exposes secrets.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Shield, Search, Copy, Check, Download, ArrowUpDown, Crown, Users as UsersIcon } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHasRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/telemetry";
import { toast } from "sonner";

interface AdminUserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_keeper: boolean;
  is_curator: boolean;
  trees_added: number;
  offerings_count: number;
  hearts_earned: number;
}

export default function AdminUsersPage() {
  const { hasRole: isCurator, loading: lc } = useHasRole("curator");
  const { hasRole: isKeeper, loading: lk } = useHasRole("keeper");
  const allowed = isCurator || isKeeper;

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (allowed) track("admin_users_viewed");
  }, [allowed]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("admin_users_list", {
        search_query: debounced,
        result_limit: 200,
        sort_newest: sortNewest,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("Could not load wanderers — try again in a moment.");
          setRows([]);
        } else {
          setRows((data as AdminUserRow[]) ?? []);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [allowed, debounced, sortNewest]);

  const total = rows.length;
  const keepers = useMemo(() => rows.filter((r) => r.is_keeper).length, [rows]);

  const copyEmail = async (email: string | null, id: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(id);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      toast.error("Could not copy email.");
    }
  };

  const exportCsv = () => {
    const header = ["email", "full_name", "created_at", "last_sign_in_at", "is_keeper", "is_curator", "trees_added", "offerings_count", "hearts_earned"];
    const lines = rows.map((r) => header.map((h) => {
      const v = (r as any)[h];
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s33d-wanderers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (lc || lk) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Inner ring only</h1>
          <p className="text-muted-foreground font-serif">
            This roster is reserved for keepers and Heartwood curators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/admin" className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60 hover:text-primary">
            ← Admin Room
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <UsersIcon className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-serif text-primary tracking-wide">Wanderers</h1>
            </div>
            <p className="text-sm text-muted-foreground font-serif">
              {total} signed up · {keepers} keepers
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSortNewest((v) => !v)} className="font-serif">
              <ArrowUpDown className="w-4 h-4 mr-1.5" />
              {sortNewest ? "Newest first" : "Oldest first"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length} className="font-serif">
              <Download className="w-4 h-4 mr-1.5" />
              CSV
            </Button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="pl-9 font-serif"
          />
        </div>

        <Card className="bg-card/40 border-border/30">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground font-serif">
                No wanderers found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground/70 font-mono">
                      <th className="py-2.5 px-4 font-normal">Wanderer</th>
                      <th className="py-2.5 px-2 font-normal">Joined</th>
                      <th className="py-2.5 px-2 font-normal">Last seen</th>
                      <th className="py-2.5 px-2 font-normal text-right">Trees</th>
                      <th className="py-2.5 px-2 font-normal text-right">Offerings</th>
                      <th className="py-2.5 px-4 font-normal text-right">Hearts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.user_id} className="border-b border-border/15 hover:bg-card/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif text-foreground truncate">
                                  {r.full_name || "—"}
                                </span>
                                {r.is_keeper && (
                                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/40 text-amber-600 dark:text-amber-300">
                                    <Crown className="w-2.5 h-2.5 mr-0.5" /> keeper
                                  </Badge>
                                )}
                                {r.is_curator && !r.is_keeper && (
                                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                                    curator
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground/80 truncate max-w-[200px] sm:max-w-[260px]">
                                  {r.email || "no email"}
                                </span>
                                {r.email && (
                                  <button
                                    onClick={() => copyEmail(r.email, r.user_id)}
                                    className="p-1 rounded hover:bg-card text-muted-foreground/50 hover:text-primary transition-colors"
                                    aria-label="Copy email"
                                  >
                                    {copied === r.user_id
                                      ? <Check className="w-3 h-3 text-emerald-500" />
                                      : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground font-mono">
                          {r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "—"}
                        </td>
                        <td className="py-3 px-2 text-xs text-muted-foreground font-mono">
                          {r.last_sign_in_at ? new Date(r.last_sign_in_at).toISOString().slice(0, 10) : "—"}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-foreground/80">
                          {r.trees_added}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-foreground/80">
                          {r.offerings_count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-foreground/80">
                          {Number(r.hearts_earned ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
