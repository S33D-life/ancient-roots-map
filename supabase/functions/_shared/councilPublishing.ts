import { CURRENT_CIRCLE, approvedCircleUrl, type CurrentCircle } from "./currentCircle.ts";
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export function renderCouncilInvite(c: CurrentCircle = CURRENT_CIRCLE) {
  if (c.approval !== "approved" || !approvedCircleUrl(c.links.council)) throw new Error("Approved public Council required");
  const choices = [["🌿 Enter Council", c.links.council], ["🔥 Council Fire", c.links.fire],
    ["📖 Read Guide", c.links.guide], ["🖼️ Explore Images", c.links.images], ["🌱 Living Circle Record", c.links.livingRecord]] as const;
  return {
    text: [`🌿 <b>${escapeHtml(c.title)}</b>`, escapeHtml(c.openLine), `<i>${escapeHtml(c.question)}</i>`,
      `This week’s companions: ${c.companions.map(escapeHtml).join(" · ")}.`, escapeHtml(c.peopleSeat),
      `Fly Agaric: ${escapeHtml(c.safety)}`].join("\n\n"),
    parse_mode: "HTML" as const,
    reply_markup: { inline_keyboard: choices.flatMap(([text, link]) => {
      const url = approvedCircleUrl(link); return url ? [[{ text, url }]] : [];
    }) }, disable_web_page_preview: true,
  };
}
export interface CouncilPreview {
  id: string; chat_id: string; message_text: string; status: string; created_at: string;
  metadata: { revision: string; payload: ReturnType<typeof renderCouncilInvite> };
}
export interface PublishingDependencies {
  savePreview: (chat: string, payload: ReturnType<typeof renderCouncilInvite>, revision: string) => Promise<CouncilPreview>;
  loadPreview: (id: string) => Promise<CouncilPreview | null>;
  claimPreview: (id: string) => Promise<boolean>;
  send: (chat: string, payload: ReturnType<typeof renderCouncilInvite>) => Promise<{ ok: boolean; message_id?: number }>;
  finish: (id: string, result: { ok: boolean; message_id?: number; error?: string }) => Promise<void>;
}
/** Existing internal authorization is required by caller. Private test publication only. */
export async function councilPublishing(
  request: { action?: string; preview_id?: string; confirm?: boolean },
  testChatId: string | undefined, deps: PublishingDependencies,
) {
  const payload = renderCouncilInvite();
  if (request.action === "preview") {
    if (!testChatId || !/^[1-9]\d*$/.test(testChatId)) return { ok: true, mode: "preview", payload, publish_available: false };
    const preview = await deps.savePreview(testChatId, payload, CURRENT_CIRCLE.revision);
    return { ok: true, mode: "preview", payload, preview_id: preview.id, publish_available: true };
  }
  if (request.action !== "publish" || request.confirm !== true || !request.preview_id) throw new Error("Explicit preview then publish confirmation required");
  if (!testChatId || !/^[1-9]\d*$/.test(testChatId)) throw new Error("Approved private test destination required");
  const preview = await deps.loadPreview(request.preview_id);
  if (!preview || !Number.isFinite(Date.parse(preview.created_at)) || Date.now() - Date.parse(preview.created_at) > 600_000 ||
    Date.parse(preview.created_at) > Date.now() || preview.status !== "pending" || preview.chat_id !== testChatId || preview.message_text !== payload.text ||
    preview.metadata?.revision !== CURRENT_CIRCLE.revision || JSON.stringify(preview.metadata?.payload) !== JSON.stringify(payload)) {
    throw new Error("Preview changed or destination not approved");
  }
  if (!await deps.claimPreview(preview.id)) throw new Error("Preview already claimed; never retry an uncertain send");
  let result: { ok: boolean; message_id?: number; error?: string };
  try {
    result = await deps.send(testChatId, payload);
    if (!result.ok || !Number.isSafeInteger(result.message_id)) result = { ok: false, error: "Telegram did not acknowledge publication" };
  } catch { result = { ok: false, error: "Telegram result unknown; inspect log before another preview" }; }
  await deps.finish(preview.id, result);
  return result;
}
