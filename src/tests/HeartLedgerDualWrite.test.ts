/**
 * HeartLedgerDualWrite.test.ts
 * ────────────────────────────
 * Locks in the load-bearing dual-write contract documented at the top of
 * src/lib/heartService.ts.
 *
 * The contract:
 *   1. earnHearts() inserts into heart_ledger AND heart_transactions.
 *   2. The heart_transactions row uses the *legacy* heart_type vocabulary
 *      (no `earn_` prefix). That row is what fires the
 *      update_heart_balance_on_insert trigger and updates
 *      user_heart_balances.
 *   3. Passing skipLegacyMirror: true SUPPRESSES the heart_transactions
 *      mirror — used only for non-balance-affecting state (e.g. pending
 *      purchase intents).
 *
 * If a future refactor breaks any of the above, real user value goes
 * silently invisible — exactly the bug class the heart-ledger discovery
 * report surfaced. This test fails CI before that ships.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

type Insert = { table: string; row: Record<string, unknown> };

function makeSupabaseStub() {
  const inserts: Insert[] = [];
  const stub = {
    inserts,
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          // earnHearts chains .select().single() on the heart_ledger insert
          // and awaits the bare promise on heart_transactions.
          const result = {
            data: { ...row, id: `mock-${inserts.length}` },
            error: null,
          };
          const chain = {
            select: () => ({
              single: () => Promise.resolve(result),
            }),
            then: (resolve: (v: typeof result) => unknown) => resolve(result),
          };
          return chain;
        },
      };
    },
  };
  return stub;
}

vi.mock("@/integrations/supabase/client", () => {
  const stub = makeSupabaseStub();
  return { supabase: stub, __stub: stub };
});

// Re-import after mock is registered.
import { earnHearts } from "@/lib/heartService";
import * as supabaseModule from "@/integrations/supabase/client";

const getInserts = () =>
  (supabaseModule as unknown as { __stub: ReturnType<typeof makeSupabaseStub> }).__stub.inserts;

describe("heartService.earnHearts dual-write contract", () => {
  beforeEach(() => {
    getInserts().length = 0;
  });

  it("writes to BOTH heart_ledger and heart_transactions by default", async () => {
    await earnHearts({
      userId: "00000000-0000-0000-0000-000000000001",
      amount: 5,
      transactionType: "earn_checkin",
      entityType: "tree",
      entityId: "tree-uuid-1",
      source: "checkin",
    });

    const tables = getInserts().map((i) => i.table);
    expect(tables).toContain("heart_ledger");
    expect(tables).toContain("heart_transactions");
  });

  it("strips the earn_ prefix when mirroring to heart_transactions", async () => {
    await earnHearts({
      userId: "00000000-0000-0000-0000-000000000002",
      amount: 3,
      transactionType: "earn_tree_mapping",
      entityType: "tree",
      entityId: "tree-uuid-2",
    });

    const mirror = getInserts().find((i) => i.table === "heart_transactions");
    expect(mirror).toBeDefined();
    expect(mirror!.row).toMatchObject({
      heart_type: "tree_mapping",
      amount: 3,
      tree_id: "tree-uuid-2",
    });
  });

  it("skipLegacyMirror=true writes ONLY to heart_ledger", async () => {
    await earnHearts({
      userId: "00000000-0000-0000-0000-000000000003",
      amount: 100,
      transactionType: "purchase_bundle",
      currencyType: "S33D",
      skipLegacyMirror: true,
    });

    const tables = getInserts().map((i) => i.table);
    expect(tables).toEqual(["heart_ledger"]);
  });

  it("does not mirror SPECIES or INFLUENCE currencies (different ledgers)", async () => {
    await earnHearts({
      userId: "00000000-0000-0000-0000-000000000004",
      amount: 2,
      transactionType: "earn_curation",
      currencyType: "SPECIES",
    });

    const tables = getInserts().map((i) => i.table);
    // Only the ledger row — SPECIES has its own table/trigger.
    expect(tables).toEqual(["heart_ledger"]);
  });

  it("preserves spend_ prefix when mirroring spend_* types", async () => {
    await earnHearts({
      userId: "00000000-0000-0000-0000-000000000005",
      amount: 7,
      transactionType: "spend_plant_hearts",
      entityType: "tree",
      entityId: "tree-uuid-5",
    });

    const mirror = getInserts().find((i) => i.table === "heart_transactions");
    expect(mirror!.row).toMatchObject({ heart_type: "spend_plant_hearts" });
  });
});
