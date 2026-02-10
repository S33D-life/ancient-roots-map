import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Loader2 } from "lucide-react";
import { getMintingStatus } from "@/utils/staffNftReader";
import { isContractConfigured } from "@/utils/staffRoomData";
import {
  getContractBaseScanUrl,
  CIRCLES,
} from "@/config/staffContract";

const TOTAL_SUPPLY = 144;
const ORIGIN_COUNT = 36;

interface MintStatus {
  originMinted: boolean;
  circlesMinted: number;
  totalMinted: number;
  remaining: number;
}

const MintingStatusDashboard = () => {
  const [status, setStatus] = useState<MintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isContractConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    getMintingStatus()
      .then((s) => setStatus(s as MintStatus | null))
      .finally(() => setLoading(false));
  }, [configured]);

  // Demo data when contract isn't deployed yet
  const display = status || {
    originMinted: true,
    circlesMinted: 0,
    totalMinted: 36,
    remaining: 108,
  };

  const mintedPercent = (display.totalMinted / TOTAL_SUPPLY) * 100;
  const originPercent = display.originMinted ? 100 : 0;
  const circlePercent = display.circlesMinted > 0
    ? (display.circlesMinted / (TOTAL_SUPPLY - ORIGIN_COUNT)) * 100
    : 0;

  // Build circle summary from contract config
  const circleGroups = CIRCLES.filter((c) => c.id > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-primary tracking-wide">Minting Progress</h3>
        <div className="flex items-center gap-2">
          {!configured && (
            <Badge variant="outline" className="text-[10px] bg-muted/50">
              Preview Mode
            </Badge>
          )}
          {configured && (
            <a
              href={getContractBaseScanUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              View Contract <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
          {/* Overall progress */}
          <Card className="border-mystical bg-card/50 backdrop-blur overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-serif font-bold text-foreground">
                    {display.totalMinted}
                    <span className="text-base text-muted-foreground font-normal"> / {TOTAL_SUPPLY}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Staffs minted</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-serif text-primary">{display.remaining}</p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
              </div>
              <Progress value={mintedPercent} className="h-3" />
              <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                {mintedPercent.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          {/* Origin Spiral + Circles breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Origin Spiral */}
            <Card className="border-mystical bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-serif text-foreground">Origin Spiral</p>
                  <Badge
                    variant={display.originMinted ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {display.originMinted ? "Complete" : "In Progress"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  36 unique species — one staff per species
                </p>
                <Progress value={originPercent} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {display.originMinted ? "36" : "?"} / 36 minted
                </p>
              </CardContent>
            </Card>

            {/* Circle Staffs */}
            <Card className="border-mystical bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-serif text-foreground">Circle Staffs</p>
                  <Badge variant="outline" className="text-[10px]">
                    {display.circlesMinted} / {TOTAL_SUPPLY - ORIGIN_COUNT}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  9 circles across 5 species
                </p>
                <Progress value={circlePercent} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {circlePercent.toFixed(0)}% complete
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Circle breakdown */}
          <Card className="border-mystical bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <p className="text-sm font-serif text-foreground mb-3">Circle Breakdown</p>
              <div className="space-y-2">
                {circleGroups.map((circle) => (
                  <div key={circle.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{circle.name}</span>
                    <span className="font-mono text-foreground/80">
                      {circle.count} staffs
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MintingStatusDashboard;
