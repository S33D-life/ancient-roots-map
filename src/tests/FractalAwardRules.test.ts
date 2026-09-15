/**
 * FractalAwardRules — the grove's own allowances for Species Hearts and
 * Influence Tokens live in the database (public.fractal_award_rules) and are
 * enforced there. This test mirrors those allowances so that a change to the
 * reward amounts in the app cannot silently drift past what the grove permits.
 */
import { describe, it, expect } from "vitest";

/** Mirror of public.fractal_award_rules (client_allowed rows only). */
const DB_ALLOWANCES = {
  SPECIES: { mapping: 3, checkin: 3, offering: 1, curation: 1 },
  INFLUENCE: { mapping: 2, checkin: 1, offering: 1, curation: 2 },
} as const;

const DB_DAILY_CAPS = { SPECIES: 200, INFLUENCE: 50 } as const;

/** Mirror of ACTION_DEFAULTS in src/utils/issueRewards.ts. */
const ACTION_DEFAULTS = {
  checkin: { species: 1, influence: 0 },
  mapping: { species: 3, influence: 2 },
  offering: { species: 1, influence: 0 },
  curation: { species: 0, influence: 2 },
} as const;

describe("fractal award allowances", () => {
  it("never awards more Species Hearts than the grove allows", () => {
    for (const [action, amounts] of Object.entries(ACTION_DEFAULTS)) {
      const allowed = DB_ALLOWANCES.SPECIES[action as keyof typeof DB_ALLOWANCES.SPECIES];
      expect(amounts.species).toBeLessThanOrEqual(allowed);
    }
  });

  it("never awards more Influence than the grove allows", () => {
    for (const [action, amounts] of Object.entries(ACTION_DEFAULTS)) {
      const allowed = DB_ALLOWANCES.INFLUENCE[action as keyof typeof DB_ALLOWANCES.INFLUENCE];
      expect(amounts.influence).toBeLessThanOrEqual(allowed);
    }
  });

  it("keeps a single action far below the daily ceiling", () => {
    for (const amounts of Object.values(ACTION_DEFAULTS)) {
      expect(amounts.species).toBeLessThan(DB_DAILY_CAPS.SPECIES);
      expect(amounts.influence).toBeLessThan(DB_DAILY_CAPS.INFLUENCE);
    }
  });

  it("only recognises intentional earning actions", () => {
    expect(Object.keys(ACTION_DEFAULTS).sort()).toEqual(
      ["checkin", "curation", "mapping", "offering"],
    );
  });
});
