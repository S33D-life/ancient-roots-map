import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TreeDeciduous, Upload, Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoImport from "@/components/PhotoImport";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  created_at: string;
}

interface DashboardTreesProps {
  trees: Tree[];
  isImporting: boolean;
  isExporting: boolean;
  importProgress: { current: number; total: number; startTime: number };
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

const DashboardTrees = ({ trees, isImporting, isExporting, importProgress, onImport, onExport }: DashboardTreesProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Import/Export bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur">
        <PhotoImport />
        <div className="relative">
          <input type="file" accept=".csv" onChange={onImport} className="hidden" id="csv-upload-dash" disabled={isImporting} />
          <label htmlFor="csv-upload-dash">
            <Button variant="secondary" size="sm" disabled={isImporting} className="cursor-pointer font-serif text-xs" asChild>
              <span>
                {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Import CSV
              </span>
            </Button>
          </label>
        </div>
        <Button variant="secondary" size="sm" onClick={onExport} disabled={isExporting} className="font-serif text-xs">
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Export My Trees
        </Button>

        <div className="ml-auto">
          <Button variant="sacred" size="sm" onClick={() => navigate("/map")} className="font-serif text-xs">
            + Add Tree
          </Button>
        </div>
      </div>

      {/* Import progress */}
      {isImporting && importProgress.total > 0 && (
        <div className="p-4 border border-border/50 rounded-xl bg-card/40 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground">Converting: {importProgress.current} / {importProgress.total}</span>
            <span className="text-muted-foreground">
              {(() => {
                const elapsed = (Date.now() - importProgress.startTime) / 1000;
                const rate = importProgress.current / elapsed;
                const remaining = (importProgress.total - importProgress.current) / rate;
                const min = Math.floor(remaining / 60);
                const sec = Math.floor(remaining % 60);
                return isFinite(remaining) && remaining > 0 ? `~${min}m ${sec}s left` : "Calculating...";
              })()}
            </span>
          </div>
          <Progress value={(importProgress.current / importProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Tree grid */}
      {trees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-primary/30 p-12 text-center" style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.06), transparent 70%)" }}>
          <TreeDeciduous className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-serif mb-3">No trees logged yet</p>
          <Button variant="sacred" size="sm" onClick={() => navigate("/map")} className="font-serif text-xs">
            Arrive on the Atlas
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trees.map((tree) => (
            <Card
              key={tree.id}
              className="border-border/50 bg-card/40 backdrop-blur hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/tree/${tree.id}`)}
            >
              <CardContent className="p-4">
                <h3 className="font-serif text-sm text-primary group-hover:text-mystical transition-colors mb-1">{tree.name}</h3>
                <p className="text-xs text-muted-foreground italic">{tree.species}</p>
                {tree.what3words && <p className="text-xs text-muted-foreground mt-1">📍 {tree.what3words}</p>}
                <p className="text-[10px] text-muted-foreground mt-2">
                  Added {new Date(tree.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardTrees;
