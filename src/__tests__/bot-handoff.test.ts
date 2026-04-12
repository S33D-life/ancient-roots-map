import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((_: number) => null),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

import {
  getStoredHandoff,
  clearStoredHandoff,
  intentToPath,
  type BotHandoffContext,
} from "@/hooks/use-bot-handoff";

describe("Bot Handoff Helpers", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("intentToPath — shared contract alignment", () => {
    it("maps known intents to canonical paths", () => {
      expect(intentToPath("map")).toBe("/map");
      expect(intentToPath("add-tree")).toBe("/add-tree");
      expect(intentToPath("referrals")).toBe("/referrals");
      expect(intentToPath("invite")).toBe("/referrals");
      expect(intentToPath("gift")).toBe("/dashboard");
      expect(intentToPath("roadmap")).toBe("/roadmap");
      expect(intentToPath("support")).toBe("/support");
      expect(intentToPath("journey")).toBe("/map");
      expect(intentToPath("atlas")).toBe("/atlas");
      expect(intentToPath("library")).toBe("/library");
      expect(intentToPath("dashboard")).toBe("/dashboard");
    });

    it("returns /atlas for unknown intent", () => {
      expect(intentToPath(null)).toBe("/atlas");
      expect(intentToPath("unknown")).toBe("/atlas");
    });

    it("prefers returnTo over intent when valid", () => {
      expect(intentToPath("map", "/tree/abc")).toBe("/tree/abc");
    });

    it("rejects unsafe returnTo paths", () => {
      expect(intentToPath("map", "//evil.com")).toBe("/map");
      expect(intentToPath("map", "/auth")).toBe("/map");
      expect(intentToPath("map", "https://evil.com")).toBe("/map");
    });

    it("tree intent falls back to /map (needs ID)", () => {
      expect(intentToPath("tree")).toBe("/map");
    });
  });

  describe("getStoredHandoff / clearStoredHandoff", () => {
    it("returns null when nothing stored", () => {
      expect(getStoredHandoff()).toBeNull();
    });

    it("reads and parses stored handoff", () => {
      const handoff: BotHandoffContext = {
        source: "telegram",
        bot: "openclaw",
        handoffToken: "abc123",
        intent: "map",
        invite: null,
        gift: null,
        returnTo: null,
        campaign: null,
      };
      store["s33d_bot_handoff"] = JSON.stringify(handoff);

      const result = getStoredHandoff();
      expect(result).not.toBeNull();
      expect(result!.source).toBe("telegram");
      expect(result!.handoffToken).toBe("abc123");
      expect(result!.intent).toBe("map");
    });

    it("clears stored handoff", () => {
      store["s33d_bot_handoff"] = JSON.stringify({ source: "telegram" });
      clearStoredHandoff();
      expect(getStoredHandoff()).toBeNull();
    });

    it("returns null for corrupted JSON", () => {
      store["s33d_bot_handoff"] = "not-json{{{";
      expect(getStoredHandoff()).toBeNull();
    });
  });

  describe("Route consistency", () => {
    it("/map is canonical map route, not /atlas", () => {
      expect(intentToPath("map")).toBe("/map");
      expect(intentToPath("journey")).toBe("/map");
    });

    it("/atlas is country index, separate from map", () => {
      expect(intentToPath("atlas")).toBe("/atlas");
    });

    it("support intent routes to /support", () => {
      expect(intentToPath("support")).toBe("/support");
    });
  });

  describe("Invite/gift flows unaffected", () => {
    it("invite code is stored independently from handoff", () => {
      store["s33d_invite_code"] = "INV123";
      store["s33d_bot_handoff"] = JSON.stringify({
        source: "telegram",
        bot: "openclaw",
        handoffToken: "tok1",
        intent: "referrals",
        invite: "INV123",
        gift: null,
        returnTo: null,
        campaign: null,
      });

      expect(store["s33d_invite_code"]).toBe("INV123");
      const handoff = getStoredHandoff();
      expect(handoff!.invite).toBe("INV123");
    });
  });

  describe("Expired / invalid handoff fallback", () => {
    it("intentToPath falls back to /atlas when intent is null", () => {
      expect(intentToPath(null, null)).toBe("/atlas");
    });
  });
});

describe("BOT_CONFIG", () => {
  it("has a fallback bot username and generates valid links", async () => {
    const { BOT_CONFIG } = await import("@/config/bot");
    // Fallback username "s33dlifebot" is always present
    expect(BOT_CONFIG.hasTelegramBot).toBe(true);
    expect(BOT_CONFIG.hasTelegramAuth).toBe(true);
    const link = BOT_CONFIG.telegramBotLink("test");
    expect(link).toContain("t.me/");
    expect(link).toContain("start=test");
  });
});
