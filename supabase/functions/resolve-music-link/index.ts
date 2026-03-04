/**
 * resolve-music-link — Resolves Spotify, YouTube, and Apple Music links
 * to normalized song metadata via oEmbed / iTunes APIs.
 * No API keys required — uses public endpoints.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResolvedSong {
  title: string;
  artist: string;
  album: string | null;
  artwork_url: string | null;
  preview_url: string | null;
  external_url: string;
  source: "spotify" | "youtube" | "apple_music";
}

// Rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

async function resolveSpotify(url: string): Promise<ResolvedSong | null> {
  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();

    // oEmbed title format: "Song Name - Artist Name" or just "Song Name"
    const titleParts = (data.title || "").split(" - ");
    const title = titleParts[0]?.trim() || data.title || "Unknown";
    const artist = titleParts[1]?.trim() || "";

    return {
      title,
      artist,
      album: null,
      artwork_url: data.thumbnail_url || null,
      preview_url: null, // Spotify oEmbed doesn't provide previews
      external_url: url,
      source: "spotify",
    };
  } catch {
    return null;
  }
}

async function resolveYouTube(url: string): Promise<ResolvedSong | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();

    // YouTube title often formatted as "Artist - Song" or "Song | Artist"
    const rawTitle = data.title || "Unknown";
    let title = rawTitle;
    let artist = data.author_name || "";

    const dashParts = rawTitle.split(" - ");
    if (dashParts.length === 2) {
      artist = dashParts[0].trim();
      title = dashParts[1]
        .replace(/\(.*?\)/g, "")
        .replace(/\[.*?\]/g, "")
        .trim();
    }

    return {
      title,
      artist,
      album: null,
      artwork_url: data.thumbnail_url || null,
      preview_url: null,
      external_url: url,
      source: "youtube",
    };
  } catch {
    return null;
  }
}

async function resolveAppleMusic(url: string): Promise<ResolvedSong | null> {
  try {
    // Extract track ID from URL
    const u = new URL(url);
    const iParam = u.searchParams.get("i");
    const segments = u.pathname.split("/").filter(Boolean);
    const lastSeg = segments[segments.length - 1];
    const trackId = (iParam && /^\d+$/.test(iParam)) ? iParam : (/^\d+$/.test(lastSeg || "") ? lastSeg : null);

    if (!trackId) return null;

    const res = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song`);
    if (!res.ok) { await res.text(); return null; }
    const data = await res.json();
    const track = data.results?.find((r: any) => r.wrapperType === "track");
    if (!track) return null;

    return {
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName || null,
      artwork_url: track.artworkUrl100 || null,
      preview_url: track.previewUrl || null,
      external_url: track.trackViewUrl || url,
      source: "apple_music",
    };
  } catch {
    return null;
  }
}

function detectPlatform(url: string): "spotify" | "youtube" | "apple_music" | null {
  if (/open\.spotify\.com|spotify\.link/i.test(url)) return "spotify";
  if (/youtube\.com|youtu\.be|music\.youtube\.com/i.test(url)) return "youtube";
  if (/music\.apple\.com|itunes\.apple\.com/i.test(url)) return "apple_music";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || url.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strict protocol + structure validation
    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return new Response(JSON.stringify({ error: "Invalid protocol — only http/https allowed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Malformed URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip, 20, 60_000)) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return new Response(
        JSON.stringify({ error: "Unsupported platform. Paste a Spotify, YouTube, or Apple Music link." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: ResolvedSong | null = null;
    if (platform === "spotify") result = await resolveSpotify(url);
    else if (platform === "youtube") result = await resolveYouTube(url);
    else if (platform === "apple_music") result = await resolveAppleMusic(url);

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Could not resolve song metadata from this link." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
