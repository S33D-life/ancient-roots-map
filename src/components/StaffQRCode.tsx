import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffQRCodeProps {
  staffCode: string;
  size?: number;
  className?: string;
}

/**
 * Renders a unique QR code for a staff, encoding its code.
 * Click to copy the staff code to clipboard.
 */
export default function StaffQRCode({ staffCode, size = 96, className }: StaffQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(staffCode)}&bgcolor=0a0a08&color=c8a96e&margin=1&format=svg`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(staffCode);
      setCopied(true);
      toast.success(`Copied: ${staffCode}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "relative group rounded-lg border border-border/40 bg-secondary/20 p-2 transition-all hover:border-primary/40 hover:bg-secondary/40 cursor-pointer",
        className
      )}
      title={`Click to copy: ${staffCode}`}
      aria-label={`Copy staff code ${staffCode}`}
    >
      <img
        src={qrUrl}
        alt={`QR code for ${staffCode}`}
        width={size}
        height={size}
        className="rounded"
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? (
          <Check className="w-5 h-5 text-primary" />
        ) : (
          <Copy className="w-5 h-5 text-primary" />
        )}
      </span>
      <p className="text-[9px] text-muted-foreground font-mono text-center mt-1 group-hover:text-primary transition-colors">
        {copied ? "Copied!" : "Click to copy"}
      </p>
    </button>
  );
}
