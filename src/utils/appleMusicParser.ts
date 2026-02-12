/**
 * Apple Music URL/Text Parser
 * Extracts Apple Music links, track IDs, and metadata from arbitrary text.
 */

export interface AppleMusicParseResult {
  url: string | null;
  trackId: string | null;
  title: string | null;
  artist: string | null;
  raw: string;
  confidence: "high" | "medium" | "low";
  errors: string[];
}

// Known tracking params safe to strip
const TRACKING_PARAMS = ["ls", "app", "at", "ct", "mt", "pt", "uo", "itscg", "itsct", "referrer"];

// Regional variants: music.apple.com/xx/...
const APPLE_MUSIC_REGEX =
  /https?:\/\/music\.apple\.com\/[a-z]{2}\/(?:album|song|playlist|station|artist)\/[^\s"'<>)}\]]+/gi;

// Fallback: itunes.apple.com links that redirect to Apple Music
const ITUNES_REGEX =
  /https?:\/\/itunes\.apple\.com\/[a-z]{2}\/(?:album|song)\/[^\s"'<>)}\]]+/gi;

function stripTrackingParams(url: string): string {
  try {
    const u = new URL(url);
    TRACKING_PARAMS.forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

function extractTrackId(url: string): string | null {
  // Pattern: .../album/name/123456?i=789012 → track id is the `i` param
  // Pattern: .../song/name/123456 → track id is the last numeric segment
  try {
    const u = new URL(url);
    const iParam = u.searchParams.get("i");
    if (iParam && /^\d+$/.test(iParam)) return iParam;

    // Last path segment if numeric
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /^\d+$/.test(last)) return last;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Attempt to parse title/artist from surrounding text.
 * Only returns values if they look plausible (not invented).
 * Common Apple Music share format: "Song Title by Artist Name\nhttps://music.apple.com/..."
 */
function extractMetadata(raw: string, url: string | null): { title: string | null; artist: string | null } {
  if (!url) return { title: null, artist: null };

  // Remove the URL from text to analyze remaining content
  const textWithoutUrl = raw.replace(url, "").trim();
  if (!textWithoutUrl || textWithoutUrl.length < 3) return { title: null, artist: null };

  // Pattern: "Title" by Artist  or  Title — Artist  or  Title - Artist
  const byMatch = textWithoutUrl.match(/^[""]?(.+?)[""]?\s+(?:by|—|–|[-])\s+(.+?)$/im);
  if (byMatch) {
    const title = byMatch[1].trim().replace(/^[""]|[""]$/g, "");
    const artist = byMatch[2].trim().replace(/\s*\n.*/s, ""); // stop at newline
    if (title.length > 0 && title.length < 200 && artist.length > 0 && artist.length < 200) {
      return { title, artist };
    }
  }

  // Pattern: "Listen to Title by Artist on Apple Music"
  const listenMatch = textWithoutUrl.match(
    /listen\s+to\s+[""]?(.+?)[""]?\s+by\s+(.+?)\s+on\s+apple\s*music/i
  );
  if (listenMatch) {
    return {
      title: listenMatch[1].trim(),
      artist: listenMatch[2].trim(),
    };
  }

  return { title: null, artist: null };
}

export function parseAppleMusicInput(input: string): AppleMusicParseResult {
  const raw = input.trim();
  const errors: string[] = [];

  if (!raw) {
    return { url: null, trackId: null, title: null, artist: null, raw, confidence: "low", errors: ["Empty input"] };
  }

  // 1. Find all Apple Music URLs
  const appleMatches = raw.match(APPLE_MUSIC_REGEX) || [];
  const itunesMatches = raw.match(ITUNES_REGEX) || [];
  const allUrls = [...appleMatches, ...itunesMatches];

  if (allUrls.length === 0) {
    // Check if there's any URL at all
    const anyUrl = raw.match(/https?:\/\/[^\s"'<>)}\]]+/gi);
    if (anyUrl && anyUrl.length > 0) {
      errors.push("URL found but not an Apple Music link");
      return { url: anyUrl[0], trackId: null, title: null, artist: null, raw, confidence: "low", errors };
    }
    errors.push("No URL found in input");
    return { url: null, trackId: null, title: null, artist: null, raw, confidence: "low", errors };
  }

  if (allUrls.length > 1) {
    errors.push(`Multiple URLs found (${allUrls.length}), using first Apple Music match`);
  }

  // Prefer music.apple.com over itunes
  const bestUrl = appleMatches[0] || itunesMatches[0];
  const cleanUrl = stripTrackingParams(bestUrl);
  const trackId = extractTrackId(cleanUrl);
  const { title, artist } = extractMetadata(raw, bestUrl);

  // Determine confidence
  let confidence: "high" | "medium" | "low" = "low";
  if (cleanUrl && trackId) {
    confidence = title && artist ? "high" : "medium";
  } else if (cleanUrl) {
    confidence = "medium";
  }

  return { url: cleanUrl, trackId, title, artist, raw, confidence, errors };
}
