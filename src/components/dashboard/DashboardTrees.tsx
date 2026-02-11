import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TreeDeciduous, Upload, Download, Loader2, ImagePlus, MapPin, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoImport from "@/components/PhotoImport";
import { supabase } from "@/integrations/supabase/client";
import { convertToCoordinates } from "@/utils/what3words";
import { useToast } from "@/hooks/use-toast";
import { extractExifDate } from "@/utils/exifDate";

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
  const [photoStatus, setPhotoStatus] = useState("");
  const [addedTree, setAddedTree] = useState<{ id: string; name: string } | null>(null);
  const dragCounter = useRef(0);

  const handlePhotoDrop = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please drop an image file", variant: "destructive" });
      return;
    }
    setExtractingPhoto(true);
    setAddedTree(null);
    setPhotoStatus("Reading image…");
    try {
      // Check auth first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in to add trees", variant: "destructive" });
        return;
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract EXIF date
      const exifDate = await extractExifDate(file);

      // Step 1: Extract what3words
      setPhotoStatus("Extracting what3words…");
      const { data, error } = await supabase.functions.invoke('extract-what3words-from-image', { body: { imageData: base64 } });
      if (error) throw error;
      if (!data.success) {
        toast({ title: "No address found", description: data.error || "Could not find a what3words address", variant: "destructive" });
        return;
      }
      const w3w = data.what3words;
      toast({ title: "Address detected!", description: `///${w3w}` });

      // Step 2: Convert to coordinates
      setPhotoStatus("Resolving coordinates…");
      let coords: { lat: number; lng: number } | null = null;
      try {
        const result = await convertToCoordinates(w3w);
        if (result?.coordinates) coords = result.coordinates;
      } catch {}

      // Step 3: Auto-create the tree
      setPhotoStatus("Planting Ancient Friend…");
      const treeName = w3w; // Use w3w as default name; user can edit later
      const { data: treeData, error: treeError } = await supabase.from('trees').insert({
        name: treeName,
        species: 'Unknown',
        what3words: w3w,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        created_by: user.id,
        ...(exifDate ? { created_at: exifDate } : {}),
      }).select('id').single();
      if (treeError) throw treeError;

      // Step 4: Upload photo and create offering
      setPhotoStatus("Adding photo offering…");
      const blob = await file.arrayBuffer();
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `${user.id}/${treeData.id}/photo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('offerings')
        .upload(storagePath, new Uint8Array(blob), { contentType: file.type });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Tree was created, just skip the offering
        toast({ title: "Tree added, but photo upload failed", description: uploadError.message, variant: "destructive" });
      } else {
        const { data: urlData } = supabase.storage.from('offerings').getPublicUrl(storagePath);
        await supabase.from('offerings').insert({
          tree_id: treeData.id,
          type: 'photo',
          title: 'First encounter',
          media_url: urlData.publicUrl,
          created_by: user.id,
          ...(exifDate ? { created_at: exifDate } : {}),
        });
      }

      setAddedTree({ id: treeData.id, name: treeName });
      setPhotoStatus("");
      toast({ title: "Ancient Friend planted! 🌳", description: `${w3w} — with photo offering` });
    } catch (err) {
      console.error('Photo drop error:', err);
      toast({ title: "Failed", description: "Could not process the photo", variant: "destructive" });
      setPhotoStatus("");
    } finally {
      setExtractingPhoto(false);
    }
  }, [toast]);

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
            <span className="text-xs font-serif text-muted-foreground">{photoStatus || 'Processing…'}</span>
          </div>
        ) : addedTree ? (
          <div className="flex flex-col items-center gap-3">
            <TreeDeciduous className="h-6 w-6" style={{ color: 'hsl(120, 50%, 50%)' }} />
            <span className="text-xs font-serif" style={{ color: 'hsl(42, 80%, 60%)' }}>
              🌳 {addedTree.name} — planted with photo
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-serif gap-1.5 h-7"
                onClick={(e) => { e.stopPropagation(); navigate(`/tree/${addedTree.id}`); }}
              >
                <Eye className="h-3 w-3" /> View in Gallery
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-serif gap-1.5 h-7"
                onClick={(e) => { e.stopPropagation(); navigate(`/map?focus=${addedTree.id}`); }}
              >
                <MapPin className="h-3 w-3" /> View on Map
              </Button>
            </div>
            <button
              className="text-[10px] text-muted-foreground/60 font-serif underline"
              onClick={(e) => { e.stopPropagation(); setAddedTree(null); }}
            >
              Drop another photo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6" style={{ color: isDragging ? 'hsl(42, 80%, 55%)' : 'hsl(0, 0%, 40%)' }} />
            <span className="text-xs font-serif" style={{ color: isDragging ? 'hsl(42, 80%, 60%)' : 'hsl(0, 0%, 50%)' }}>
              {isDragging ? 'Drop your what3words photo here' : 'Drop a what3words photo to auto-add an Ancient Friend'}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-serif">extracts location · adds tree · saves photo as first offering</span>
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
