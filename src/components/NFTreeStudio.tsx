import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useOfferings } from "@/hooks/use-offerings";
import { useNFTreeMint, type MintStage } from "@/hooks/use-nftree-mint";
import { NFTREE_CONTRACT_ADDRESS } from "@/config/nftreeContract";
import type { CachedStaff } from "@/hooks/use-wallet";
import { toast } from "sonner";
import {
  Sparkles, Image as ImageIcon, Paintbrush, History, ExternalLink,
  Loader2, Download, RotateCcw, Type, Palette, Layers, ZoomIn, ZoomOut,
  Wallet, Shield, CheckCircle2, AlertTriangle, ArrowRight,
} from "lucide-react";
import IpfsMetadataViewer from "@/components/IpfsMetadataViewer";

interface NFTreeStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  treeName: string;
  treeSpecies: string;
  photoUrl?: string | null;
  presenceCompleted?: boolean;
  // Wallet integration props
  walletAddress?: string | null;
  isCorrectNetwork?: boolean;
  activeStaff?: CachedStaff | null;
  isStaffHolder?: boolean;
  onConnectWallet?: () => void;
  onSwitchNetwork?: () => Promise<boolean>;
}

// ── Art Studio Canvas ─────────────────────────────────────────────
interface CanvasState {
  text: string;
  textColor: string;
  fontSize: number;
  filter: string;
  overlay: string;
}

const FILTERS = [
  { id: "none", label: "None", css: "none" },
  { id: "sepia", label: "Sepia", css: "sepia(0.7)" },
  { id: "mystic", label: "Mystic", css: "saturate(1.4) hue-rotate(15deg)" },
  { id: "ancient", label: "Ancient", css: "contrast(1.1) brightness(0.9) sepia(0.3)" },
  { id: "ember", label: "Ember", css: "saturate(1.6) hue-rotate(-10deg) brightness(1.05)" },
  { id: "frost", label: "Frost", css: "saturate(0.7) brightness(1.15) hue-rotate(180deg)" },
];

const OVERLAYS = [
  { id: "none", label: "None" },
  { id: "vignette", label: "Vignette" },
  { id: "grain", label: "Grain" },
  { id: "golden", label: "Golden Glow" },
];

const STAGE_LABELS: Record<MintStage, string> = {
  idle: "",
  checking_wallet: "Checking wallet…",
  checking_staff: "Verifying Staff NFT…",
  authorizing: "Authorizing mint…",
  awaiting_signature: "Confirm in MetaMask…",
  confirming: "Waiting for confirmation…",
  recording: "Recording provenance…",
  success: "NFTree sealed on-chain!",
  error: "Mint failed",
};

const NFTreeStudio = ({
  open,
  onOpenChange,
  treeId,
  treeName,
  treeSpecies,
  photoUrl,
  presenceCompleted = true,
  walletAddress,
  isCorrectNetwork = false,
  activeStaff,
  isStaffHolder = false,
  onConnectWallet,
  onSwitchNetwork,
}: NFTreeStudioProps) => {
  const [activeTab, setActiveTab] = useState<string>("mint");
  const [mintTitle, setMintTitle] = useState(treeName);
  const [mintDescription, setMintDescription] = useState("");

  // Art studio state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    text: treeName,
    textColor: "#d4a574",
    fontSize: 32,
    filter: "none",
    overlay: "none",
  });
  const [studioImage, setStudioImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);

  // Real mint hook
  const nftreeMint = useNFTreeMint({
    walletAddress: walletAddress || null,
    isCorrectNetwork,
    activeStaff: activeStaff || null,
    switchNetwork: onSwitchNetwork || (async () => false),
  });

  const isMinting = nftreeMint.stage !== "idle" && nftreeMint.stage !== "success" && nftreeMint.stage !== "error";

  // Load tree photo into studio
  useEffect(() => {
    if (!photoUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setStudioImage(img);
    img.src = photoUrl;
  }, [photoUrl]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !studioImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    const filterDef = FILTERS.find((f) => f.id === canvasState.filter);
    if (filterDef) ctx.filter = filterDef.css;

    const scale = Math.max(size / studioImage.width, size / studioImage.height) * zoom;
    const dx = (size - studioImage.width * scale) / 2;
    const dy = (size - studioImage.height * scale) / 2;
    ctx.drawImage(studioImage, dx, dy, studioImage.width * scale, studioImage.height * scale);
    ctx.restore();

    if (canvasState.overlay === "vignette") {
      const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.25, size / 2, size / 2, size * 0.7);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else if (canvasState.overlay === "grain") {
      const imageData = ctx.getImageData(0, 0, size, size);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        imageData.data[i] += noise;
        imageData.data[i + 1] += noise;
        imageData.data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    } else if (canvasState.overlay === "golden") {
      ctx.fillStyle = "rgba(212, 165, 116, 0.15)";
      ctx.fillRect(0, 0, size, size);
      const grad = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.3, size * 0.3, size * 0.5);
      grad.addColorStop(0, "rgba(255, 215, 100, 0.12)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    if (canvasState.text) {
      ctx.font = `bold ${canvasState.fontSize}px "Playfair Display", serif`;
      ctx.fillStyle = canvasState.textColor;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.fillText(canvasState.text, size / 2, size - 40, size - 40);
      ctx.shadowBlur = 0;
    }
  }, [studioImage, canvasState, zoom]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const { offerings: allTreeOfferings, refetch: refetchOfferings } = useOfferings({ treeId: open ? treeId : null, realtime: true });
  const mintHistory = useMemo(
    () => allTreeOfferings.filter(o => o.type === "nft"),
    [allTreeOfferings]
  );

  // ── Upload image and get URL ──
  const uploadImage = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in to mint");

    let finalUrl = photoUrl || null;

    if (activeTab === "studio" && canvasRef.current) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current!.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (blob) {
        const fileName = `${user.id}/${treeId}/nftree-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("offerings")
          .upload(fileName, blob, { cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("offerings").getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      }
    }

    return finalUrl;
  };

  // ── Create offering record (for provenance) ──
  const createOfferingRecord = async (imageUrl: string | null): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in");

    const { data, error } = await supabase.from("offerings").insert({
      tree_id: treeId,
      type: "nft" as const,
      title: mintTitle || treeName,
      content: mintDescription || `NFTree of ${treeName} (${treeSpecies})`,
      media_url: imageUrl,
      nft_link: null,
      created_by: user.id,
    }).select("id").single();

    if (error) throw error;
    return data.id;
  };

  // ── Full mint flow ──
  const handleMint = async () => {
    setUploading(true);
    try {
      // 1. Upload image
      const imageUrl = await uploadImage();

      // 2. Create offering record first
      const offeringId = await createOfferingRecord(imageUrl);

      setUploading(false);

      // 3. Build metadata URI (for now use image URL as placeholder metadata)
      const metadataUri = imageUrl || `s33d://tree/${treeId}`;

      // 4. Execute real on-chain mint
      const mintResult = await nftreeMint.mint({
        treeId,
        offeringId,
        metadataUri,
        imageUri: imageUrl || undefined,
      });

      if (mintResult) {
        // Update offering with the NFT link
        refetchOfferings();
        setActiveTab("history");
      }
    } catch (err: any) {
      setUploading(false);
      toast.error("Preparation failed", { description: err.message });
    }
  };

  // ── Legacy offering-only mint (when contract not deployed yet) ──
  const handleLegacyMint = async () => {
    setUploading(true);
    try {
      const imageUrl = await uploadImage();
      await createOfferingRecord(imageUrl);
      toast.success("NFTree recorded!", {
        description: "Your NFTree has been recorded. On-chain minting will be available once the contract is deployed.",
      });
      refetchOfferings();
      setActiveTab("history");
    } catch (err: any) {
      toast.error("Recording failed", { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const downloadCanvas = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `nftree-${treeName.replace(/\s+/g, "-").toLowerCase()}.jpg`;
    link.href = canvasRef.current.toDataURL("image/jpeg", 0.92);
    link.click();
  };

  // ── Readiness checks for the staged flow ──
  const canMintOnchain = walletAddress && isCorrectNetwork && isStaffHolder && activeStaff && NFTREE_CONTRACT_ADDRESS;
  const contractDeployed = !!NFTREE_CONTRACT_ADDRESS;

  // ── Mint readiness checklist UI ──
  const MintChecklist = () => (
    <div className="rounded-xl border border-border/30 bg-secondary/10 p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-serif">
        Mint Readiness
      </p>
      <ChecklistItem
        done={!!walletAddress}
        label="Wallet Connected"
        action={!walletAddress ? "Connect" : undefined}
        onAction={onConnectWallet}
      />
      <ChecklistItem
        done={isCorrectNetwork}
        label="Base Network"
        action={walletAddress && !isCorrectNetwork ? "Switch" : undefined}
        onAction={() => onSwitchNetwork?.()}
      />
      <ChecklistItem
        done={isStaffHolder}
        label="Staff NFT Verified"
        sublabel={!isStaffHolder && walletAddress ? "No Staff NFT found in this wallet" : undefined}
      />
      <ChecklistItem
        done={!!activeStaff}
        label={activeStaff ? `Active Staff: ${activeStaff.species}` : "Active Staff Selected"}
      />
      <ChecklistItem done={presenceCompleted} label="Presence Ritual Complete" />
      <ChecklistItem
        done={contractDeployed}
        label="NFTree Contract"
        sublabel={!contractDeployed ? "Coming soon — record now, mint later" : undefined}
      />
    </div>
  );

  // ── Progress display during minting ──
  const MintProgress = () => (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        {nftreeMint.stage === "success" ? (
          <CheckCircle2 className="w-8 h-8 text-primary" />
        ) : nftreeMint.stage === "error" ? (
          <AlertTriangle className="w-8 h-8 text-destructive" />
        ) : (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        )}
      </div>
      <div>
        <p className="text-sm font-serif text-foreground">{STAGE_LABELS[nftreeMint.stage]}</p>
        {nftreeMint.txHash && (
          <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">
            tx: {nftreeMint.txHash}
          </p>
        )}
        {nftreeMint.error && (
          <p className="text-xs text-destructive mt-2 font-serif">{nftreeMint.error}</p>
        )}
      </div>

      {nftreeMint.stage === "success" && nftreeMint.result && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="rounded-lg bg-card/50 p-3">
              <p className="text-[10px] text-muted-foreground font-serif">Token ID</p>
              <p className="text-lg font-serif text-primary">#{nftreeMint.result.tokenId}</p>
            </div>
            <div className="rounded-lg bg-card/50 p-3">
              <p className="text-[10px] text-muted-foreground font-serif">Chain</p>
              <p className="text-sm font-serif text-foreground">Base</p>
            </div>
          </div>
          <div className="flex gap-2">
            {nftreeMint.result.explorerUrl && (
              <a
                href={nftreeMint.result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs font-serif">
                  <ExternalLink className="w-3 h-3" /> BaseScan
                </Button>
              </a>
            )}
            {nftreeMint.result.marketplaceUrl && (
              <a
                href={nftreeMint.result.marketplaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs font-serif">
                  <ExternalLink className="w-3 h-3" /> OpenSea
                </Button>
              </a>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-serif"
            onClick={() => { nftreeMint.reset(); setActiveTab("history"); }}
          >
            View History
          </Button>
        </div>
      )}

      {nftreeMint.stage === "error" && (
        <Button variant="outline" size="sm" className="text-xs font-serif" onClick={nftreeMint.reset}>
          Try Again
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div
          className="h-1"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(42 70% 55%), hsl(var(--primary) / 0.3))",
          }}
        />
        <div className="px-6 pt-5 pb-2">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              NFTree Studio
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-serif tracking-wider mt-1">
              {treeName} — {treeSpecies}
            </p>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="mint" className="gap-1.5 text-xs font-serif">
              <ImageIcon className="w-3.5 h-3.5" /> Mint
            </TabsTrigger>
            <TabsTrigger value="studio" className="gap-1.5 text-xs font-serif">
              <Paintbrush className="w-3.5 h-3.5" /> Studio
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs font-serif">
              <History className="w-3.5 h-3.5" /> History
            </TabsTrigger>
          </TabsList>

          {/* ── Mint from Photo ─────────────────────────────── */}
          <TabsContent value="mint" className="space-y-4">
            {/* Show progress if minting */}
            {isMinting || nftreeMint.stage === "success" || nftreeMint.stage === "error" ? (
              <MintProgress />
            ) : (
              <>
                {photoUrl ? (
                  <div className="rounded-xl overflow-hidden border border-border/40">
                    <img src={photoUrl} alt={treeName} className="w-full aspect-square object-cover" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 flex items-center justify-center aspect-square bg-muted/20">
                    <p className="text-sm text-muted-foreground font-serif">No photo available — use Studio to create artwork</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-serif text-muted-foreground">Title</Label>
                    <Input
                      value={mintTitle}
                      onChange={(e) => setMintTitle(e.target.value)}
                      placeholder="NFTree title"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-serif text-muted-foreground">Description</Label>
                    <Textarea
                      value={mintDescription}
                      onChange={(e) => setMintDescription(e.target.value)}
                      placeholder="Tell the story of this NFTree..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>

                <MintChecklist />

                {/* Active staff indicator */}
                {activeStaff && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5">
                    {activeStaff.image_url && (
                      <img src={activeStaff.image_url} alt={activeStaff.species} className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-serif text-foreground">Sealing with: {activeStaff.species} Staff</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{activeStaff.id} · Token #{activeStaff.token_id}</p>
                    </div>
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                )}

                {/* Primary mint action */}
                {canMintOnchain ? (
                  <Button
                    onClick={handleMint}
                    disabled={isMinting || uploading || !mintTitle.trim() || !presenceCompleted}
                    className="w-full gap-2 font-serif"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {uploading ? "Preparing…" : "Mint NFTree On-Chain"}
                  </Button>
                ) : contractDeployed ? (
                  <Button
                    disabled
                    className="w-full gap-2 font-serif opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    {!walletAddress
                      ? "Connect Wallet to Mint"
                      : !isCorrectNetwork
                        ? "Switch to Base Network"
                        : !isStaffHolder
                          ? "Staff NFT Required"
                          : "Select an Active Staff"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleLegacyMint}
                    disabled={uploading || !mintTitle.trim() || !presenceCompleted}
                    variant="outline"
                    className="w-full gap-2 font-serif"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {uploading ? "Recording…" : "Record NFTree (on-chain mint coming soon)"}
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Art Studio ──────────────────────────────────── */}
          <TabsContent value="studio" className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border/40 bg-black/20 relative">
              <canvas
                ref={canvasRef}
                className="w-full aspect-square"
                style={{ imageRendering: "auto" }}
              />
              {!studioImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground font-serif">
                    {photoUrl ? "Loading image…" : "Add a photo offering first to use the studio"}
                  </p>
                </div>
              )}
            </div>

            {studioImage && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-serif text-muted-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Filter
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTERS.map((f) => (
                      <Button
                        key={f.id}
                        variant={canvasState.filter === f.id ? "default" : "outline"}
                        size="sm"
                        className="text-[10px] h-7 font-serif"
                        onClick={() => setCanvasState((s) => ({ ...s, filter: f.id }))}
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-serif text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Overlay
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {OVERLAYS.map((o) => (
                      <Button
                        key={o.id}
                        variant={canvasState.overlay === o.id ? "default" : "outline"}
                        size="sm"
                        className="text-[10px] h-7 font-serif"
                        onClick={() => setCanvasState((s) => ({ ...s, overlay: o.id }))}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-serif text-muted-foreground flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" /> Text Overlay
                  </Label>
                  <Input
                    value={canvasState.text}
                    onChange={(e) => setCanvasState((s) => ({ ...s, text: e.target.value }))}
                    placeholder="Inscribe text on your NFTree"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={canvasState.textColor}
                      onChange={(e) => setCanvasState((s) => ({ ...s, textColor: e.target.value }))}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[10px] text-muted-foreground">Size</span>
                      <input
                        type="range"
                        min={16}
                        max={64}
                        value={canvasState.fontSize}
                        onChange={(e) => setCanvasState((s) => ({ ...s, fontSize: +e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground font-mono">{(zoom * 100).toFixed(0)}%</span>
                  <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}>
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setZoom(1); setCanvasState({ text: treeName, textColor: "#d4a574", fontSize: 32, filter: "none", overlay: "none" }); }}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-serif" onClick={downloadCanvas}>
                    <Download className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div>
                    <Label className="text-xs font-serif text-muted-foreground">Title</Label>
                    <Input
                      value={mintTitle}
                      onChange={(e) => setMintTitle(e.target.value)}
                      placeholder="NFTree title"
                      className="mt-1"
                    />
                  </div>

                  {canMintOnchain ? (
                    <Button
                      onClick={handleMint}
                      disabled={isMinting || uploading || !mintTitle.trim() || !presenceCompleted}
                      className="w-full gap-2 font-serif"
                    >
                      {uploading || isMinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {uploading ? "Preparing…" : isMinting ? "Minting…" : "Mint Studio NFTree On-Chain"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleLegacyMint}
                      disabled={uploading || !mintTitle.trim() || !presenceCompleted}
                      variant="outline"
                      className="w-full gap-2 font-serif"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {uploading ? "Recording…" : "Record Studio NFTree"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Mint History ────────────────────────────────── */}
          <TabsContent value="history" className="space-y-4">
            {mintHistory.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-serif">No NFTrees minted for this tree yet</p>
                <Button variant="outline" size="sm" className="mt-2 font-serif" onClick={() => setActiveTab("mint")}>
                  Mint the first one
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-serif">
                  {mintHistory.length} NFTree{mintHistory.length !== 1 ? "s" : ""} minted
                </p>
                {mintHistory.map((item) => (
                  <Card key={item.id} className="border-border/40 bg-card/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex gap-3">
                        {item.media_url && (
                          <img
                            src={item.media_url}
                            alt={item.title}
                            className="w-20 h-20 object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 py-3 pr-3 space-y-1">
                          <p className="text-sm font-serif font-medium text-foreground line-clamp-1">
                            {item.title}
                          </p>
                          {item.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            {item.nft_link ? (
                              <a
                                href={item.nft_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                              >
                                View on-chain <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40 font-serif italic">
                                Not yet on-chain
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ── Checklist helper ──
const ChecklistItem = ({
  done,
  label,
  sublabel,
  action,
  onAction,
}: {
  done: boolean;
  label: string;
  sublabel?: string;
  action?: string;
  onAction?: () => void;
}) => (
  <div className="flex items-center gap-2.5">
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        done ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground/40"
      }`}
    >
      {done ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-current" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-serif ${done ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </p>
      {sublabel && <p className="text-[10px] text-muted-foreground/60 font-serif">{sublabel}</p>}
    </div>
    {action && onAction && (
      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 font-serif" onClick={onAction}>
        {action} <ArrowRight className="w-2.5 h-2.5 ml-1" />
      </Button>
    )}
  </div>
);

export default NFTreeStudio;
