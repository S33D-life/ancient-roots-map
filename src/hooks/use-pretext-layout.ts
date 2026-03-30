/**
 * usePretextLayout — lightweight Pretext integration for /s33d gateway labels.
 *
 * Uses @chenglou/pretext to measure text without DOM reflow:
 * - `prepare()` runs once when text/font changes (memoised)
 * - `layout()` is cheap arithmetic on container width changes
 *
 * Returns predicted height/lineCount so the container can be pre-sized,
 * and a balanced `maxWidth` to avoid orphan lines.
 *
 * SCOPED: only used on the /s33d gateway page.
 */
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { prepare, layout } from "@chenglou/pretext";

interface PretextLayoutOptions {
  text: string;
  /** CSS font shorthand, e.g. "italic 32px Georgia, serif" */
  font: string;
  /** Line-height in px */
  lineHeight: number;
  /** If provided, overrides measured container width */
  fixedWidth?: number;
  /** Enable container-width observation (default true) */
  observe?: boolean;
}

interface PretextLayoutResult {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Predicted height in px */
  height: number;
  /** Predicted line count */
  lineCount: number;
  /** Balanced max-width that avoids orphan lines (px) */
  balancedWidth: number | undefined;
  /** Whether preparation is complete */
  ready: boolean;
}

/**
 * Binary-search for the narrowest width that keeps the same line count
 * as the full-width layout. This produces "balanced" wrapping with
 * roughly even line lengths, avoiding a single dangling word.
 */
function findBalancedWidth(
  prepared: ReturnType<typeof prepare>,
  maxWidth: number,
  lineHeight: number,
): number | undefined {
  const full = layout(prepared, maxWidth, lineHeight);
  if (full.lineCount <= 1) return undefined; // single line — no balancing needed

  let lo = maxWidth * 0.5;
  let hi = maxWidth;
  const targetLines = full.lineCount;

  // ~8 iterations is plenty for pixel-level accuracy
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const test = layout(prepared, mid, lineHeight);
    if (test.lineCount <= targetLines) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // Snap to whole pixel, add a tiny safety margin
  return Math.ceil(hi) + 1;
}

export function usePretextLayout({
  text,
  font,
  lineHeight,
  fixedWidth,
  observe = true,
}: PretextLayoutOptions): PretextLayoutResult {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [containerWidth, setContainerWidth] = useState(fixedWidth ?? 0);

  // ── Observe container size changes ──
  useEffect(() => {
    if (fixedWidth != null || !observe) return;
    const el = containerRef.current;
    if (!el) return;

    // Initial read
    setContainerWidth(el.offsetWidth);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setContainerWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedWidth, observe]);

  // ── Prepare text (memoised — only recomputes when text/font change) ──
  const prepared = useMemo(() => {
    if (!text) return null;
    try {
      return prepare(text, font);
    } catch {
      // Fallback: if fonts aren't loaded or pretext fails, return null
      return null;
    }
  }, [text, font]);

  // ── Layout (cheap arithmetic — runs on every width change) ──
  const result = useMemo(() => {
    if (!prepared || containerWidth <= 0) {
      return { height: 0, lineCount: 0, balancedWidth: undefined, ready: false };
    }
    const l = layout(prepared, containerWidth, lineHeight);
    const balancedWidth = findBalancedWidth(prepared, containerWidth, lineHeight);
    return {
      height: l.height,
      lineCount: l.lineCount,
      balancedWidth,
      ready: true,
    };
  }, [prepared, containerWidth, lineHeight]);

  return {
    containerRef,
    ...result,
  };
}

/**
 * Simple helper for one-off measurement without a hook.
 * Useful in callbacks or event handlers.
 */
export function measureText(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
) {
  const p = prepare(text, font);
  return layout(p, maxWidth, lineHeight);
}
