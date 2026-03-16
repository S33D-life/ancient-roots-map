/**
 * PulseExplorerPage — Forest Pulse Explorer showing living activity across the ecosystem.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useForestPulse, type PulseTimeRange } from "@/hooks/use-forest-pulse";
import { PULSE_LABELS, PULSE_COLORS, type PulseSignal, type PulseLevel } from "@/utils/forestPulse";
import { Activity, TreeDeciduous, Leaf, Globe, MapPin, ChevronRight } from "lucide-react";

const TIME_RANGES: { value: PulseTimeRange; label: string }[] = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "seasonal", label: "Seasonal" },
];

function PulseCard({ signal, index }: { signal: PulseSignal; index: number }) {
  const typeIcon = {
    tree: "🌳",
    grove: "🌿",
    species: "🍃",
    region: "🌍",
  }[signal.type];

  const typeLabel = {
    tree: "Tree",
    grove: "Grove",
    species: "Species",
    region: "Region",
  }[signal.type];

  const activeSignals = signal.signals.filter(s => s.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card className="border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-all group">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{typeIcon}</span>
              <div className="min-w-0">
                <p className="text-sm font-serif text-foreground truncate">{signal.name}</p>
                <p className="text-[10px] text-muted-foreground">{typeLabel}</p>
              </div>
            </div>
            <Badge variant="outline" className={`text-[9px] shrink-0 ${PULSE_COLORS[signal.pulse]}`}>
              {PULSE_LABELS[signal.pulse]}
            </Badge>
          </div>

          {signal.story && (
            <p className="text-[11px] text-muted-foreground italic font-serif">{signal.story}</p>
          )}

          {activeSignals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeSignals.map((s, i) => (
                <span key={i} className="text-[10px] text-muted-foreground/80 bg-muted/30 px-1.5 py-0.5 rounded">
                  {s.icon} {s.value} {s.label.toLowerCase()}
                </span>
              ))}
            </div>
          )}

          {signal.lat && signal.lng && (
            <Link
              to={`/map?lat=${signal.lat}&lng=${signal.lng}&zoom=14`}
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 mt-1"
            >
              <MapPin className="w-3 h-3" /> View on map <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PulseExplorerPage() {
  useDocumentTitle("Forest Pulse — Living Ecosystem Activity");
  const [range, setRange] = useState<PulseTimeRange>("7d");
  const { data, isLoading } = useForestPulse(range);

  const allSignals = data?.all || [];
  const treePulses = data?.trees || [];
  const grovePulses = data?.groves || [];
  const speciesPulses = data?.species || [];
  const regionPulses = data?.regions || [];

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-[var(--content-top)] pb-24 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
            <Activity className="w-6 h-6" /> Forest Pulse
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            The living heartbeat of the forest. Activity signals rising from trees, groves,
            species clusters, and regions across the Ancient Friends network.
          </p>
        </motion.div>

        {/* Time range selector */}
        <div className="flex gap-1.5 flex-wrap">
          {TIME_RANGES.map(r => (
            <Button
              key={r.value}
              size="sm"
              variant={range === r.value ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>

        {/* Summary stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: "🌳", label: "Active Trees", count: treePulses.length },
              { icon: "🌿", label: "Active Groves", count: grovePulses.length },
              { icon: "🍃", label: "Species Stirring", count: speciesPulses.length },
              { icon: "🌍", label: "Regions Awake", count: regionPulses.length },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl border border-border/20 bg-card/30 text-center"
              >
                <span className="text-lg">{stat.icon}</span>
                <p className="text-lg font-bold font-serif text-foreground">{stat.count}</p>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground font-serif italic">
              Listening to the forest…
            </p>
          </div>
        )}

        {/* Tabbed explorer */}
        {data && (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full max-w-lg">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="trees" className="text-xs">Trees</TabsTrigger>
              <TabsTrigger value="groves" className="text-xs">Groves</TabsTrigger>
              <TabsTrigger value="species" className="text-xs">Species</TabsTrigger>
              <TabsTrigger value="regions" className="text-xs">Regions</TabsTrigger>
            </TabsList>

            {[
              { key: "all", items: allSignals.slice(0, 30) },
              { key: "trees", items: treePulses.slice(0, 20) },
              { key: "groves", items: grovePulses.slice(0, 20) },
              { key: "species", items: speciesPulses.slice(0, 20) },
              { key: "regions", items: regionPulses.slice(0, 20) },
            ].map(({ key, items }) => (
              <TabsContent key={key} value={key}>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 italic font-serif">
                    The forest rests in stillness.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.map((signal, i) => (
                      <PulseCard key={signal.id} signal={signal} index={i} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </>
  );
}
