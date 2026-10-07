/** Public connection details only; never access credentials or probe the server. */
export function getAgentMcpUrl(configuredUrl: string | undefined, projectId: string | undefined): string {
  if (!configuredUrl) throw new Error("The connection address is not configured.");
  const url = new URL(configuredUrl);
  const authority = configuredUrl.match(/^https?:\/\/([^/?#]*)/i)?.[1];
  const loopback = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(authority ?? "");
  if (!authority || authority.includes("@") || configuredUrl.includes("?") || configuredUrl.includes("#") ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))) {
    throw new Error("The connection address must use HTTPS, except on localhost, and cannot contain credentials, a query, or a fragment.");
  }
  const legacyCloud = url.hostname.endsWith(".lovable.cloud") && !url.hostname.startsWith("c--");
  if (legacyCloud && (!projectId || !/^[a-z0-9-]+$/.test(projectId))) {
    throw new Error("The connection address is not configured.");
  }
  const base = legacyCloud ? `https://${projectId}.supabase.co` : url.toString().replace(/\/+$/, "");
  return `${base}/functions/v1/mcp`;
}

export function getAgentServerName(appName: string): string {
  const slug = appName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 63).replace(/-+$/, "") || "lovable-app";
  return ["workspace", "computer-use", "claude-in-chrome", "claude-preview", "claude-browser"].includes(slug)
    ? `${slug}-app` : slug;
}

export function getAgentInstallCommand(appName: string, url: string): string {
  const quotedUrl = `'${url.replace(/'/g, "'\\''")}'`;
  return `claude mcp add --scope user --transport http ${getAgentServerName(appName)} ${quotedUrl}`;
}