// Matches [[Note Title]] or [[Note Title|Display Text]]
const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export function extractWikilinks(content: string): string[] {
  const titles: string[] = [];
  for (const m of content.matchAll(WIKILINK_RE)) {
    titles.push(m[1].trim());
  }
  return titles;
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Replace [[wikilinks]] in markdown content with standard markdown links.
 * Resolved links navigate to /tetol-brain?note=<id>.
 * Unresolved links navigate to /tetol-brain?new=<encoded-title> (create flow).
 */
export function resolveWikilinks(
  content: string,
  index: Record<string, { id: string }>,
): string {
  return content.replace(WIKILINK_RE, (_, rawTitle: string, rawDisplay?: string) => {
    const title = rawTitle.trim();
    const label = rawDisplay?.trim() ?? title;
    const key = title.toLowerCase();
    const entry = index[key];
    if (entry) {
      return `[${label}](/tetol-brain?note=${entry.id})`;
    }
    return `[${label}](/tetol-brain?new=${encodeURIComponent(title)})`;
  });
}

/** Build a lowercase-title → {id} lookup from a list of notes. */
export function buildWikilinkIndex(
  notes: Array<{ id: string; title: string }>,
): Record<string, { id: string }> {
  const idx: Record<string, { id: string }> = {};
  for (const n of notes) {
    idx[n.title.toLowerCase()] = { id: n.id };
  }
  return idx;
}

/** Find all notes that contain a [[link]] to the given title. */
export function findBacklinks(
  title: string,
  notes: Array<{ id: string; title: string; content: string }>,
): Array<{ id: string; title: string }> {
  const pattern = new RegExp(`\\[\\[${escapeRegExp(title)}(?:\\|[^\\]]+)?\\]\\]`, "i");
  return notes
    .filter((n) => pattern.test(n.content))
    .map(({ id, title: t }) => ({ id, title: t }));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
