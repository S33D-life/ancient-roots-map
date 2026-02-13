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
 * Renders a unique QR code for a staff, encoding a direct URL to its page.
 * Click to copy the URL to clipboard.
 */
export default function StaffQRCode({ staffCode, size = 96, className }: StaffQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const staffUrl = `${window.location.origin}/library/staff-room?staff=${encodeURIComponent(staffCode)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(staffUrl)}&bgcolor=0a0a08&color=c8a96e&margin=1&format=svg`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(staffUrl);
      setCopied(true);
      toast.success(`Link copied for ${staffCode}`);
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
      title={`Click to copy link for ${staffCode}`}
      aria-label={`Copy link for staff ${staffCode}`}
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
        {copied ? "Copied!" : "Click to copy link"}
      </p>
    </button>
  );
}
