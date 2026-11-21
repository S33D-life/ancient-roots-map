/** Accept only the stored author/Grove object, never a caller-supplied path. */
export function privateObjectPath(mediaUrl: string | null, author: string, grove: string): string | null {
  if (!mediaUrl) return null;
  try {
    const url = new URL(mediaUrl);
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/offerings-private\/(.+)$/);
    if (!match) return null;
    const path = decodeURIComponent(match[1]);
    const parts = path.split('/');
    if (parts.length !== 3 || parts[0] !== author || parts[1] !== grove || !parts[2] || /[\\%\x00-\x1f]/.test(path) || parts.some(p => p === '.' || p === '..')) return null;
    return path;
  } catch { return null; }
}
