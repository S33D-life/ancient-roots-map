/**
 * YouTube URL parser — extracts video ID, embed URL, and thumbnail
 * from common YouTube link formats.
 */

export interface YouTubeParsed {
  videoId: string | null;
  embedUrl: string | null;
  thumbnail: string | null;
}

const YT_PATTERNS = [
  // https://www.youtube.com/watch?v=VIDEO_ID
  /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/,
  // https://youtu.be/VIDEO_ID
  /(?:youtu\.be\/)([\w-]{11})/,
  // https://youtube.com/embed/VIDEO_ID
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  // https://music.youtube.com/watch?v=VIDEO_ID
  /(?:music\.youtube\.com\/watch\?.*v=)([\w-]{11})/,
  // https://youtube.com/shorts/VIDEO_ID
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
];

/**
 * Parse a YouTube URL and return structured metadata.
 * Returns nulls if the URL is not a valid YouTube link.
 */
export function parseYouTubeUrl(url: string): YouTubeParsed {
  const nullResult: YouTubeParsed = { videoId: null, embedUrl: null, thumbnail: null };

  if (!url || typeof url !== "string") return nullResult;

  const trimmed = url.trim();
  if (!trimmed) return nullResult;

  for (const pattern of YT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const videoId = match[1];
      return {
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  }

  return nullResult;
}

/**
 * Quick check if a string looks like a YouTube URL.
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i.test(url);
}
