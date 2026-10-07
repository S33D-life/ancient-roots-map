import { describe, expect, it } from "vitest";
import { getAgentInstallCommand, getAgentMcpUrl, getAgentServerName } from "../lib/agent-connection";

describe("agent connection details", () => {
  it("preserves browser-reachable base paths", () => {
    expect(getAgentMcpUrl("https://example.com/backend/", undefined)).toBe("https://example.com/backend/functions/v1/mcp");
    expect(getAgentMcpUrl("https://c--example.lovable.cloud/", "example")).toBe("https://c--example.lovable.cloud/functions/v1/mcp");
  });
  it("uses the legacy data-plane origin only for legacy Cloud URLs", () => {
    expect(getAgentMcpUrl("https://example.lovable.cloud/", "example")).toBe("https://example.supabase.co/functions/v1/mcp");
    expect(() => getAgentMcpUrl("https://example.lovable.cloud", undefined)).toThrow();
  });
  it("allows HTTP only on loopback hosts", () => {
    for (const host of ["localhost:8080", "127.0.0.1:54321", "[::1]:54321"]) {
      expect(getAgentMcpUrl(`http://${host}`, undefined)).toContain("/functions/v1/mcp");
    }
    for (const url of [undefined, "http://example.com", "https://user@example.com", "https://example.com?x=1", "https://example.com#x", "ftp://localhost", "http://localhost.evil.com"]) {
      expect(() => getAgentMcpUrl(url, undefined)).toThrow();
    }
  });
  it("creates safe non-reserved names", () => {
    expect(getAgentServerName("S33D")).toBe("s33d");
    expect(getAgentServerName("Éarth & Roots")).toBe("earth-roots");
    expect(getAgentServerName("workspace")).toBe("workspace-app");
    expect(getAgentServerName("🌳")).toBe("lovable-app");
    expect(getAgentServerName("a".repeat(100))).toHaveLength(63);
  });
  it("quotes the URL as one shell argument", () => {
    expect(getAgentInstallCommand("S33D", "https://example.com/mcp")).toBe("claude mcp add --scope user --transport http s33d 'https://example.com/mcp'");
    expect(getAgentInstallCommand("S33D", "https://example.com/it's")).toContain("'https://example.com/it'\\''s'");
  });
});
