import { useState, useEffect } from "react";
import { getMetadataUrl, getImageUrl, getBaseScanUrl, getOpenSeaUrl, STAFF_CONTRACT_ADDRESS } from "@/config/staffContract";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, ImageOff } from "lucide-react";

interface NftAttribute {
  trait_type: string;
  value: string | number;
}

interface NftMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: NftAttribute[];
}

interface IpfsMetadataViewerProps {
  tokenId: number;
  fallbackImage?: string;
}

const IpfsMetadataViewer = ({ tokenId, fallbackImage }: IpfsMetadataViewerProps) => {
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      setError(false);
      try {
        const url = getMetadataUrl(tokenId);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMetadata(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [tokenId]);

  const ipfsImage = metadata?.image
    ? metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
    : getImageUrl(tokenId);

  const displayImage = imgError ? fallbackImage : ipfsImage;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground font-serif">Fetching on-chain metadata…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <ImageOff className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-serif">Metadata not yet available for Token #{tokenId}</p>
        <p className="text-xs text-muted-foreground/60">The IPFS metadata may not be published yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* On-chain image */}
      <div className="w-full aspect-square bg-card overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={metadata?.name || `Staff #${tokenId}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <ImageOff className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Metadata details */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-serif text-xl text-primary font-bold">
            {metadata?.name || `Staff #${tokenId}`}
          </h3>
          {metadata?.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{metadata.description}</p>
          )}
        </div>

        {/* Attributes */}
        {metadata?.attributes && metadata.attributes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">On-Chain Attributes</p>
            <div className="grid grid-cols-2 gap-2">
              {metadata.attributes.map((attr, i) => (
                <div
                  key={i}
                  className="bg-muted/30 border border-border/50 rounded-lg p-2.5 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {attr.trait_type}
                  </p>
                  <p className="text-sm font-serif font-medium text-foreground mt-0.5">
                    {attr.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token info */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground">Token ID</span>
            <span className="font-mono text-foreground">#{String(tokenId).padStart(3, "0")}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground">Standard</span>
            <span className="text-foreground">ERC-721</span>
          </div>
          <div className="flex justify-between pb-1.5">
            <span className="text-muted-foreground">Chain</span>
            <Badge variant="outline" className="text-xs">Base</Badge>
          </div>
        </div>

        {/* External links */}
        {STAFF_CONTRACT_ADDRESS && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs font-serif" asChild>
              <a href={getBaseScanUrl(tokenId)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                BaseScan
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs font-serif" asChild>
              <a href={getOpenSeaUrl(tokenId)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
                OpenSea
              </a>
            </Button>
          </div>
        )}

        {/* IPFS link */}
        <a
          href={getMetadataUrl(tokenId)}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          View raw IPFS metadata →
        </a>
      </div>
    </div>
  );
};

export default IpfsMetadataViewer;
