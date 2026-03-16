/**
 * CandidateAtlasPage — Placeholder atlas page for candidate expansion regions.
 * Shows portal framing, circles, readiness notes, and source placeholders.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getDatasetConfig } from "@/config/datasetIntegration";
import { TreeDeciduous, Compass, Telescope, BookOpen, MapPin, Layers } from "lucide-react";

interface Props {
  datasetKey: string;
  readinessNotes: string;
}

const CandidateAtlasPage = ({ datasetKey, readinessNotes }: Props) => {
  const config = getDatasetConfig(datasetKey);
  useDocumentTitle(config?.portalTitle ?? "Candidate Region");

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8 text-muted-foreground">Dataset config not found: {datasetKey}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-3">
          <p className="text-4xl">{config.flag}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {config.portalTitle}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {config.portalSubtitle}
          </p>
          <Badge variant="outline" className="mt-2 border-amber-500/40 text-amber-400">
            Candidate Region — Seed Data Not Yet Added
          </Badge>
        </section>

        {/* Status */}
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              Region Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Phase</span>
                <p className="font-medium text-foreground">Config Scaffolded</p>
              </div>
              <div>
                <span className="text-muted-foreground">Descriptor</span>
                <p className="font-medium text-foreground">{config.descriptor}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data Format</span>
                <p className="font-medium text-foreground capitalize">{config.dataFormat.replace(/_/g, " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Source Org</span>
                <p className="font-medium text-foreground">{config.sourceOrg}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Readiness Notes */}
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Readiness Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{readinessNotes}</p>
            {config.provenanceText && (
              <p className="text-sm text-muted-foreground mt-2 italic">{config.provenanceText}</p>
            )}
          </CardContent>
        </Card>

        {/* Circles */}
        <Card className="bg-card/60 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Suggested Circles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {config.circles.map((c) => (
                <div key={c.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.refPrefix}-*</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Sources */}
        {config.keySources && config.keySources.length > 0 && (
          <Card className="bg-card/60 border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Telescope className="w-4 h-4 text-primary" />
                Source Placeholders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.keySources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  {s.label} ↗
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Seed Data Placeholder */}
        <Card className="bg-card/60 border-amber-500/20">
          <CardContent className="py-8 text-center space-y-3">
            <TreeDeciduous className="w-8 h-8 text-amber-500/60 mx-auto" />
            <p className="text-muted-foreground text-sm">
              Seed data has not yet been added for this region.
            </p>
            <p className="text-muted-foreground text-xs">
              This atlas page will populate once a starter seed set is curated and reviewed.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/atlas-expansion">
            <Button variant="outline" size="sm" className="gap-1">
              <MapPin className="w-3.5 h-3.5" /> Expansion Map
            </Button>
          </Link>
          <Link to="/discovery-agent">
            <Button variant="outline" size="sm" className="gap-1">
              <Telescope className="w-3.5 h-3.5" /> Discovery Agent
            </Button>
          </Link>
          <Link to="/tree-data-commons">
            <Button variant="outline" size="sm" className="gap-1">
              <Layers className="w-3.5 h-3.5" /> Tree Data Commons
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CandidateAtlasPage;
