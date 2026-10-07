import { describe, it, expect, vi } from "vitest";
import { CURRENT_CIRCLE, approvedCircleUrl } from "../../supabase/functions/_shared/currentCircle";
import { councilPublishing, renderCouncilInvite, type CouncilPreview, type PublishingDependencies } from "../../supabase/functions/_shared/councilPublishing";
import { CIRCLE_235_DOORWAY } from "@/data/council/circle235Doorway";
function fixture() {
  const rows = new Map<string, CouncilPreview>();
  const claimed = new Set<string>();
  const deps: PublishingDependencies = {
    savePreview: vi.fn(async (chat, payload, revision) => {
      const row = { id: "preview-1", created_at: new Date().toISOString(), chat_id: chat, message_text: payload.text, status: "pending", metadata: { revision, payload } };
      rows.set(row.id, row); return row;
    }),
    loadPreview: vi.fn(async id => rows.get(id) ?? null),
    claimPreview: vi.fn(async id => { if (claimed.has(id)) return false; claimed.add(id); return true; }),
    send: vi.fn(async () => ({ ok: true, message_id: 123 })),
    finish: vi.fn(async () => {}),
  };
  return { deps, rows };
}
describe("approved Current Circle publishing", () => {
  it("shares accepted public wording with the app adapter", () => {
    const payload = renderCouncilInvite();
    expect(CIRCLE_235_DOORWAY.question).toBe(CURRENT_CIRCLE.question);
    expect(payload.text).toContain(CURRENT_CIRCLE.openLine);
    expect(payload.text).toContain(CURRENT_CIRCLE.question);
    expect(payload.text).toContain(CURRENT_CIRCLE.peopleSeat);
    expect(payload.text).toContain(CURRENT_CIRCLE.safety);
    expect(CURRENT_CIRCLE.companions).toHaveLength(6);
    CURRENT_CIRCLE.companions.forEach(name => expect(payload.text).toContain(name));
    expect(payload.text).not.toMatch(/Tuesday|6 October|May|localhost/);
    expect(payload.reply_markup.inline_keyboard).toEqual([[{ text: "🌿 Enter Council", url: CURRENT_CIRCLE.links.council.url }]]);
  });
  it.each(["http://www.s33d.life", "https://localhost", "https://127.0.0.1", "https://private.example", "https://user:pass@www.s33d.life", "https://www.s33d.life:444", "javascript:alert(1)"])("omits unsafe URL %s", url => {
    expect(approvedCircleUrl({ url, approved: true })).toBeUndefined();
  });
  it("omits unapproved links and rejects draft projection", () => {
    expect(approvedCircleUrl({ url: CURRENT_CIRCLE.links.council.url, approved: false })).toBeUndefined();
    expect(() => renderCouncilInvite({ ...CURRENT_CIRCLE, approval: "draft" })).toThrow();
  });
  it("escapes Telegram HTML and permits all five explicitly approved destinations", () => {
    const payload = renderCouncilInvite({ ...CURRENT_CIRCLE, title: '<b>&"', links: {
      ...CURRENT_CIRCLE.links, fire: { url: "https://meet.google.com/abc-defg-hij", approved: true },
      guide: CURRENT_CIRCLE.links.council, images: CURRENT_CIRCLE.links.council, livingRecord: CURRENT_CIRCLE.links.council,
    } });
    expect(payload.text).toContain("&lt;b&gt;&amp;&quot;");
    expect(payload.reply_markup.inline_keyboard).toHaveLength(5);
  });
  it("preview without approved private destination never sends or writes", async () => {
    const { deps } = fixture();
    const result = await councilPublishing({ action: "preview" }, undefined, deps);
    expect(result).toMatchObject({ mode: "preview", publish_available: false });
    expect(deps.send).not.toHaveBeenCalled(); expect(deps.savePreview).not.toHaveBeenCalled();
  });
  it("preview then explicit publish records message_id once, against mocked private destination", async () => {
    const { deps } = fixture();
    await councilPublishing({ action: "preview" }, "123456", deps);
    expect(deps.send).not.toHaveBeenCalled();
    const req = { action: "publish", preview_id: "preview-1", confirm: true };
    expect(await councilPublishing(req, "123456", deps)).toEqual({ ok: true, message_id: 123 });
    expect(deps.finish).toHaveBeenCalledWith("preview-1", { ok: true, message_id: 123 });
    await expect(councilPublishing(req, "123456", deps)).rejects.toThrow("already claimed");
    expect(deps.send).toHaveBeenCalledTimes(1);
  });
  it.each([undefined, "-100123", "@publicChannel"])("rejects publish destination %s", async chat => {
    const { deps } = fixture();
    await expect(councilPublishing({ action: "publish", preview_id: "preview-1", confirm: true }, chat, deps)).rejects.toThrow();
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("rejects absent explicit confirmation and missing or changed previews", async () => {
    const { deps, rows } = fixture();
    await expect(councilPublishing({ action: "publish" }, "123456", deps)).rejects.toThrow();
    const req = { action: "publish", preview_id: "preview-1", confirm: true };
    await expect(councilPublishing(req, "123456", deps)).rejects.toThrow();
    await councilPublishing({ action: "preview" }, "123456", deps);
    rows.get("preview-1")!.message_text = "Unapproved edit";
    await expect(councilPublishing(req, "123456", deps)).rejects.toThrow();
    expect(deps.send).not.toHaveBeenCalled();
  });
  it("records uncertain gateway failure and prevents automatic resend", async () => {
    const { deps } = fixture(); vi.mocked(deps.send).mockRejectedValue(new Error("network"));
    await councilPublishing({ action: "preview" }, "123456", deps);
    const req = { action: "publish", preview_id: "preview-1", confirm: true };
    expect(await councilPublishing(req, "123456", deps)).toMatchObject({ ok: false });
    expect(deps.finish).toHaveBeenCalledWith("preview-1", expect.objectContaining({ ok: false }));
    await expect(councilPublishing(req, "123456", deps)).rejects.toThrow("already claimed");
  });
});

// Exercise the real edge handler with isolated environment/DB/gateway doubles.
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
function edgeHarness(rotated = false) {
  let handler: (r: Request) => Promise<Response>;
  const gateway = vi.fn();
  const source = readFileSync(`${process.cwd()}/supabase/functions/telegram-notify/index.ts`, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const env: Record<string, string> = { INTERNAL_FUNCTION_SECRET: "test-internal", SUPABASE_URL: "https://db.test.invalid", SUPABASE_SERVICE_ROLE_KEY: "test-server", ...(rotated ? { TELEGRAM_EXPOSED_CREDENTIALS_ROTATED: "true" } : {}) };
  runInNewContext(code, {
    exports: {}, Request, Response, console, fetch: gateway,
    Deno: { env: { get: (k: string) => env[k] }, serve: (fn: typeof handler) => { handler = fn; } },
    require: (id: string) => id.startsWith("https:") ? { createClient: () => ({ from: vi.fn() }) } : { councilPublishing },
  });
  const request = (body: unknown, internal = true) => handler!(new Request("https://edge.test.invalid", {
    method: "POST", headers: { "Content-Type": "application/json", ...(internal ? { "x-internal-secret": "test-internal" } : {}) }, body: JSON.stringify(body),
  }));
  return { request, gateway };
}
describe("actual notification handler boundaries", () => {
  it("rejects untrusted browser calls before touching publishing", async () => {
    const h = edgeHarness();
    expect((await h.request({ event_type: "council_invite", action: "preview" }, false)).status).toBe(403);
    expect(h.gateway).not.toHaveBeenCalled();
  });
  it("previews canonical Circle without connector credentials, ignoring caller copy", async () => {
    const h = edgeHarness();
    const r = await h.request({ event_type: "council_invite", action: "preview", data: { title: "PRIVATE DRAFT" } });
    expect(r.status).toBe(200); const result = await r.json();
    expect(result.payload.text).toContain(CURRENT_CIRCLE.title);
    expect(result.payload.text).not.toContain("PRIVATE DRAFT");
    expect(result.publish_available).toBe(false); expect(h.gateway).not.toHaveBeenCalled();
  });
  it("blocks publishing until exposed-credential rotation is explicitly attested", async () => {
    const h = edgeHarness();
    expect((await h.request({ event_type: "council_invite", action: "publish", confirm: true, preview_id: "test" })).status).toBe(409);
    expect(h.gateway).not.toHaveBeenCalled();
  });
});
