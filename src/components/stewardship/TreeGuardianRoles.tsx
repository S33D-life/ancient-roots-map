/**
 * TreeGuardianRoles — displays guardians of a tree with their earned roles.
 */
import { useTreeGuardians, getRoleMeta } from "@/hooks/use-stewardship-actions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Props {
  treeId: string;
}

const TreeGuardianRoles = ({ treeId }: Props) => {
  const { data: guardians, isLoading } = useTreeGuardians(treeId);

  // Fetch profiles for guardians
  const guardianIds = (guardians || []).map(g => g.user_id);
  const { data: profiles } = useQuery({
    queryKey: ["guardian-profiles", guardianIds.join(",")],
    enabled: guardianIds.length > 0,
    staleTime: 120_000,
    queryFn: async () => {
      if (guardianIds.length === 0) return {};
      const { data } = await supabase.rpc("get_safe_profiles", { p_ids: guardianIds });
      const map: Record<string, { full_name: string; avatar_url: string | null }> = {};
      (data || []).forEach((p: any) => { map[p.id] = p; });
      return map;
    },
  });

  if (isLoading) return null;
  if (!guardians || guardians.length === 0) return null;

  // Group by user
  const byUser = new Map<string, typeof guardians>();
  guardians.forEach(g => {
    const list = byUser.get(g.user_id) || [];
    list.push(g);
    byUser.set(g.user_id, list);
  });

  return (
    <Card className="bg-card/60 backdrop-blur border-border/40 overflow-hidden">
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h4 className="font-serif text-sm text-foreground tracking-wide">Guardians</h4>
          <Badge variant="outline" className="text-[9px] font-serif ml-auto">
            {byUser.size} {byUser.size === 1 ? "guardian" : "guardians"}
          </Badge>
        </div>

        <div className="space-y-2">
          {Array.from(byUser.entries()).map(([userId, roles], i) => {
            const profile = profiles?.[userId];
            const initials = (profile?.full_name || "?").charAt(0).toUpperCase();
            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/wanderer/${userId}`} className="flex items-center gap-2.5 rounded-lg border border-border/30 p-2.5 hover:border-primary/30 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-foreground truncate">
                      {profile?.full_name || "Wanderer"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {roles.map(r => {
                        const meta = getRoleMeta(r.role);
                        return (
                          <Badge
                            key={r.id}
                            variant="outline"
                            className="text-[8px] font-serif gap-0.5"
                            style={{ borderColor: `${meta.color}40`, color: meta.color }}
                          >
                            {meta.emoji} {meta.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TreeGuardianRoles;
