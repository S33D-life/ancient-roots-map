/**
 * PLANeTary Library · typed origin.
 *
 * The origin is navigation context, never authorization and never a URL.
 * Only `originType=ancient-friend` with a single well-formed UUID is accepted;
 * the return destination is always rebuilt from trusted internal routes.
 */
import { ROUTES } from "@/lib/routes";

export type LibraryOrigin = { type: "ancient-friend"; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ORIGIN_TYPE_PARAM = "originType";
export const ORIGIN_ID_PARAM = "originId";

/** Parse an origin from the query. Anything missing, repeated or malformed yields null. */
export function parseOrigin(params: URLSearchParams): LibraryOrigin | null {
  const types = params.getAll(ORIGIN_TYPE_PARAM);
  const ids = params.getAll(ORIGIN_ID_PARAM);
  if (types.length !== 1 || ids.length !== 1) return null;
  if (types[0] !== "ancient-friend") return null;
  const id = ids[0];
  if (!UUID.test(id)) return null;
  return { type: "ancient-friend", id: id.toLowerCase() };
}

/** Append the origin (and nothing else) to an internal Library path. */
export function withOrigin(path: string, origin: LibraryOrigin | null): string {
  if (!origin) return path;
  const q = new URLSearchParams({ [ORIGIN_TYPE_PARAM]: origin.type, [ORIGIN_ID_PARAM]: origin.id });
  return `${path}?${q.toString()}`;
}

/** The only two return destinations the Library can ever render. */
export function returnPathFor(origin: LibraryOrigin | null, available: boolean): string {
  return origin && available ? ROUTES.TREE(origin.id) : ROUTES.LIBRARY;
}
