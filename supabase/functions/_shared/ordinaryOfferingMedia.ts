export interface MediaRecord {
  created_by: string | null;
  tree_id: string;
  media_url: string | null;
  photos: string[] | null;
  thumbnail_url: string | null;
}

export function registeredPrivatePath(reference: unknown, row: MediaRecord, projectUrl: string): string | null {
  if (typeof reference !== 'string' || !row.created_by) return null;
  if (![row.media_url, row.thumbnail_url, ...(row.photos ?? [])].includes(reference)) return null;
  try {
    if (/[\\\x00-\x20\x7f]/.test(reference)) return null;
    if (decodeURIComponent(reference).split('/').some(p => p === '.' || p === '..')) return null;
    const url = new URL(reference);
    const prefix = '/storage/v1/object/public/offerings-private/';
    if (url.origin !== new URL(projectUrl).origin || !url.pathname.startsWith(prefix) || url.search || url.hash) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (/[\\%\x00-\x1f\x7f]/.test(path)) return null;
    const parts = path.split('/');
    if (parts.length !== 3 || parts.some(p => !p || p === '.' || p === '..')) return null;
    // A malicious author must not turn their own row into a signing oracle for
    // someone else's private upload, even when they know its exact URL.
    return parts[0] === row.created_by && parts[1] === row.tree_id ? path : null;
  } catch { return null; }
}

export interface MediaAccess {
  authenticated(): Promise<boolean>;
  // Must use the actual caller's JWT and ordinary offerings RLS, never admin.
  read(id: string): Promise<{ row: MediaRecord | null; error?: unknown }>;
  sign(path: string, expires: number): Promise<string | null>;
}

export function ordinaryMediaHandler(access: MediaAccess, projectUrl: string) {
  const headers = {
    'Content-Type': 'application/json', 'Cache-Control': 'private, no-store',
    'Vary': 'Authorization', 'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers });
    if (req.method !== 'POST') return reply({ error: 'method not allowed' }, 405);
    try {
      if (!await access.authenticated()) return reply({ error: 'sign in required' }, 401);
      const body = await req.json().catch(() => null);
      if (typeof body?.offering_id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.offering_id)) return reply({ error: 'invalid request' }, 400);
      const { row, error } = await access.read(body.offering_id);
      if (error) return reply({ error: 'access check unavailable' }, 503);
      if (!row) return reply({ error: 'not found' }, 404);
      const path = registeredPrivatePath(body.reference, row, projectUrl);
      if (!path) return reply({ error: 'media not found' }, 404);
      const signed = await access.sign(path, 300);
      return signed ? reply({ url: signed, expires_in: 300 }) : reply({ error: 'media unavailable' }, 503);
    } catch { return reply({ error: 'request unavailable' }, 503); }
  };
}
