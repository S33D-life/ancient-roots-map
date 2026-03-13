import { useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type RawRecord = Record<string, string>;

type NormalizedRootstone = {
  id: string;
  name: string;
  type: "tree" | "grove";
  country: string;
  region?: string;
  species?: string;
  location: { lat?: number; lng?: number; place?: string; mapsUrl?: string };
  bounds?: { north: number; south: number; east: number; west: number };
  lore: string;
  source: { name: string; url: string };
  confidence: "high" | "medium" | "low";
  tags: string[];
};

const ALLOWED_TYPES = new Set(["tree", "grove"]);
const ALLOWED_CONFIDENCE = new Set(["high", "medium", "low"]);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseCsv = (text: string): RawRecord[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim().length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  if (row.some((v) => v.trim().length > 0)) rows.push(row);

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const record: RawRecord = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? "").trim();
    });
    return record;
  });
};

const parseJson = (text: string): RawRecord[] => {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed as RawRecord[];
  if (Array.isArray(parsed.rootstones)) return parsed.rootstones as RawRecord[];
  return [];
};

const toNum = (value?: string) => {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeTags = (input: string) =>
  input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, idx, all) => all.indexOf(tag) === idx);

const normalizeRows = (rows: RawRecord[]) => {
  const warnings: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  const normalized: NormalizedRootstone[] = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;
    const name = String(row.name || "").trim();
    const type = String(row.type || "").trim().toLowerCase() as "tree" | "grove";
    const country = String(row.country || "").trim();
    const confidence = String(row.confidence || "").trim().toLowerCase() as "high" | "medium" | "low";

    if (!name || !country || !type || !confidence) {
      errors.push(`line ${line}: missing required fields`);
      return;
    }
    if (!ALLOWED_TYPES.has(type)) {
      errors.push(`line ${line}: invalid type ${type}`);
      return;
    }
    if (!ALLOWED_CONFIDENCE.has(confidence)) {
      errors.push(`line ${line}: invalid confidence ${confidence}`);
      return;
    }

    const sourceName = String(row.source_name || "").trim();
    const sourceUrl = String(row.source_url || "").trim();
    if (!sourceUrl) {
      errors.push(`line ${line}: missing source_url`);
      return;
    }

    const lat = toNum(row.lat);
    const lng = toNum(row.lng);
    const place = String(row.place || "").trim() || undefined;
    const mapsUrl = String(row.mapsUrl || "").trim() || undefined;
    if (!(lat != null && lng != null) && !place && !mapsUrl) {
      errors.push(`line ${line}: include coords or place/mapsUrl`);
      return;
    }

    const id = String(row.id || "").trim() || `${slugify(country)}-${type}-${slugify(name)}`;
    if (seen.has(id)) {
      warnings.push(`line ${line}: duplicate id skipped (${id})`);
      return;
    }

    const tags = normalizeTags(String(row.tags || ""));
    if (!(lat != null && lng != null) && !tags.includes("needs_coords")) {
      tags.push("needs_coords");
      warnings.push(`line ${line}: missing coords; added needs_coords`);
    }

    const north = toNum(row.bounds_north);
    const south = toNum(row.bounds_south);
    const east = toNum(row.bounds_east);
    const west = toNum(row.bounds_west);

    normalized.push({
      id,
      name,
      type,
      country,
      region: String(row.region || "").trim() || undefined,
      species: String(row.species || "").trim() || undefined,
      location: { lat, lng, place, mapsUrl },
      bounds:
        [north, south, east, west].every((v) => v != null)
          ? { north: north!, south: south!, east: east!, west: west! }
          : undefined,
      lore: String(row.lore || "").trim(),
      source: { name: sourceName, url: sourceUrl },
      confidence,
      tags,
    });
    seen.add(id);
  });

  return { normalized, warnings, errors };
};

const RootstoneImporterPage = () => {
  const [rawRows, setRawRows] = useState<RawRecord[]>([]);
  const [filename, setFilename] = useState("");

  const { normalized, warnings, errors } = useMemo(() => normalizeRows(rawRows), [rawRows]);

  const onFile = async (file: File) => {
    const text = await file.text();
    const rows = file.name.endsWith(".json") ? parseJson(text) : parseCsv(text);
    setRawRows(rows);
    setFilename(file.name);
  };

  const exportJson = () => {
    const byCountry = normalized.reduce<Record<string, NormalizedRootstone[]>>((acc, item) => {
      const key = slugify(item.country);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    const blob = new Blob([JSON.stringify(byCountry, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rootstones.normalized.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pt-16 pb-24 px-4 max-w-5xl mx-auto space-y-4">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Curator Rootstone Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            {filename && <p className="text-xs text-muted-foreground">Loaded: {filename}</p>}
            <div className="flex gap-2">
              <Badge variant="outline">Rows: {rawRows.length}</Badge>
              <Badge variant="outline">Valid: {normalized.length}</Badge>
              <Badge variant="outline">Warnings: {warnings.length}</Badge>
              <Badge variant="outline">Errors: {errors.length}</Badge>
            </div>
            <Button variant="sacred" onClick={exportJson} disabled={normalized.length === 0}>
              Export normalized JSON
            </Button>
          </CardContent>
        </Card>

        {(warnings.length > 0 || errors.length > 0) && (
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-serif">Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {errors.map((error) => <p key={error} className="text-destructive">{error}</p>)}
              {warnings.map((warning) => <p key={warning} className="text-muted-foreground">{warning}</p>)}
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-serif">Preview (first 50)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Country</th>
                  <th className="py-2 pr-2">Region</th>
                  <th className="py-2 pr-2">Coords</th>
                  <th className="py-2 pr-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {normalized.slice(0, 50).map((row) => (
                  <tr key={row.id} className="border-t border-border/30">
                    <td className="py-2 pr-2">{row.name}</td>
                    <td className="py-2 pr-2">{row.type}</td>
                    <td className="py-2 pr-2">{row.country}</td>
                    <td className="py-2 pr-2">{row.region || "—"}</td>
                    <td className="py-2 pr-2">
                      {row.location.lat != null && row.location.lng != null
                        ? `${row.location.lat}, ${row.location.lng}`
                        : row.location.place || "—"}
                    </td>
                    <td className="py-2 pr-2">{row.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      
    </PageShell>
  );
};

export default RootstoneImporterPage;
