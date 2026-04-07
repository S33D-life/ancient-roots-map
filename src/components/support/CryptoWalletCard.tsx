import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CryptoWalletCard = ({
  label,
  symbol,
  address,
  network,
}: {
  label: string;
  symbol: string;
  address: string;
  network: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success(`${symbol} address copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}&bgcolor=0a0a08&color=c8a96e&margin=1&format=svg`;

  return (
    <div className="rounded-lg border border-border/30 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground/60">{network}</span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="rounded-lg border border-border/20 bg-secondary/20 p-2">
          <img
            src={qrUrl}
            alt={`QR code for ${symbol} address`}
            width={96}
            height={96}
            className="rounded"
            loading="lazy"
          />
        </div>
      </div>

      {/* Address + copy */}
      <div className="flex items-center gap-2">
        <code className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-1.5 rounded flex-1 truncate font-mono">
          {address}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-muted/50 transition-colors shrink-0"
          aria-label={`Copy ${symbol} address`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50">
        Only send {symbol} to this address. Awaiting confirmation.
      </p>
    </div>
  );
};

export default CryptoWalletCard;
