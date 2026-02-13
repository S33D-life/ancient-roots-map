import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TreeDeciduous, Upload, Download, Loader2, ImagePlus, MapPin, Eye, Pencil, Check, Search, X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoImport from "@/components/PhotoImport";
import { supabase } from "@/integrations/supabase/client";
import { convertToCoordinates } from "@/utils/what3words";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { extractExifDate } from "@/utils/exifDate";
import { issueRewards, type RewardResult } from "@/utils/issueRewards";
import RewardReceipt from "@/components/RewardReceipt";

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

interface QueueItem {
  file: File;
  preview: string;
  status: 'pending' | 'extracting' | 'ready' | 'saving' | 'done' | 'error';
  what3words?: string;
  latitude?: number | null;
  longitude?: number | null;
  exifDate?: string | null;
  species: string;
  notes: string;
  error?: string;
  treeId?: string;
}

const DashboardTrees = ({ trees, isImporting, isExporting, importProgress, onImport, onExport }: DashboardTreesProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [mappingReward, setMappingReward] = useState<RewardResult | null>(null);
  const [showMappingReceipt, setShowMappingReceipt] = useState(false);

  // Multi-photo queue state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);

  // Review mode states
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewSpeciesInput, setReviewSpeciesInput] = useState("");
  const [reviewNameInput, setReviewNameInput] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewIdentified, setReviewIdentified] = useState<Set<string>>(new Set());

  const updateQueueItem = useCallback((index: number, updates: Partial<QueueItem>) => {
    setQueue(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  }, []);

  // Process a single file: extract w3w + coords
  const extractFromFile = useCallback(async (file: File, index: number) => {
    updateQueueItem(index, { status: 'extracting' });
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const exifDate = await extractExifDate(file);

      const { data, error } = await supabase.functions.invoke('extract-what3words-from-image', {
        body: { imageData: base64 }
      });
      if (error) throw error;
      if (!data.success) {
        updateQueueItem(index, { status: 'error', error: data.error || 'No what3words found' });
        return;
      }

      const w3w = data.what3words;
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const result = await convertToCoordinates(w3w);
        if (result?.coordinates) { lat = result.coordinates.lat; lng = result.coordinates.lng; }
      } catch {}

      updateQueueItem(index, {
        status: 'ready',
        what3words: w3w,
        latitude: lat,
        longitude: lng,
        exifDate: exifDate ?? null,
      });
    } catch (err) {
      console.error('Extraction error:', err);
      updateQueueItem(index, { status: 'error', error: 'Failed to process image' });
    }
  }, [updateQueueItem]);

  // Start extraction for all queued files sequentially
  const processQueue = useCallback(async (items: QueueItem[]) => {
    setIsExtracting(true);
    for (let i = 0; i < items.length; i++) {
      await extractFromFile(items[i].file, i);
    }
    setIsExtracting(false);
    setCurrentIndex(0);
  }, [extractFromFile]);

  // Handle multi-file drop
  const handleMultiPhotoDrop = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({ title: "No images", description: "Please drop image files", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not signed in", description: "Please sign in to add trees", variant: "destructive" });
      return;
    }

    const newItems: QueueItem[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      species: '',
      notes: '',
    }));

    setQueue(newItems);
    setCurrentIndex(0);

    toast({ title: `Processing ${imageFiles.length} photo${imageFiles.length > 1 ? 's' : ''}…`, description: "Extracting what3words addresses" });
    processQueue(newItems);
  }, [toast, processQueue]);

  // Save the current review item as a tree
  const handleSaveItem = useCallback(async (index: number) => {
    const item = queue[index];
    if (!item || item.status !== 'ready') return;

    updateQueueItem(index, { status: 'saving' });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const treeName = item.species.trim() || item.what3words || 'Unknown';
      const { data: treeData, error: treeError } = await supabase.from('trees').insert({
        name: treeName,
        species: item.species.trim() || 'Unknown',
        what3words: item.what3words || '',
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        created_by: user.id,
        description: item.notes.trim() || null,
        ...(item.exifDate ? { created_at: item.exifDate } : {}),
      }).select('id').single();
      if (treeError) throw treeError;

      // Upload photo
      const blob = await item.file.arrayBuffer();
      const ext = item.file.name.split('.').pop() || 'jpg';
      const storagePath = `${user.id}/${treeData.id}/photo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('offerings')
        .upload(storagePath, new Uint8Array(blob), { contentType: item.file.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('offerings').getPublicUrl(storagePath);
        await supabase.from('offerings').insert({
          tree_id: treeData.id,
          type: 'photo',
          title: 'First encounter',
          media_url: urlData.publicUrl,
          created_by: user.id,
          ...(item.exifDate ? { created_at: item.exifDate } : {}),
        });
      }

      updateQueueItem(index, { status: 'done', treeId: treeData.id });
      toast({ title: "🌳 Planted!", description: `${item.what3words || treeName}` });

      // Issue mapping rewards
      const rr = await issueRewards({ userId: user.id, treeId: treeData.id, treeSpecies: item.species.trim() || 'Unknown', actionType: "mapping" });
      if (rr && (rr.speciesHearts > 0 || rr.influence > 0)) {
        setMappingReward(rr);
        setShowMappingReceipt(true);
      }

      // Auto-advance to next unfinished item
      const nextIndex = queue.findIndex((q, i) => i > index && (q.status === 'ready' || q.status === 'pending' || q.status === 'extracting'));
      if (nextIndex >= 0) {
        setCurrentIndex(nextIndex);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      updateQueueItem(index, { status: 'ready' }); // reset to ready so user can retry
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  }, [queue, updateQueueItem, toast]);

  // Skip current item
  const handleSkip = useCallback(() => {
    const nextIndex = queue.findIndex((q, i) => i > currentIndex && q.status !== 'done' && q.status !== 'error');
    if (nextIndex >= 0) {
      setCurrentIndex(nextIndex);
    }
  }, [queue, currentIndex]);

  // Clear the queue
  const handleClearQueue = useCallback(() => {
    queue.forEach(item => URL.revokeObjectURL(item.preview));
    setQueue([]);
    setCurrentIndex(0);
    // Reload to show new trees
    window.location.reload();
  }, [queue]);

  const doneCount = queue.filter(q => q.status === 'done').length;
  const totalCount = queue.length;
  const currentItem = queue[currentIndex];
  const hasQueue = queue.length > 0;

  // Drag handlers
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleMultiPhotoDrop(files);
  }, [handleMultiPhotoDrop]);

  // Filter unknown trees, excluding ones already identified in this session
  const unknownTrees = trees.filter(t => 
    (!t.species || t.species.toLowerCase() === 'unknown') && !reviewIdentified.has(t.id)
  );

  const currentReviewTree = reviewMode ? unknownTrees[reviewIndex] : null;

  const handleReviewSave = useCallback(async () => {
    if (!currentReviewTree || !reviewSpeciesInput.trim()) return;
    setReviewSaving(true);
    try {
      const newName = reviewNameInput.trim() || reviewSpeciesInput.trim();
      const { error } = await supabase.from('trees').update({
        species: reviewSpeciesInput.trim(),
        name: newName,
      }).eq('id', currentReviewTree.id);
      if (error) throw error;
      toast({ title: "✓ Identified", description: `${newName} — ${reviewSpeciesInput.trim()}` });
      
      // Mark as identified and advance
      setReviewIdentified(prev => new Set(prev).add(currentReviewTree.id));
      setReviewSpeciesInput("");
      setReviewNameInput("");
      // reviewIndex stays the same since the identified tree drops out of unknownTrees
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setReviewSaving(false);
    }
  }, [currentReviewTree, reviewSpeciesInput, reviewNameInput, toast]);

  

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

        <div className="ml-auto flex items-center gap-2">
          {unknownTrees.length > 0 && (
            <Button
              variant={reviewMode ? "mystical" : "outline"}
              size="sm"
              onClick={() => { setReviewMode(!reviewMode); setReviewIndex(0); setReviewSpeciesInput(""); setReviewNameInput(""); setReviewIdentified(new Set()); }}
              className="font-serif text-xs gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              Review
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] font-mono">{unknownTrees.length}</Badge>
            </Button>
          )}
          <Button variant="sacred" size="sm" onClick={() => navigate("/map")} className="font-serif text-xs">
            + Add Tree
          </Button>
        </div>
      </div>

      {/* Review mode banner */}
      {reviewMode && unknownTrees.length > 0 && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-center">
          <p className="text-xs font-serif text-accent">
            🔍 <strong>{reviewIndex + 1}</strong> of <strong>{unknownTrees.length}</strong> to identify
            {reviewIdentified.size > 0 && (
              <span className="ml-2 text-muted-foreground">({reviewIdentified.size} done this session)</span>
            )}
          </p>
        </div>
      )}

      {/* Multi-photo drop zone & review queue */}
      {hasQueue ? (
        <div className="rounded-xl border-2 border-primary/30 bg-card/60 backdrop-blur overflow-hidden">
          {/* Queue progress header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono text-xs">
                {doneCount}/{totalCount} planted
              </Badge>
              {isExtracting && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">
                  <Loader2 className="h-3 w-3 animate-spin" /> Extracting addresses…
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearQueue}
              className="text-xs font-serif gap-1 text-muted-foreground"
            >
              {doneCount === totalCount ? 'Finish & Refresh' : 'Cancel'}
              {doneCount < totalCount && <X className="h-3 w-3" />}
            </Button>
          </div>

          {/* Progress bar */}
          <Progress value={(doneCount / totalCount) * 100} className="h-1 rounded-none" />

          {/* Thumbnail strip */}
          <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-border/20">
            {queue.map((item, i) => (
              <button
                key={i}
                onClick={() => item.status !== 'done' && setCurrentIndex(i)}
                className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIndex ? 'border-primary ring-1 ring-primary/30 scale-105' :
                  item.status === 'done' ? 'border-green-500/50 opacity-60' :
                  item.status === 'error' ? 'border-destructive/50 opacity-60' :
                  'border-border/30 opacity-80 hover:opacity-100'
                }`}
              >
                <img src={item.preview} alt="" className="w-full h-full object-cover" />
                {item.status === 'done' && (
                  <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                {item.status === 'extracting' && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Current item review */}
          {currentItem && (
            <div className="p-4 space-y-4">
              {currentItem.status === 'extracting' || currentItem.status === 'pending' ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm font-serif text-muted-foreground">
                    {currentItem.status === 'pending' ? 'Waiting…' : 'Extracting what3words…'}
                  </span>
                </div>
              ) : currentItem.status === 'error' ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <X className="h-8 w-8 text-destructive/60" />
                  <span className="text-sm font-serif text-muted-foreground">{currentItem.error}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs font-serif" onClick={handleSkip}>
                      <SkipForward className="h-3 w-3 mr-1" /> Skip
                    </Button>
                  </div>
                </div>
              ) : currentItem.status === 'done' ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <TreeDeciduous className="h-8 w-8 text-green-500" />
                  <span className="text-sm font-serif text-muted-foreground">Planted! 🌳</span>
                  <div className="flex gap-2">
                    {currentItem.treeId && (
                      <>
                        <Button variant="outline" size="sm" className="text-xs font-serif gap-1" onClick={() => navigate(`/tree/${currentItem.treeId}`)}>
                          <Eye className="h-3 w-3" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs font-serif gap-1" onClick={() => navigate(`/map?focus=${currentItem.treeId}`)}>
                          <MapPin className="h-3 w-3" /> Map
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Ready state — review form */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Photo preview */}
                  <div className="rounded-lg overflow-hidden border border-border/30 aspect-square">
                    <img src={currentItem.preview} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Form */}
                  <div className="space-y-3">
                    {/* Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif">Location</label>
                      <p className="text-sm font-serif text-primary">
                        📍 {currentItem.what3words || 'Unknown'}
                      </p>
                      {currentItem.latitude && (
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {currentItem.latitude.toFixed(5)}, {currentItem.longitude?.toFixed(5)}
                        </p>
                      )}
                    </div>

                    {/* Species */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif">Species</label>
                      <Input
                        value={currentItem.species}
                        onChange={(e) => updateQueueItem(currentIndex, { species: e.target.value })}
                        placeholder="e.g., English Oak, Yew, Beech…"
                        className="h-8 text-xs font-serif"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif">Notes</label>
                      <Textarea
                        value={currentItem.notes}
                        onChange={(e) => updateQueueItem(currentIndex, { notes: e.target.value })}
                        placeholder="Any observations about this Ancient Friend…"
                        className="text-xs font-serif min-h-[60px] resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="mystical"
                        size="sm"
                        className="flex-1 text-xs font-serif gap-1.5"
                        disabled={currentItem.status === 'saving'}
                        onClick={() => handleSaveItem(currentIndex)}
                      >
                        {currentItem.status === 'saving' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <TreeDeciduous className="h-3 w-3" />
                        )}
                        Plant
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-serif gap-1"
                        onClick={handleSkip}
                      >
                        <SkipForward className="h-3 w-3" /> Skip
                      </Button>
                    </div>

                    {/* Counter */}
                    <p className="text-[10px] text-muted-foreground/60 font-serif text-center">
                      {currentIndex + 1} of {totalCount}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* All done state */}
          {doneCount === totalCount && totalCount > 0 && !isExtracting && (
            <div className="p-4 border-t border-border/20 text-center">
              <p className="text-sm font-serif text-primary mb-2">🌳 All {totalCount} Ancient Friends planted!</p>
              <Button variant="sacred" size="sm" className="text-xs font-serif" onClick={handleClearQueue}>
                Finish & View Trees
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty drop zone */
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
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) handleMultiPhotoDrop(files);
            };
            input.click();
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6" style={{ color: isDragging ? 'hsl(42, 80%, 55%)' : 'hsl(0, 0%, 40%)' }} />
            <span className="text-xs font-serif" style={{ color: isDragging ? 'hsl(42, 80%, 60%)' : 'hsl(0, 0%, 50%)' }}>
              {isDragging ? 'Drop your what3words photos here' : 'Drop what3words photos to auto-add Ancient Friends'}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-serif">supports multiple photos · review each one · add species & notes</span>
          </div>
        </div>
      )}

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

      {/* Tree grid or focused review */}
      {!hasQueue && (
        reviewMode ? (
          unknownTrees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-accent/30 p-12 text-center">
              <Check className="w-12 h-12 mx-auto mb-3 text-accent/40" />
              <p className="text-muted-foreground font-serif mb-3">
                All Ancient Friends have been identified! 🌿
                {reviewIdentified.size > 0 && (
                  <span className="block text-xs mt-1 text-accent/60">{reviewIdentified.size} identified this session</span>
                )}
              </p>
              <Button variant="outline" size="sm" onClick={() => { setReviewMode(false); window.location.reload(); }} className="font-serif text-xs">
                Back to all trees
              </Button>
            </div>
          ) : currentReviewTree ? (
            <div className="rounded-xl border-2 border-accent/30 bg-card/60 backdrop-blur p-6 space-y-4 max-w-lg mx-auto">
              {/* Tree info */}
              <div className="text-center space-y-1">
                <TreeDeciduous className="h-8 w-8 mx-auto text-accent/60" />
                <h3 className="font-serif text-lg text-primary">{currentReviewTree.name}</h3>
                {currentReviewTree.what3words && (
                  <p className="text-xs text-muted-foreground">📍 {currentReviewTree.what3words}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Added {new Date(currentReviewTree.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Species input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif">Species</label>
                <Input
                  value={reviewSpeciesInput}
                  onChange={(e) => setReviewSpeciesInput(e.target.value.slice(0, 200))}
                  placeholder="e.g., English Oak, Yew, Beech…"
                  className="h-9 text-sm font-serif"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && reviewSpeciesInput.trim()) {
                      e.preventDefault();
                      handleReviewSave();
                    }
                  }}
                />
              </div>

              {/* Name input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif">Name <span className="text-muted-foreground/40">(optional)</span></label>
                <Input
                  value={reviewNameInput}
                  onChange={(e) => setReviewNameInput(e.target.value.slice(0, 200))}
                  placeholder="Leave blank to use species as name"
                  className="h-9 text-sm font-serif"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && reviewSpeciesInput.trim()) {
                      e.preventDefault();
                      handleReviewSave();
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="mystical"
                  size="sm"
                  className="flex-1 font-serif text-xs gap-1.5"
                  disabled={reviewSaving || !reviewSpeciesInput.trim()}
                  onClick={handleReviewSave}
                >
                  {reviewSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Identify & Next
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-serif text-xs gap-1"
                  onClick={() => {
                    if (reviewIndex < unknownTrees.length - 1) {
                      setReviewIndex(reviewIndex + 1);
                    } else {
                      setReviewIndex(0);
                    }
                    setReviewSpeciesInput("");
                    setReviewNameInput("");
                  }}
                >
                  <SkipForward className="h-3 w-3" /> Skip
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-serif text-xs gap-1"
                  onClick={() => navigate(`/tree/${currentReviewTree.id}`)}
                >
                  <Eye className="h-3 w-3" /> View
                </Button>
              </div>

              {/* Navigation dots for small lists */}
              {unknownTrees.length <= 10 && unknownTrees.length > 1 && (
                <div className="flex justify-center gap-1.5 pt-1">
                  {unknownTrees.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setReviewIndex(i); setReviewSpeciesInput(""); setReviewNameInput(""); }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === reviewIndex ? 'bg-accent scale-125' : 'bg-border hover:bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null
        ) : (
          trees.length === 0 ? (
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
          )
        )
      )}
      <RewardReceipt
        visible={showMappingReceipt}
        onClose={() => { setShowMappingReceipt(false); setMappingReward(null); }}
        speciesHearts={mappingReward?.speciesHearts}
        speciesFamily={mappingReward?.speciesFamily}
        influence={mappingReward?.influence}
        actionLabel="Tree Mapping"
      />
    </div>
  );
};

export default DashboardTrees;
