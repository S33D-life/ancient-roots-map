import { Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TreeWhisperButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
}

export default function TreeWhisperButton({ onClick, className = "", title = "Whisper to this tree" }: TreeWhisperButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label="Whisper to this tree"
      title={title}
      className={`h-8 w-8 p-0 rounded-full border border-primary/20 bg-background/70 text-primary/80 shadow-sm backdrop-blur-sm transition hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      <Wind className="h-3.5 w-3.5" />
    </Button>
  );
}
