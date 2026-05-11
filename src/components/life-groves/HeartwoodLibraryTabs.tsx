import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OFFERING_TYPES, type LifeGroveOffering, type OfferingType } from "@/lib/life-groves/types";
import HangingMemoryTree from "./HangingMemoryTree";

interface Props {
  offerings: LifeGroveOffering[];
}

const VISIBLE_TYPES: OfferingType[] = [
  "photo", "story", "song", "recipe", "book", "poem", "letter", "voice_note",
];

export default function HeartwoodLibraryTabs({ offerings }: Props) {
  const [tab, setTab] = useState<string>("all");

  const filtered = tab === "all"
    ? offerings
    : offerings.filter((o) => o.offering_type === tab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-card/40 p-1">
        <TabsTrigger value="all" className="text-xs font-serif">All</TabsTrigger>
        {VISIBLE_TYPES.map((t) => {
          const meta = OFFERING_TYPES.find((m) => m.value === t)!;
          return (
            <TabsTrigger key={t} value={t} className="text-xs font-serif">
              <span className="mr-1" aria-hidden>{meta.glyph}</span>
              {meta.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <TabsContent value={tab} className="mt-4">
        <HangingMemoryTree offerings={filtered} />
      </TabsContent>
    </Tabs>
  );
}
