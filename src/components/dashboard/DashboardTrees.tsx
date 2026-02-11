import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TreeDeciduous, Upload, Download, Loader2, ImagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoImport from "@/components/PhotoImport";
import { supabase } from "@/integrations/supabase/client";
import { convertToCoordinates } from "@/utils/what3words";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [extractingPhoto, setExtractingPhoto] = useState(false);
  const dragCounter = useRef(0);

  const handlePhotoDrop = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please drop an image file", variant: "destructive" });
      return;
    }
    setExtractingPhoto(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      toast({ title: "Analyzing image…", description: "Extracting what3words address" });
      const { data, error } = await supabase.functions.invoke('extract-what3words-from-image', { body: { imageData: base64 } });
      if (error) throw error;
      if (!data.success) {
        toast({ title: "No address found", description: data.error || "Could not find a what3words address", variant: "destructive" });
        return;
      }
      const w3w = data.what3words;
      toast({ title: "Address detected!", description: `///${w3w}` });
      // Store for the add-tree form and navigate to map
      let coords: { lat: number; lng: number } | null = null;
      try {
        const result = await convertToCoordinates(w3w);
        if (result?.coordinates) coords = result.coordinates;
      } catch {}
      localStorage.setItem('pendingTreeData', JSON.stringify({
        what3words: w3w,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        photoData: base64,
      }));
      toast({ title: "Tree data ready 🌳", description: "Opening the Atlas to add your Ancient Friend" });
      navigate("/map?addTree=true");
    } catch (err) {
      console.error('Photo drop error:', err);
      toast({ title: "Extraction failed", description: "Could not process the image", variant: "destructive" });
    } finally {
      setExtractingPhoto(false);
    }
  }, [toast, navigate]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoDrop(file);
  }, [handlePhotoDrop]);

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

      {/* What3words photo drop zone */}
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
          isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-border/40 hover:border-border/70'
        }`}
        style={{
          background: isDragging ? 'hsla(42, 80%, 50%, 0.06)' : 'hsla(0, 0%, 100%, 0.01)',
        }}
        onClick={() => {
          if (!extractingPhoto) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handlePhotoDrop(file);
            };
            input.click();
          }
        }}
      >
        {extractingPhoto ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(42, 80%, 55%)' }} />
            <span className="text-xs font-serif text-muted-foreground">Extracting what3words from photo…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6" style={{ color: isDragging ? 'hsl(42, 80%, 55%)' : 'hsl(0, 0%, 40%)' }} />
            <span className="text-xs font-serif" style={{ color: isDragging ? 'hsl(42, 80%, 60%)' : 'hsl(0, 0%, 50%)' }}>
              {isDragging ? 'Drop your what3words photo here' : 'Drag a what3words photo here to add an Ancient Friend'}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-serif">or tap to browse</span>
          </div>
        )}
      </div>

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
