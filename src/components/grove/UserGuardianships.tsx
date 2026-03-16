/**
 * UserGuardianships — shows groves a user guards.
 * For use on user profile pages.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, TreeDeciduous, Leaf, ChevronRight } from "lucide-react";
import { useUserGuardianships } from "@/hooks/use-grove-guardians";
import GroveGuardianBadge from "./GroveGuardianBadge";

interface Props {
  userId: string;
}

export default function UserGuardianships({ userId }: Props) {
  const { data: guardianships, isLoading } = useUserGuardianships(userId);

  if (isLoading || !guardianships?.length) return null;

  return (
    <Card className="border-primary/10 bg-card/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary/60" />
          <h3 className="text-sm font-serif font-medium text-foreground">
            Grove Guardian
          </h3>
        </div>

        <div className="space-y-1.5">
          {guardianships.map((g: any) => (
            <Link
              key={g.id}
              to={`/map?lat=${g.grove?.center_latitude}&lng=${g.grove?.center_longitude}&zoom=15`}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
            >
              <div className="p-1.5 rounded-full bg-primary/8 shrink-0">
                {g.grove?.grove_type === "species_grove"
                  ? <Leaf className="w-3.5 h-3.5 text-primary" />
                  : <TreeDeciduous className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors truncate">
                  {g.grove?.grove_name || "Unnamed Grove"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <GroveGuardianBadge role={g.role} compact />
                  <span className="text-[9px] text-muted-foreground">
                    · {g.grove?.tree_count || 0} trees
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
