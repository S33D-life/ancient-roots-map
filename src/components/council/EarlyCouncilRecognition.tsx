import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

const STORAGE_KEY = "s33d_early_council_presence";

function hasNoted(sessionId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw)[sessionId] === true : false;
  } catch {
    return false;
  }
}

function markNoted(sessionId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[sessionId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

interface Props {
  sessionId: string;
}

export default function EarlyCouncilRecognition({ sessionId }: Props) {
  const [noted, setNoted] = useState(() => hasNoted(sessionId));

  const handleNote = () => {
    markNoted(sessionId);
    setNoted(true);
  };

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-primary/10 mb-4">
      <CardContent className="p-5">
        <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3 flex items-center gap-1.5">
          <Leaf className="h-3 w-3 text-primary/60" /> Early Council Recognition
        </h2>

        {noted ? (
          <div>
            <p className="text-sm font-serif text-foreground/70 leading-relaxed">
              Presence noted 🌱
            </p>
            <p className="text-xs font-serif text-muted-foreground/50 mt-1">
              We'll be in touch as the early council records are aligned.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-serif text-muted-foreground/80 leading-relaxed mb-1">
              If you were part of the first 229 Council of Life gatherings,
              thank you for helping shape the roots of this space.
            </p>
            <p className="text-sm font-serif text-muted-foreground/80 leading-relaxed mb-4">
              We'll be connecting with you soon to confirm your S33D Hearts
              as a gesture of gratitude for your early support.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-serif text-primary/70 hover:text-primary gap-1.5"
              onClick={handleNote}
            >
              <Leaf className="h-3 w-3" /> I was part of this
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
