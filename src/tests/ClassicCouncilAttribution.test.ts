import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Digests identify the reviewed disclosure without repeating private names in source or failures.
const restrictedAttribution = new Set(["8535e86c8118bbbb0a18ac72d15d3a2b37b18d1bce1611fc60165f322cf57386", "f96cf6a1d9a1b55845e066252db1801f019ac57d3270001ac046a492216b154c"]);
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const fingerprintCache = new Map<string, string>();
function containsRestrictedAttribution(source: string, denied = restrictedAttribution) {
  const decoded = source.replace(/\\u([a-f0-9]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\x([a-f0-9]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return (decoded.match(/\p{L}+/gu) ?? []).some(word => {
    const lower = word.toLowerCase();
    let hash = fingerprintCache.get(lower);
    if (!hash) { hash = digest(lower); fingerprintCache.set(lower, hash); }
    return denied.has(hash);
  });
}
function textFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? textFiles(path) : /\.(?:js|json|html|md|txt|svg)$/i.test(path) ? [path] : [];
  });
}
describe("public classic Council attribution boundary", () => {
  it("omits the reviewed private attribution from every public script and historical presentation", () => {
    const paths = [...textFiles("public"), "docs/council/Circle-235-release.md", "docs/council/Current-Circle-Council-Deck-candidate.md", "docs/council/Circle-235-Telegram-invitation.md", "supabase/functions/_shared/currentCircle.ts", "supabase/functions/mcp/index.ts"];
    // Only paths are reported on failure, never matched private text.
    expect(paths.filter(path => containsRestrictedAttribution(readFileSync(path, "utf8")))).toEqual([]);
  });
  it("recognises case variants, escaped strings and private identifier keys", () => {
    const denied = new Set([digest("fictional")]);
    for (const fixture of ["FICTIONAL", String.raw`\u0046ictional`, String.raw`\x46ictional`, "words_fictional"]) {
      expect(containsRestrictedAttribution(fixture, denied)).toBe(true);
    }
    expect(containsRestrictedAttribution("Council participants", denied)).toBe(false);
  });
  it("retains the historical Circle and its public companion identities with neutral credit", () => {
    const source = readFileSync("public/tetol/circle-235/pre-fire/runtime/classic-2.js", "utf8");
    const line = source.split("\n").find(value => value.startsWith("window.S33D_COUNCIL = "))!;
    const council = JSON.parse(line.slice("window.S33D_COUNCIL = ".length).replace(/;$/, ""));
    expect(council.circles[235].provenance.chosen_by).toBe("Council (companions)");
    expect(council.circles[235].ancient_friend.encounter.who).toEqual([]);
    expect(council.circles[235].ancient_friend.s33d_id).toBe("924453c0-f4f5-4ed4-88fe-5b2ed6570af0");
    expect(digest(JSON.stringify(council.circles[234]))).toBe("a365a21919fd001a07fb3b5800d5e9230a66f964a79b50e26ad0e8036a5e426c");
    expect(digest(JSON.stringify(council.circles[233]))).toBe("4b59a16c37b84108d1f97ee6e8138d2441ba432fed36392c8d4d37e26a62406b");
    expect(council.circles[235].central_question).toEqual({"decides": "TEOTAG, after the Holm Oak encounter", "final": null, "held": [{"status": "PROPOSAL", "text": "What changes when we grow up, and what do we keep?"}, {"status": "PROPOSAL", "text": "Who carries life between us, through the air and under the ground?"}], "label": "The Circle\u2019s question", "label_when_approved": "The Circle's question", "status": "TEOTAG APPROVED", "text": null});
  });
});
