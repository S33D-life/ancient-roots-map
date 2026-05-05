import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  text: string;
  label: string;
  className?: string;
}

export default function CopyButton({ text, label, className }: Props) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn("[Moonroot] clipboard failed", err);
      toast("Could not copy — try selecting the text manually");
    }
  };
  return (
    <Button onClick={handle} variant="outline" size="sm" className={className}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
