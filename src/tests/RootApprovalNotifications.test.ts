import fs from "node:fs";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  "supabase/migrations/20260916091050_c89b5243-b35f-4129-8098-a7e10eaecd01.sql",
  "utf8",
);

describe("Root approval notifications", () => {
  it("alerts the primary and active Grove stewards for a new suggestion", () => {
    expect(migration).toContain("g.created_by AS recipient_id");
    expect(migration).toContain("FROM public.life_grove_stewards s");
    expect(migration).toContain("s.revoked_at IS NULL");
    expect(migration).toContain("NEW.status = 'proposed'");
  });

  it("alerts every existing Ancient Friend authority for a pending Root", () => {
    expect(migration).toContain("t.created_by AS recipient_id");
    expect(migration).toContain("'curator'::public.app_role, 'keeper'::public.app_role");
    expect(migration).toContain("OLD.status = 'proposed' AND NEW.status = 'pending'");
  });

  it("deduplicates recipients, excludes the actor, and exposes no private Root content", () => {
    expect(migration).toContain("UNION\n");
    expect(migration).toContain("recipient_id IS DISTINCT FROM v_actor");
    expect(migration).not.toMatch(/NEW\.(inscription_text|dedication)/);
    expect(migration).toContain("'approval_side', 'grove'");
    expect(migration).toContain("'approval_side', 'ancient_friend'");
  });
});