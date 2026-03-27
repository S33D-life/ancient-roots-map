/**
 * TeotagFace — contextual, atmospheric presence of TEOTAG.
 * Uses the face images as a calm, immersive layer.
 * Not a navigation element — purely atmospheric / guidance.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import faceFeminine from "@/assets/teotag-face-feminine.png";
import faceMasculine from "@/assets/teotag-face-masculine.webp";

type Variant = "feminine" | "masculine" | "auto";
type Size = "sm" | "md" | "lg";

interface TeotagFaceProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Optional whisper text beneath the face */
  whisper?: string;
  /** Delay before fade-in (seconds) */
  delay?: number;
}

const SIZE_MAP: Record<Size, string> = {
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-28 h-28",
};

function pickFace(variant: Variant): string {
  if (variant === "feminine") return faceFeminine;
  if (variant === "masculine") return faceMasculine;
  // "auto" — deterministic per session so it doesn't flicker
  const seed = (new Date().getDate() + new Date().getMonth()) % 2;
  return seed === 0 ? faceFeminine : faceMasculine;
}

export default function TeotagFace({
  variant = "auto",
  size = "md",
  className = "",
  whisper,
  delay = 0.3,
}: TeotagFaceProps) {
  const [loaded, setLoaded] = useState(false);
  const src = pickFace(variant);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
      className={`flex flex-col items-center gap-2 ${className}`}
    >
      <div className={`${SIZE_MAP[size]} rounded-full overflow-hidden ring-1 ring-primary/10`}>
        <img
          src={src}
          alt="TEOTAG — The Echo of the Ancient Groves"
          className="w-full h-full object-cover object-top"
          onLoad={() => setLoaded(true)}
          loading="lazy"
          draggable={false}
        />
      </div>
      {whisper && loaded && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: delay + 0.6 }}
          className="text-[11px] font-serif text-muted-foreground/60 text-center max-w-[200px] leading-relaxed italic"
        >
          {whisper}
        </motion.p>
      )}
    </motion.div>
  );
}
