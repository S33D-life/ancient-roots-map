import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1Kfud8f85FTHIXY6KKeygubIGosKGQTggupqIZmfzT7w/export?format=csv&gid=1465196549";

const CHAPTER_REGION: Record<string, string> = {
  "1": "Scotland — Highlands & Islands",
  "2": "Scotland — East & Edinburgh",
  "3": "Scotland — West & Glasgow",
  "4": "Northern England & Lake District",
  "5": "North West England",
  "6": "Yorkshire & Humber",
  "7": "East Midlands",
  "8": "West Midlands",
  "9": "East of England",
  "10": "South West England",
  "11": "South East England",
  "12": "London",
  "13": "Wales",
  "14": "Northern Ireland",
  "15": "Ireland",
};

function parseCoords(raw: string): { lat: number | null; lng: number | null; w3w: string | null } {
  if (!raw) return { lat: null, lng: null, w3w: null };
  // Format: "///word.word.word\n55.123, -1.456" or just coords
  let w3w: string | null = null;
  const w3wMatch = raw.match(/(\/\/\/[\w]+\.[\w]+\.[\w]+)/);
  if (w3wMatch) w3w = w3wMatch[1];

  const coordMatch = raw.match(/([-\d.]+),\s*([-\d.]+)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, w3w };
    }
  }
  return { lat: null, lng: null, w3w };
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Delete previous import if re-running
  await supabase.from("research_trees").delete().eq("source_program", "Paul Wood — Tree Hunting");

  // Fetch CSV
  const csvRes = await fetch(SHEET_CSV_URL);
  if (!csvRes.ok) {
    return new Response(JSON.stringify({ error: "Failed to fetch CSV" }), { status: 502 });
  }
  const csvText = await csvRes.text();

  // Parse CSV properly handling multi-line quoted fields
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (ch === '"') {
      if (inQuotes && csvText[i + 1] === '"') { field += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      current.push(field.trim());
      field = "";
    } else if (ch === '\n' && !inQuotes) {
      current.push(field.trim());
      if (current.length > 1) rows.push(current);
      current = [];
      field = "";
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }
  if (current.length > 1) { current.push(field.trim()); rows.push(current); }

  // Skip header
  const dataRows = rows.slice(1);

  const SOURCE_DOC_URL =
    "https://docs.google.com/spreadsheets/d/1Kfud8f85FTHIXY6KKeygubIGosKGQTggupqIZmfzT7w/edit?gid=1465196549#gid=1465196549";

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process in batches of 50
  const batch: any[] = [];

  for (const cols of dataRows) {
    const bookNum = cols[0];
    const chapter = cols[1];
    const town = cols[2];
    const treeName = cols[3];
    const commonName = cols[4];
    const botanicalName = cols[5];
    const address = cols[6];
    const coordsRaw = cols[7];
    const notes = cols[8];

    if (!bookNum || !botanicalName || isNaN(parseInt(bookNum))) {
      skipped++;
      continue;
    }

    const { lat, lng, w3w } = parseCoords(coordsRaw);
    const province = CHAPTER_REGION[chapter] || (chapter ? `Chapter ${chapter}` : null);
    const locality = [address, town].filter(Boolean).join(", ");

    const description = [
      notes ? notes : null,
      w3w ? `What3Words: ${w3w}` : null,
      `Book #${bookNum}`,
    ]
      .filter(Boolean)
      .join(" · ");

    batch.push({
      country: "United Kingdom",
      source_program: "Paul Wood — Tree Hunting",
      source_doc_title: "Tree Hunting: 1,000 Trees to Find in Britain and Ireland's Towns and Cities",
      source_doc_url: SOURCE_DOC_URL,
      source_doc_year: 2025,
      source_row_ref: `#${bookNum}`,
      species_scientific: botanicalName,
      species_common: commonName || null,
      tree_name: treeName || null,
      description: description || null,
      locality_text: locality || town || "United Kingdom",
      province,
      latitude: lat,
      longitude: lng,
      geo_precision: lat ? "exact" : "unknown",
      designation_type: "Street Tree",
      status: "research",
    });
  }

  // Check if already imported
  const { count: existing } = await supabase
    .from("research_trees")
    .select("id", { count: "exact", head: true })
    .eq("source_program", "Paul Wood — Tree Hunting");

  if (existing && existing > 0) {
    return new Response(
      JSON.stringify({ message: `Already imported. ${existing} records exist.`, total_parsed: batch.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Insert in chunks
  const CHUNK = 100;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    const { error } = await supabase.from("research_trees").insert(chunk);

    if (error) {
      errors.push(`Chunk ${i}: ${error.message}`);
    } else {
      inserted += chunk.length;
    }
  }

  return new Response(
    JSON.stringify({
      total_parsed: batch.length,
      inserted,
      skipped,
      errors,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
