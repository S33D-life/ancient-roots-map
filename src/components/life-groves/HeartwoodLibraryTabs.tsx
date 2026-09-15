import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OFFERING_TYPES, type LifeGroveOffering, type OfferingType } from "@/lib/life-groves/types";
import LifeGroveOfferingGlyph from "./LifeGroveOfferingGlyph";
import OfferingLibraryCard from "./OfferingLibraryCard";
import { listGroveIdentities } from "@/repositories/life-grove-stewardship";

interface Props {
  offerings: LifeGroveOffering[];
  groveId?: string;
}

const VISIBLE_TYPES: OfferingType[] = [
  "photo", "story", "song", "recipe", "book", "poem", "letter", "voice_note", "bloom",
];

export default function HeartwoodLibraryTabs({ offerings, groveId }: Props) {
  const [tab, setTab] = useState<string>("all");

  // Attribution resolves from profiles, never from a stored email address.
  const { data: identities = [] } = useQuery({
    queryKey: ["grove-identities", groveId],
    queryFn: () => (groveId ? listGroveIdentities(groveId) : []),
    enabled: !!groveId,
    staleTime: 5 * 60 * 1000,
  });

  const nameFor = (userId: string | null) =>
    identities.find((i) => i.user_id === userId)?.display_name;

  const filtered = tab === "all"
    ? offerings
    : offerings.filter((o) => o.offering_type === tab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-card/40 p-1">
        <TabsTrigger value="all" className="text-xs font-serif">All</TabsTrigger>
        {VISIBLE_TYPES.map((t) => {
          const meta = OFFERING_TYPES.find((m) => m.value === t);
          if (!meta) return null;
          return (
            <TabsTrigger key={t} value={t} className="text-xs font-serif gap-1.5">
              <LifeGroveOfferingGlyph type={t} size={16} variant="card" />
              {meta.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <TabsContent value={tab} className="mt-4">
        {filtered.length === 0 ? (
          <p className="font-serif text-sm italic text-muted-foreground/70 py-8 text-center">
            Nothing hangs here yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((o) => (
              <OfferingLibraryCard
                key={o.id}
                offering={o}
                attribution={nameFor(o.contributor_user_id)}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
