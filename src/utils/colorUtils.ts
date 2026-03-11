/**
 * Adds alpha transparency to an HSL color string.
 * Converts "hsl(42 88% 45%)" → "hsl(42 88% 45% / 0.25)"
 */
export function hslAlpha(hsl: string, alpha: number): string {
  // Strip closing paren, append alpha, close
  return hsl.replace(")", ` / ${alpha})`);
}
