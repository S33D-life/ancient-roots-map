/**
 * GroveGuardianSection — displays guardians on grove pages
 * and allows authenticated users to become a guardian.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, UserPlus } from "lucide-react";
import {
  useGroveGuardians,
  useIsGroveGuardian,
  useBecomeGuardian,
  GUARDIAN_ROLE_LABELS,
  GUARDIAN_ROLE_ICONS,
  type GroveGuardian,
} from "@/hooks/use-grove-guardians";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Props {
  groveId: string;
  groveName?: string;
}

function GuardianAvatar({ guardian }: { guardian: GroveGuardian }) {
  const name = guardian.profile?.full_name || "Wanderer";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/wanderer/${guardian.user_id}`}
      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
    >
      <Avatar className="w-8 h-8 border border-primary/15">
        <AvatarImage src={guardian.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-primary/8 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors truncate">
          {name}
        </p>
        <p className="text-[9px] text-muted-foreground flex items-center gap-1">
          <span>{GUARDIAN_ROLE_ICONS[guardian.role]}</span>
          {GUARDIAN_ROLE_LABELS[guardian.role]}
          {guardian.contribution_score > 0 && (
            <span className="text-primary/50 ml-1">· {guardian.contribution_score} contributions</span>
          )}
        </p>
      </div>
    </Link>
  );
}

export default function GroveGuardianSection({ groveId, groveName }: Props) {
  const { user } = useCurrentUser();
  const { data: guardians, isLoading } = useGroveGuardians(groveId);
  const { isGuardian, role } = useIsGroveGuardian(groveId);
  const becomeGuardian = useBecomeGuardian();

  if (isLoading) return null;

  return (
    <Card className="border-primary/10 bg-card/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary/60" />
            <h3 className="text-sm font-serif font-medium text-foreground">
              Grove Guardians
            </h3>
          </div>
          {guardians && guardians.length > 0 && (
            <Badge variant="outline" className="text-[9px] text-muted-foreground border-border/30">
              {guardians.length} guardian{guardians.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Guardian list */}
        {guardians && guardians.length > 0 ? (
          <div className="space-y-0.5">
            {guardians.map(g => (
              <GuardianAvatar key={g.id} guardian={g} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">
            This grove has no guardians yet. Be the first to care for it.
          </p>
        )}

        {/* Become guardian CTA */}
        {user && !isGuardian && (
          <Button
            variant="sacred"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => becomeGuardian.mutate({ groveId })}
            disabled={becomeGuardian.isPending}
          >
            <UserPlus className="w-3 h-3 mr-1.5" />
            {becomeGuardian.isPending ? "Joining…" : "Become a Guardian"}
          </Button>
        )}

        {/* Current user badge */}
        {isGuardian && role && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-sm">{GUARDIAN_ROLE_ICONS[role]}</span>
            <p className="text-[11px] text-primary font-serif">
              You are a <span className="font-medium">{GUARDIAN_ROLE_LABELS[role]}</span> of this grove
            </p>
          </div>
        )}

        {!user && (
          <p className="text-[10px] text-muted-foreground text-center italic">
            Sign in to become a guardian of this grove
          </p>
        )}
      </CardContent>
    </Card>
  );
}
