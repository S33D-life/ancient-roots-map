import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MapPin, TreeDeciduous, Heart, Sparkles, Mountain, Shield, Leaf,
  ChevronDown, ChevronRight, ArrowLeft, Wind, Snowflake, Sun, BookOpen,
  Crown, Compass, Clock, Eye,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";

/* ═══ Inline floating needle animation ═══ */
const FloatingNeedle = ({ delay, left }: { delay: number; left: string }) => (
  <motion.div
    className="absolute text-amber-400/30 pointer-events-none select-none text-xs"
    style={{ left, top: -10 }}
    initial={{ y: -10, x: 0, opacity: 0, rotate: 0 }}
    animate={{ y: "110vh", x: [0, 12, -8, 6], opacity: [0, 0.4, 0.3, 0], rotate: 360 }}
    transition={{ duration: 12, delay, repeat: Infinity, ease: "linear" }}
  >
    🍂
  </motion.div>
);

/* ═══ Ring diagram (stylised growth rings) ═══ */
const GrowthRingDiagram = () => (
  <div className="relative w-40 h-40 mx-auto">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full border"
        style={{
          inset: `${i * 9}px`,
          borderColor: `hsl(42 ${60 + i * 4}% ${35 + i * 5}% / ${0.15 + i * 0.05})`,
          borderWidth: i === 0 ? 2 : 1,
        }}
      />
    ))}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-serif font-bold text-primary">~800</p>
        <p className="text-[10px] text-muted-foreground">rings</p>
      </div>
    </div>
    {/* Decade markers */}
    {[1226, 1400, 1600, 1800].map((yr, i) => (
      <span
        key={yr}
        className="absolute text-[8px] text-muted-foreground/60"
        style={{ top: `${15 + i * 20}%`, right: -28 }}
      >
        {yr}
      </span>
    ))}
  </div>
);

/* ═══ Climate placeholder chart ═══ */
const ClimateModule = () => (
  <Card className="border-sky-500/20 bg-gradient-to-br from-sky-900/5 to-card/60">
    <CardContent className="p-5 space-y-3">
      <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
        <Snowflake className="w-4 h-4 text-sky-400" /> Witness of Change
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Over 800 years, the King has witnessed alpine climate shifts firsthand — retreating glaciers,
        shifting snowlines, and evolving bloom calendars. This module will integrate live data as
        climate monitoring partnerships develop.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Snowline Shift", value: "↑ ~200m", icon: Snowflake, color: "text-sky-400" },
          { label: "Temp Rise (est.)", value: "+1.5°C", icon: Sun, color: "text-amber-400" },
          { label: "Bloom Shift", value: "~2 weeks earlier", icon: Leaf, color: "text-emerald-400" },
          { label: "Future Rings", value: "Projected", icon: Clock, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <s.icon className={`w-3.5 h-3.5 shrink-0 ${s.color}`} />
            <div>
              <p className="text-foreground font-medium">{s.value}</p>
              <p className="text-muted-foreground text-[10px]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <Badge variant="outline" className="text-[10px] border-sky-500/20 text-sky-300">
        🧪 Placeholder — Climate API integration pending
      </Badge>
    </CardContent>
  </Card>
);

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
const KingOfBavleuxPage = () => {
  const navigate = useNavigate();
  const [loreOpen, setLoreOpen] = useState(false);
  const [ecologyOpen, setEcologyOpen] = useState(false);

  const mapUrl = "/map?lat=46.114&lng=7.508&zoom=15&country=switzerland&origin=atlas";

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden">
          {/* Alpine sky gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-sky-800/15 to-transparent pointer-events-none" />
          {/* Gold ensō ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-primary/10 pointer-events-none animate-pulse-glow opacity-40" />
          {/* Mountain silhouette */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 opacity-[0.06] pointer-events-none"
            style={{
              background:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 120 L150 50 L300 80 L450 25 L600 60 L750 15 L900 55 L1050 35 L1200 70 L1200 120Z' fill='white'/%3E%3C/svg%3E\") no-repeat center bottom / cover",
            }}
          />
          {/* Floating needles */}
          <FloatingNeedle delay={0} left="15%" />
          <FloatingNeedle delay={3} left="45%" />
          <FloatingNeedle delay={6} left="72%" />
          <FloatingNeedle delay={9} left="88%" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative px-4 pt-12 pb-10 max-w-2xl mx-auto text-center"
          >
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-6">
              <Link to="/atlas/switzerland" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 🇨🇭 Switzerland
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/atlas/switzerland/valais" className="hover:text-primary transition-colors">
                Valais
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">King of Bavleux</span>
            </div>

            {/* Larch Hive sigil */}
            <Badge className="mb-3 bg-amber-500/15 text-amber-300 border-amber-500/25 text-[10px]">
              <Crown className="w-3 h-3 mr-1" /> Monarch of the Larch Belt
            </Badge>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-1">
              The King of Bavleux
            </h1>
            <p className="text-sm text-muted-foreground italic mb-2">
              European Larch · <em>Larix decidua</em>
            </p>

            {/* Elevation badge */}
            <Badge variant="outline" className="text-xs border-sky-400/25 text-sky-300 mb-5">
              <Mountain className="w-3 h-3 mr-1" /> 1,600m — Subalpine Elder
            </Badge>

            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              For eight centuries this larch has presided over the Val d'Hérens near Evolène,
              enduring alpine winters, glacier retreats, and the slow turning of millennia.
              The King of Bavleux is the anchor elder of the Valais Larch Hive.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate(mapUrl)}>
                <TreeDeciduous className="w-4 h-4 mr-1" /> Mint Ancient Friend
              </Button>
              <Button variant="sacred" asChild>
                <Link to="/library">
                  <Leaf className="w-4 h-4 mr-1" /> Leave Offering
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/whispers">
                  <Wind className="w-4 h-4 mr-1" /> Leave Whisper
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/time-tree">
                  <Sparkles className="w-4 h-4 mr-1" /> Enter Time Tree
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ QUICK STATS ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Estimated Age", value: "~800 yrs", icon: Clock, color: "hsl(42 85% 55%)" },
              { label: "Elevation", value: "1,600m", icon: Mountain, color: "hsl(200 60% 50%)" },
              { label: "Hive", value: "Larch", icon: Compass, color: "hsl(42 85% 55%)" },
              { label: "Alpine Zone", value: "Subalpine", icon: TreeDeciduous, color: "hsl(150 40% 35%)" },
            ].map(s => (
              <Card key={s.label} className="border-primary/10 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg" style={{ background: `${s.color}15` }}>
                    <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-serif font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ LORE SCROLL ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <Collapsible open={loreOpen} onOpenChange={setLoreOpen}>
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-900/5 to-card/70">
              <CollapsibleTrigger asChild>
                <CardContent className="p-5 cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <div>
                      <h2 className="text-sm font-serif font-bold text-foreground">The Wind Crowned Monarch</h2>
                      <p className="text-[10px] text-muted-foreground">Lore of the King — tap to read</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${loreOpen ? "rotate-180" : ""}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 border-t border-amber-500/10 pt-4">
                  <div className="prose prose-sm max-w-none">
                    <blockquote className="text-sm text-foreground/90 leading-relaxed italic border-l-2 border-amber-500/30 pl-4 space-y-3">
                      <p>For eight centuries this larch has stood between stone and sky.</p>
                      <p>Seasons have gilded his needles gold and returned them to earth in patient cycles.</p>
                      <p>Snow has bent his branches; sun has tempered his grain.</p>
                      <p>The King of Bavleux does not rule by force — but by endurance.</p>
                      <p>Each ring a winter survived.</p>
                      <p>Each spring a quiet uprising of green.</p>
                    </blockquote>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline" className="text-[10px] border-amber-500/15 text-muted-foreground">
                      🎙 Audio narration — coming soon
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-amber-500/15 text-muted-foreground">
                      🎧 Field recording — placeholder
                    </Badge>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </section>

        {/* ═══ GROWTH RING DIAGRAM ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <Card className="border-primary/10 bg-card/60">
            <CardContent className="p-5 flex flex-col md:flex-row items-center gap-6">
              <GrowthRingDiagram />
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-serif font-bold text-foreground">Eight Centuries of Growth</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Each concentric ring represents a year survived in the harsh subalpine zone.
                  The King's rings record drought years, severe winters, volcanic cooling events,
                  and the subtle warming of the modern era.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══ ECOLOGICAL PROFILE ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <Collapsible open={ecologyOpen} onOpenChange={setEcologyOpen}>
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-900/5 to-card/70">
              <CollapsibleTrigger asChild>
                <CardContent className="p-5 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-serif font-bold text-foreground">Ecological Profile</h2>
                      <p className="text-[10px] text-muted-foreground">Adaptation · Mycorrhiza · Climate sensitivity</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${ecologyOpen ? "rotate-180" : ""}`} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 border-t border-emerald-500/10 pt-4 space-y-3">
                  {[
                    { title: "Root Depth Adaptation", text: "Deep taproot system anchored in rocky alpine soils, stabilising steep Val d'Hérens slopes against erosion." },
                    { title: "Deciduous Conifer", text: "Unlike most conifers, the European Larch sheds its needles in autumn — a golden spectacle before winter dormancy." },
                    { title: "Slope Stabilisation", text: "The King's root network helps secure the mountainside, reducing avalanche and rockfall risk for settlements below." },
                    { title: "Mycorrhizal Networks", text: "Symbiotic fungi extend the root reach by orders of magnitude, connecting to neighbouring larches in an underground communication web." },
                    { title: "Climate Sensitivity", text: "Larch growth rings are highly responsive to summer temperature — making them invaluable for dendrochronological climate reconstruction." },
                  ].map(e => (
                    <div key={e.title}>
                      <p className="text-xs font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{e.text}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </section>

        {/* ═══ CLIMATE MODULE ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <ClimateModule />
        </section>

        {/* ═══ MINT METADATA PREVIEW ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card/60">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> NFTree Mint Preview
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                {[
                  ["Tree Name", "King of Bavleux"],
                  ["Species", "Larix decidua"],
                  ["Elevation", "~1,600m"],
                  ["Age Estimate", "~800 years"],
                  ["Canton", "Valais (Wallis)"],
                  ["Alpine Zone", "Subalpine"],
                  ["Hive", "Larch Hive"],
                  ["Glacier Proximity", "Medium"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-border/20">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Minting produces: Personal NFT · Library copy · Gift copy (12h transfer window)
              </p>
              <Button variant="mystical" className="w-full" onClick={() => navigate(mapUrl)}>
                <TreeDeciduous className="w-4 h-4 mr-1" /> Begin Mint Ceremony
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* ═══ TIME TREE PROMPT ═══ */}
        <section className="px-4 max-w-2xl mx-auto mb-8">
          <Card className="border-primary/15 bg-card/60">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Time Tree — Valais Edition
              </h3>
              <blockquote className="text-sm text-foreground/80 italic border-l-2 border-primary/30 pl-3 leading-relaxed">
                If you could sit beneath this wind-tempered monarch with any two companions —
                what wisdom would you share at 1,600 metres above the valley floor?
              </blockquote>
              <div className="flex gap-2">
                <Button variant="sacred" size="sm" asChild>
                  <Link to="/time-tree">
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> New Moon Entry
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/time-tree">
                    <Eye className="w-3.5 h-3.5 mr-1" /> Full Moon Entry
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══ NAVIGATION LINKS ═══ */}
        <section className="px-4 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Valais Portal", to: "/atlas/switzerland/valais", icon: MapPin },
              { label: "Larch Hive", to: "/hive/larch", icon: Compass },
              { label: "View on Map", to: mapUrl, icon: Shield },
              { label: "Switzerland Atlas", to: "/atlas/switzerland", icon: Mountain },
            ].map(l => (
              <Button key={l.label} variant="outline" className="h-auto py-3 flex-col gap-1" asChild>
                <Link to={l.to}>
                  <l.icon className="w-4 h-4" />
                  <span className="text-xs">{l.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default KingOfBavleuxPage;
