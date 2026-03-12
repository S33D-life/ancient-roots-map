/**
 * tree-og — Returns an HTML page with Open Graph meta tags for a specific tree.
 * Used for rich social media previews when sharing tree deep links.
 * 
 * Usage: GET /functions/v1/tree-og?id=<tree-uuid>
 * Returns: HTML with OG tags + redirect to the app's /tree/:id page
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const APP_URL = "https://ancient-roots-map.lovable.app";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const treeId = url.searchParams.get("id");

  if (!treeId) {
    return new Response("Missing tree id", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: tree } = await supabase
    .from("trees")
    .select("id, name, species, nation, latitude, longitude")
    .eq("id", treeId)
    .maybeSingle();

  if (!tree) {
    return new Response("Tree not found", { status: 404 });
  }

  // Try to get a photo from offerings
  const { data: photoOffering } = await supabase
    .from("offerings")
    .select("media_url")
    .eq("tree_id", treeId)
    .eq("type", "photo")
    .not("media_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const imageUrl = photoOffering?.media_url || `${APP_URL}/og/s33d-share-default.jpg`;
  const treeName = tree.name || "Ancient Friend";
  const species = tree.species || "Unknown species";
  const location = tree.nation || "Unknown location";
  const pageUrl = `${APP_URL}/tree/${tree.id}`;

  const title = `${treeName} — ${species}`;
  const description = `An Ancient Friend in ${location}. Visit this tree on the S33D Living Atlas.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="S33D.life — The Living Atlas of Ancient Friends">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:site" content="@s33dlife">
  
  <!-- Geo -->
  ${tree.latitude ? `<meta property="place:location:latitude" content="${tree.latitude}">` : ""}
  ${tree.longitude ? `<meta property="place:location:longitude" content="${tree.longitude}">` : ""}
  
  <!-- Redirect to app -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(treeName)}</a>…</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}