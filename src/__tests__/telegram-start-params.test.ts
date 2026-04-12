import { describe, it, expect } from "vitest";

/**
 * Tests for Telegram /start param parsing logic.
 * Mirrors the parseStartPayload function from telegram-poll.
 */

interface ParsedStartParam {
  flow: string;
  intent: string;
  context: Record<string, string>;
}

function parseStartPayload(payload: string | null): ParsedStartParam | null {
  if (!payload) return null;
  const trimmed = payload.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("invite_")) {
    const code = trimmed.slice(7);
    if (code) return { flow: "create", intent: "invite", context: { invite_code: code } };
  }

  if (trimmed.startsWith("tree_")) {
    const treeId = trimmed.slice(5);
    if (treeId) return { flow: "login", intent: "tree", context: { tree_id: treeId } };
  }

  if (trimmed.startsWith("room_")) {
    const room = trimmed.slice(5);
    const validRooms: Record<string, string> = { music: "library", library: "library", council: "dashboard" };
    if (validRooms[room]) return { flow: "login", intent: validRooms[room], context: { room } };
  }

  switch (trimmed) {
    case "login": return { flow: "login", intent: "dashboard", context: {} };
    case "connect": return { flow: "connect", intent: "dashboard", context: {} };
    case "new_gardener": return { flow: "create_gardener", intent: "add-tree", context: {} };
    case "new_wanderer": return { flow: "create_wanderer", intent: "atlas", context: {} };
    default: return null;
  }
}

describe("parseStartPayload", () => {
  it("returns null for null/empty", () => {
    expect(parseStartPayload(null)).toBeNull();
    expect(parseStartPayload("")).toBeNull();
    expect(parseStartPayload("  ")).toBeNull();
  });

  it("parses invite_CODE", () => {
    const result = parseStartPayload("invite_ABC123");
    expect(result).toEqual({ flow: "create", intent: "invite", context: { invite_code: "ABC123" } });
  });

  it("parses invite_ with no code as null", () => {
    expect(parseStartPayload("invite_")).toBeNull();
  });

  it("parses tree_UUID", () => {
    const result = parseStartPayload("tree_550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({
      flow: "login", intent: "tree",
      context: { tree_id: "550e8400-e29b-41d4-a716-446655440000" },
    });
  });

  it("parses room_music", () => {
    const result = parseStartPayload("room_music");
    expect(result).toEqual({ flow: "login", intent: "library", context: { room: "music" } });
  });

  it("parses room_council", () => {
    const result = parseStartPayload("room_council");
    expect(result).toEqual({ flow: "login", intent: "dashboard", context: { room: "council" } });
  });

  it("rejects invalid room", () => {
    expect(parseStartPayload("room_unknown")).toBeNull();
  });

  it("parses login", () => {
    expect(parseStartPayload("login")).toEqual({ flow: "login", intent: "dashboard", context: {} });
  });

  it("parses connect", () => {
    expect(parseStartPayload("connect")).toEqual({ flow: "connect", intent: "dashboard", context: {} });
  });

  it("parses new_gardener", () => {
    expect(parseStartPayload("new_gardener")).toEqual({ flow: "create_gardener", intent: "add-tree", context: {} });
  });

  it("parses new_wanderer", () => {
    expect(parseStartPayload("new_wanderer")).toEqual({ flow: "create_wanderer", intent: "atlas", context: {} });
  });

  it("returns null for unknown payloads", () => {
    expect(parseStartPayload("random_stuff")).toBeNull();
    expect(parseStartPayload("hello")).toBeNull();
    expect(parseStartPayload("12345")).toBeNull();
  });
});
