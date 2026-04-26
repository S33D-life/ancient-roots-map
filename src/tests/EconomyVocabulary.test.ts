/**
 * EconomyVocabulary.test.ts
 * ─────────────────────────
 * Locks in the bidirectional translation between heart_ledger and
 * heart_transactions vocabulary, and the lottery draw_type display map.
 *
 * Each rule corresponds to a real bug surfaced in the heart-ledger and
 * lottery pre-flight discovery reports. Failing this test means we are
 * about to ship vocabulary drift again.
 */
import { describe, it, expect } from "vitest";
import {
  ledgerToLegacy,
  legacyToLedger,
  ACTION_TO_LEDGER_TXN_TYPE,
  LOTTERY_DRAW_TYPES,
  drawEmoji,
  drawLabel,
  DRAW_DISPLAY,
} from "@/lib/economy-vocabulary";

describe("ledger ↔ legacy translation", () => {
  it("strips earn_ prefix from earn_* types", () => {
    expect(ledgerToLegacy("earn_checkin")).toBe("checkin");
    expect(ledgerToLegacy("earn_tree_mapping")).toBe("tree_mapping");
    expect(ledgerToLegacy("earn_root_growth")).toBe("root_growth");
    expect(ledgerToLegacy("earn_support_gratitude")).toBe("support_gratitude");
  });

  it("preserves spend_ prefix on spend_* types", () => {
    expect(ledgerToLegacy("spend_plant_hearts")).toBe("spend_plant_hearts");
    expect(ledgerToLegacy("spend_gift")).toBe("spend_gift");
  });

  it("passes admin_/refund types through unchanged", () => {
    expect(ledgerToLegacy("refund")).toBe("refund");
    expect(ledgerToLegacy("admin_grant")).toBe("admin_grant");
  });

  it("legacyToLedger is the inverse for earn_* round-trips", () => {
    for (const k of ["checkin", "tree_mapping", "council", "root_growth"] as const) {
      expect(ledgerToLegacy(legacyToLedger(k))).toBe(k);
    }
  });

  it("legacyToLedger preserves spend_ and admin types", () => {
    expect(legacyToLedger("spend_gift")).toBe("spend_gift");
    expect(legacyToLedger("admin_debit")).toBe("admin_debit");
    expect(legacyToLedger("refund")).toBe("refund");
  });
});

describe("ACTION_TO_LEDGER_TXN_TYPE", () => {
  it("maps every documented earn action to an earn_* ledger type", () => {
    expect(ACTION_TO_LEDGER_TXN_TYPE.checkin).toBe("earn_checkin");
    expect(ACTION_TO_LEDGER_TXN_TYPE.mapping).toBe("earn_tree_mapping");
    expect(ACTION_TO_LEDGER_TXN_TYPE.root_growth).toBe("earn_root_growth");
  });

  it("plant_hearts is a spend, not an earn", () => {
    expect(ACTION_TO_LEDGER_TXN_TYPE.plant_hearts).toBe("spend_plant_hearts");
  });
});

describe("lottery draw_type vocabulary", () => {
  it("uses the DB canonical strings (lunar_new / lunar_full)", () => {
    expect(LOTTERY_DRAW_TYPES.lunar_new).toBe("lunar_new");
    expect(LOTTERY_DRAW_TYPES.lunar_full).toBe("lunar_full");
    // Drift bug guard — these must NOT exist as values.
    expect(Object.values(LOTTERY_DRAW_TYPES)).not.toContain("new_moon");
    expect(Object.values(LOTTERY_DRAW_TYPES)).not.toContain("full_moon");
  });

  it("provides emoji + label for every draw_type", () => {
    for (const type of Object.values(LOTTERY_DRAW_TYPES)) {
      expect(DRAW_DISPLAY[type]).toBeDefined();
      expect(DRAW_DISPLAY[type].emoji.length).toBeGreaterThan(0);
      expect(DRAW_DISPLAY[type].label.length).toBeGreaterThan(0);
    }
  });

  it("falls back gracefully for unknown / null draw types", () => {
    expect(drawEmoji(null)).toBe("🌙");
    expect(drawLabel(undefined)).toBe("Next Moon");
    expect(drawEmoji("solar_made_up")).toBe("🌙");
  });
});
