/**
 * Species presence — turn an existing `tree_species_lore` entry into a short, quiet
 * ecological whisper for inline display. Pure; uses existing lore copy only — never
 * generates text, never writes.
 *
 * Read-only Species Experience win (see docs/SPECIES_DEEP_ECOLOGY_AUDIT.md §6/§12).
 * A whisper is ~one sentence, not an encyclopedia paragraph; if there is no usable
 * lore the caller shows nothing (graceful omit, no placeholder clutter).
 */

const DEFAULT_MAX = 140;

/**
 * Reduce a lore body to a single gentle line:
 *  - take the first paragraph,
 *  - keep it to ~maxLen chars, cutting at a sentence boundary when possible,
 *  - add an ellipsis only when we actually truncated mid-thought.
 * Returns null for empty/whitespace input (so callers omit cleanly).
 */
export function toPresenceWhisper(
  text: string | null | undefined,
  maxLen: number = DEFAULT_MAX,
): string | null {
  const firstParagraph = (text ?? "").split("\n").map((s) => s.trim()).find(Boolean);
  if (!firstParagraph) return null;

  // Prefer a single clean sentence when the paragraph has more than one and the
  // first is substantial (avoids returning a tiny fragment like "Oak.").
  const firstSentence = firstParagraph.match(/^(.+?[.!?])(\s|$)/)?.[1];
  const whisper =
    firstSentence && firstSentence.length >= 40 && firstSentence.length < firstParagraph.length
      ? firstSentence
      : firstParagraph;

  if (whisper.length <= maxLen) return whisper;

  const window = whisper.slice(0, maxLen);

  // Prefer cutting at the last sentence end within the window.
  const lastSentenceEnd = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
  );
  if (lastSentenceEnd >= 60) {
    return window.slice(0, lastSentenceEnd + 1).trim();
  }

  // Otherwise cut at the last word boundary and add an ellipsis.
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > 40 ? window.slice(0, lastSpace) : window;
  return `${cut.trim()}…`;
}
