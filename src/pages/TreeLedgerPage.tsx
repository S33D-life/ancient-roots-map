/**
 * TreeLedgerPage — Flagship transparency interface.
 * Dual-mode explorer: Table view + Species Spiral visualization.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import LedgerStats from "@/components/ledger/LedgerStats";
import ExplorerTable from "@/components/ledger/ExplorerTable";
import SpeciesSpiral from "@/components/ledger/SpeciesSpiral";
import TreeReservoirLeaderboard from "@/components/TreeReservoirLeaderboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTreeLedger } from "@/hooks/use-tree-ledger";
import { TableProperties, Circle } from "lucide-react";

const TreeLedgerPage = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<"explorer" | "spiral">("explorer");
  const navigate = useNavigate();

  const {
    trees,
    visitCounts,
    heartCounts,
    lastVisitDates,
    loading,
    speciesList,
    nationsList,
    totalVisits,
    totalHearts,
    uniqueMappers,
    windfallsTriggered,
    speciesNodes,
    treesMap,
  } = useTreeLedger();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  return (
    <div className="relative min-h-screen">
      <HeartwoodBackground />
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-16 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground tracking-wide">
            Tree Ledger
          </h1>
          <p className="text-sm text-muted-foreground font-serif max-w-lg mx-auto">
            The transparency layer of the Ancient Friends network.
            Every tree mapped. Every visit recorded. Every heart traced.
          </p>
        </div>

        {/* Aggregate Stats */}
        <LedgerStats
          totalTrees={trees.length}
          speciesCount={speciesList.length}
          nationsCount={nationsList.length}
          totalVisits={totalVisits}
          uniqueMappers={uniqueMappers}
          heartsGenerated={totalHearts}
          windfallsTriggered={windfallsTriggered}
          loading={loading}
        />

        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "explorer" | "spiral")}>
          <TabsList className="mx-auto w-fit">
            <TabsTrigger value="explorer" className="gap-1.5">
              <TableProperties className="w-4 h-4" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="spiral" className="gap-1.5">
              <Circle className="w-4 h-4" />
              Spiral of Species
            </TabsTrigger>
          </TabsList>

          {/* Explorer Table Mode */}
          <TabsContent value="explorer" className="mt-6">
            <ExplorerTable
              trees={trees}
              visitCounts={visitCounts}
              heartCounts={heartCounts}
              lastVisitDates={lastVisitDates}
              loading={loading}
              speciesList={speciesList}
              nationsList={nationsList}
              currentUserId={currentUserId}
            />
          </TabsContent>

          {/* Spiral Mode */}
          <TabsContent value="spiral" className="mt-6">
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground font-serif">
                Each node is a species. Size = tree count. Brightness = visit ratio.
                Click to expand tree strings.
              </p>
            </div>
            <SpeciesSpiral
              speciesNodes={speciesNodes}
              treesMap={treesMap}
              onTreeClick={(tree) => navigate(`/tree/${tree.id}`)}
            />
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Visited
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block opacity-50" /> Mapped only
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "hsl(42 80% 55%)" }} /> Minted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 rounded-full border border-dashed inline-block" style={{ borderColor: "hsl(330 70% 60% / 0.4)" }} /> Bloom
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "hsl(42 80% 55%)" }} /> Council
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TreeLedgerPage;
