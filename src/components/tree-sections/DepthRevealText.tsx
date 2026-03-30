/**
 * DepthRevealText — a text block that reveals softly as it enters viewport,
 * with optional staggered line delays and depth-aware styling.
 *
 * SCOPED: only used on /s33d tree-section components.
 */
import { useRef, type ReactNode, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  children: ReactNode;
  /** Delay in ms before reveal starts */
  delay?: number;
  /** Zone-based style overrides */
  style?: CSSProperties;
  className?: string;
  /** Whether this is a "wonder line" — slightly larger, more presence */
  wonder?: boolean;
  as?: "p" | "h2" | "h3" | "span" | "div";
}

const DepthRevealText = ({
  children,
  delay = 0,
  style,
  className = "",
  wonder = false,
  as: Tag = "p",
}: Props) => {
  const reducedMotion = useReducedMotion();
  const MotionTag = motion[Tag] || motion.p;

  return (
    <MotionTag
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: wonder ? 8 : 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: wonder ? 1.2 : 0.8,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`${className} ${wonder ? "depth-wonder-line" : ""}`}
      style={style}
    >
      {children}
    </MotionTag>
  );
};

export default DepthRevealText;
