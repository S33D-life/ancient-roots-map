/**
 * Beautiful empty states for research-derived tree pages.
 * Intentional, poetic placeholders rather than broken-looking gaps.
 */
import { Heart, Camera, MessageSquare, TreeDeciduous } from "lucide-react";

interface EmptyProps {
  treeName: string;
}

export const EmptyOfferings = ({ treeName }: EmptyProps) => (
  <div
    className="rounded-xl border p-6 text-center space-y-3"
    style={{
      borderColor: "hsl(var(--border) / 0.3)",
      background: "linear-gradient(135deg, hsl(var(--card) / 0.4), hsl(var(--card) / 0.2))",
    }}
  >
    <Camera className="h-6 w-6 mx-auto text-muted-foreground/40" />
    <p className="text-sm font-serif italic text-muted-foreground/60">
      No offerings yet — be the first to leave a trace beneath the branches of {treeName}.
    </p>
  </div>
);

export const EmptyWishes = ({ treeName }: EmptyProps) => (
  <div
    className="rounded-xl border p-6 text-center space-y-3"
    style={{
      borderColor: "hsl(var(--border) / 0.3)",
      background: "linear-gradient(135deg, hsl(var(--card) / 0.4), hsl(var(--card) / 0.2))",
    }}
  >
    <Heart className="h-6 w-6 mx-auto text-muted-foreground/40" />
    <p className="text-sm font-serif italic text-muted-foreground/60">
      This Ancient Friend is still emerging from the Research Grove. Leave a wish to welcome it into the living ledger.
    </p>
  </div>
);

export const EmptyVisits = ({ treeName }: EmptyProps) => (
  <div
    className="rounded-xl border p-6 text-center space-y-3"
    style={{
      borderColor: "hsl(var(--border) / 0.3)",
      background: "linear-gradient(135deg, hsl(var(--card) / 0.4), hsl(var(--card) / 0.2))",
    }}
  >
    <TreeDeciduous className="h-6 w-6 mx-auto text-muted-foreground/40" />
    <p className="text-sm font-serif italic text-muted-foreground/60">
      Visit records will appear here as {treeName} enters the wider living ledger.
    </p>
  </div>
);

export const EmptyWhispers = ({ treeName }: EmptyProps) => (
  <div
    className="rounded-xl border p-6 text-center space-y-3"
    style={{
      borderColor: "hsl(var(--border) / 0.3)",
      background: "linear-gradient(135deg, hsl(var(--card) / 0.4), hsl(var(--card) / 0.2))",
    }}
  >
    <MessageSquare className="h-6 w-6 mx-auto text-muted-foreground/40" />
    <p className="text-sm font-serif italic text-muted-foreground/60">
      Whisper to {treeName} — your words may drift through the canopy and find a kindred wanderer.
    </p>
  </div>
);
