import { supabase } from "@/integrations/supabase/client";

export type MycelialNodeType = "tree" | "user" | "grove" | "country" | "staff";
export type MycelialEdgeKind =
  | "whisper"
  | "offering"
  | "visit"
  | "seed"
  | "book"
  | "council"
  | "staff_mint";

export interface MycelialPoint {
  lat: number;
  lng: number;
}

export interface UpsertMycelialEdgeInput {
  fromType: MycelialNodeType;
  fromId: string;
  toType: MycelialNodeType;
  toId: string;
  edgeKind: MycelialEdgeKind;
  weight?: number;
  metadata?: Record<string, unknown>;
  lastSeenAt?: string;
}

export interface MycelialConnection {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  edgeKind: MycelialEdgeKind;
  fromType: MycelialNodeType;
  fromId: string;
  toType: MycelialNodeType;
  toId: string;
  weight: number;
  metadata: Record<string, unknown>;
  from: MycelialPoint;
  to: MycelialPoint;
}

type RawMycelialEdge = {
  id: string;
  created_at: string;
  last_seen_at: string;
  from_type: MycelialNodeType;
  from_id: string;
  to_type: MycelialNodeType;
  to_id: string;
  edge_kind: MycelialEdgeKind;
  weight: number;
  metadata: Record<string, unknown> | null;
};

type TreeCoordRow = { id: string; latitude: number | null; longitude: number | null };

const MAX_QUERY_LIMIT = 400;

function parseMetadataPoint(metadata: Record<string, unknown>, key: "from" | "to"): MycelialPoint | null {
  const direct = metadata[key];
  if (direct && typeof direct === "object") {
    const point = direct as { lat?: unknown; lng?: unknown };
    if (typeof point.lat === "number" && typeof point.lng === "number") {
      return { lat: point.lat, lng: point.lng };
    }
  }

  const latKey = `${key}_lat`;
  const lngKey = `${key}_lng`;
  const lat = metadata[latKey];
  const lng = metadata[lngKey];
  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }
  return null;
}

function scoreByWeightAndRecency(weight: number, lastSeenAt: string, nowMs = Date.now()) {
  const ageMs = Math.max(0, nowMs - new Date(lastSeenAt).getTime());
  const ageHours = ageMs / (1000 * 60 * 60);
  const recencyBoost = 1 / (1 + ageHours / 36);
  return weight * 3 + recencyBoost;
}

export function rankConnectionsForViewport<T extends Pick<MycelialConnection, "from" | "to" | "weight" | "lastSeenAt">>(
  connections: T[],
  contains: (point: MycelialPoint) => boolean,
  limit = 150,
) {
  const inView = connections.filter((connection) => contains(connection.from) || contains(connection.to));
  return inView
    .sort((a, b) => scoreByWeightAndRecency(b.weight, b.lastSeenAt) - scoreByWeightAndRecency(a.weight, a.lastSeenAt))
    .slice(0, limit);
}

export async function upsertMycelialEdge(input: UpsertMycelialEdgeInput) {
  const payload = {
    p_from_type: input.fromType,
    p_from_id: input.fromId,
    p_to_type: input.toType,
    p_to_id: input.toId,
    p_edge_kind: input.edgeKind,
    p_weight: Math.max(1, Math.floor(input.weight ?? 1)),
    p_metadata: input.metadata ?? {},
    p_last_seen_at: input.lastSeenAt ?? new Date().toISOString(),
  };
  const { data, error } = await supabase.rpc("upsert_mycelial_edge" as any, payload as any);
  return { data, error };
}

export async function fetchRecentMycelialConnections(limit = 240): Promise<MycelialConnection[]> {
  const safeLimit = Math.max(1, Math.min(limit, MAX_QUERY_LIMIT));
  const { data, error } = await (supabase.from("mycelial_edges") as any)
    .select("id, created_at, last_seen_at, from_type, from_id, to_type, to_id, edge_kind, weight, metadata")
    .order("last_seen_at", { ascending: false })
    .limit(safeLimit);

  if (error || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const rows = data as RawMycelialEdge[];
  const treeIds = new Set<string>();
  rows.forEach((row) => {
    if (row.from_type === "tree") treeIds.add(row.from_id);
    if (row.to_type === "tree") treeIds.add(row.to_id);
  });

  const treeMap = new Map<string, MycelialPoint>();
  if (treeIds.size > 0) {
    const { data: trees } = await supabase
      .from("trees")
      .select("id, latitude, longitude")
      .in("id", Array.from(treeIds));

    (trees as TreeCoordRow[] | null)?.forEach((tree) => {
      if (tree.latitude == null || tree.longitude == null) return;
      treeMap.set(tree.id, { lat: tree.latitude, lng: tree.longitude });
    });
  }

  return rows
    .map((row) => {
      const metadata = row.metadata ?? {};
      const from =
        (row.from_type === "tree" ? treeMap.get(row.from_id) : undefined) ||
        parseMetadataPoint(metadata, "from") ||
        null;
      const to =
        (row.to_type === "tree" ? treeMap.get(row.to_id) : undefined) ||
        parseMetadataPoint(metadata, "to") ||
        null;

      if (!from || !to) return null;

      return {
        id: row.id,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        edgeKind: row.edge_kind,
        fromType: row.from_type,
        fromId: row.from_id,
        toType: row.to_type,
        toId: row.to_id,
        weight: Math.max(1, Number(row.weight || 1)),
        metadata,
        from,
        to,
      } satisfies MycelialConnection;
    })
    .filter((row): row is MycelialConnection => row !== null);
}
