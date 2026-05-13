import { Card, CardContent } from "@/components/ui/card";
import type { LunarCycleFraming } from "@/lib/moonroot/lunar";

interface Props {
  framing: LunarCycleFraming;
  startLabel: string;
  endLabel: string;
}

export default function LunarFramingHeader({ framing, startLabel, endLabel }: Props) {
  return (
    <Card className="bg-gradient-to-br from-card/80 via-card/60 to-primary/5 border-primary/20 overflow-hidden">
      <CardContent className="p-6 md:p-8 text-center space-y-3">
        <div className="text-5xl md:text-6xl leading-none select-none" aria-hidden>
          {framing.glyph}
        </div>
        <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-serif">
          {framing.label}
        </div>
        <p className="font-serif italic text-foreground/80 text-base md:text-lg max-w-md mx-auto">
          {framing.whisper}
        </p>
        <div className="text-xs text-muted-foreground font-serif tracking-wide pt-2 border-t border-primary/10">
          {startLabel} <span className="opacity-50">·</span> {endLabel}
        </div>
      </CardContent>
    </Card>
  );
}
