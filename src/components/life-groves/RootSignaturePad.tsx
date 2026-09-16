import { useRef } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SignaturePoint {
  x: number;
  y: number;
}

export type SignatureStrokes = SignaturePoint[][];

interface SignatureMarkProps {
  strokes: SignatureStrokes | null | undefined;
  label: string;
  className?: string;
}

export function SignatureMark({ strokes, label, className = "" }: SignatureMarkProps) {
  if (!strokes?.length) return null;
  return (
    <svg
      viewBox="0 0 320 140"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
      className={`text-foreground ${className}`}
    >
      {strokes.map((stroke, index) => (
        <polyline
          key={index}
          points={stroke.map((point) => `${point.x * 320},${point.y * 140}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

interface RootSignaturePadProps {
  value: SignatureStrokes;
  onChange: (strokes: SignatureStrokes) => void;
  label?: string;
}

export default function RootSignaturePad({
  value,
  onChange,
  label = "Draw the handwritten inscription",
}: RootSignaturePadProps) {
  const drawing = useRef(false);

  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>): SignaturePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-border/50 bg-background/50 shadow-inner">
        <svg
          viewBox="0 0 320 140"
          role="application"
          aria-label={label}
          tabIndex={0}
          className="block h-[160px] w-full touch-none text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          onPointerDown={(event) => {
            if (event.button !== 0 || value.length >= 12) return;
            drawing.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            onChange([...value, [pointFromEvent(event)]]);
          }}
          onPointerMove={(event) => {
            if (!drawing.current || value.length === 0) return;
            const current = value[value.length - 1];
            if (!current || current.length >= 200) return;
            const point = pointFromEvent(event);
            const previous = current[current.length - 1];
            if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.004) return;
            onChange([...value.slice(0, -1), [...current, point]]);
          }}
          onPointerUp={() => {
            drawing.current = false;
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
        >
          <path d="M28 108 C92 101 222 105 292 96" fill="none" stroke="currentColor" strokeOpacity="0.08" />
          {value.map((stroke, index) => (
            <polyline
              key={index}
              points={stroke.map((point) => `${point.x * 320},${point.y * 140}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-11 w-11"
          aria-label="Undo last stroke"
          title="Undo last stroke"
          disabled={value.length === 0}
          onClick={() => onChange(value.slice(0, -1))}
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-11 w-11"
          aria-label="Clear handwritten mark"
          title="Clear handwritten mark"
          disabled={value.length === 0}
          onClick={() => onChange([])}
        >
          <Eraser className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}