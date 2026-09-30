/**
 * Locks in R1: one Wanderer-to-Wanderer relationship (referrals, mirrored on the
 * profile), one consumption path (consume_invitation, app-wide), no client
 * fallback, no URL work during auth, and no counters reset.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(p), "utf8");
const MIGRATION = "supabase/migrations/20260930120000_r1_unified_invitation_consumption.sql";
const sql = read(MIGRATION).replace(/--[^\n]*/g, "");

function sourceFiles(dir: string): string[] {
  return readdirSync(resolve(dir), { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return /tests?$|__tests__$/.test(e.name) ? [] : sourceFiles(p);
    return /\.(ts|tsx)$/.test(e.name) && !p.endsWith("integrations/supabase/types.ts") ? [p] : [];
  });
}

describe("client: one consumption path", () => {
  it("mounts InvitationConsumer once, inside the router", () => {
    const app = read("src/App.tsx");
    expect(app.match(/<InvitationConsumer \/>/g)).toHaveLength(1);
    expect(app.indexOf("<BrowserRouter")).toBeLessThan(app.indexOf("<InvitationConsumer />"));
  });

  it("only the invitation module calls consume_invitation, and nothing calls record_referral_secure", () => {
    const callers = sourceFiles("src").filter((f) => /["']consume_invitation["']/.test(read(f)));
    expect(callers).toEqual([join("src", "lib", "invitations", "consumeInvitation.ts")]);
    const consumer = read("src/components/auth/InvitationConsumer.tsx");
    expect(consumer).toContain("consumeInvitation(");
    const legacy = sourceFiles("src").filter((f) => read(f).includes('"record_referral_secure"'));
    expect(legacy).toEqual([]);
  });

  it("the sign-in page no longer consumes or falls back", () => {
    const page = read("src/pages/AuthPage.tsx");
    expect(page).not.toContain("consume_invitation");
    expect(page).not.toContain("recordReferral");
    expect(page).toContain("readPendingInvite()");
  });

  it("the consumer never navigates or rewrites the URL (#74)", () => {
    const consumer = read("src/components/auth/InvitationConsumer.tsx").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    for (const forbidden of ["useNavigate", "navigate(", "setSearchParams", "history.", "location.hash", "location.href", "location.replace", "onAuthStateChange"]) {
      expect(consumer).not.toContain(forbidden);
    }
  });
});

describe("migration: canonical relationship, history preserved", () => {
  it("replaces consume_invitation and keeps its grants", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.consume_invitation(p_invite_code text, p_new_user_id uuid)");
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.consume_invitation(text, uuid) FROM anon, PUBLIC;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.consume_invitation(text, uuid) TO authenticated, service_role;");
  });

  it("treats an existing referrals row as already attributed", () => {
    expect(sql).toMatch(/OR EXISTS \(SELECT 1 FROM public\.referrals r WHERE r\.invitee_id = p_new_user_id\) THEN\s+RETURN jsonb_build_object\('error', 'already_attributed'\)/);
  });

  it("carries no account-age rule (identity ≠ invitation)", () => {
    expect(sql).not.toMatch(/auth\.users|created_at <|account_predates/);
  });

  it("locks the invitee before the attribution check, so nothing can overwrite an inviter", () => {
    const lock = sql.indexOf("PERFORM 1 FROM public.profiles WHERE id = p_new_user_id FOR UPDATE;");
    const check = sql.indexOf("RETURN jsonb_build_object('error', 'already_attributed')");
    const write = sql.indexOf("SET invited_by_user_id = v_link.created_by");
    expect(lock).toBeGreaterThan(-1);
    expect(lock).toBeLessThan(check);
    expect(check).toBeLessThan(write);
    // The idempotent same-link repeat returns before any write.
    expect(sql.indexOf("'already_consumed', true")).toBeLessThan(write);
  });

  it("never resets an existing Wanderer's allowance", () => {
    // Only the brand-new-profile INSERT may carry 144.
    expect(sql.match(/invites_remaining = 144/g)).toBeNull();
    expect(sql).toContain("VALUES (p_new_user_id, v_link.created_by, v_staff_id, 144)");
  });

  it("retires the legacy client write and stops Gift Seeds writing invitation lineage", () => {
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.record_referral_secure(uuid, text) FROM PUBLIC, anon, authenticated;");
    expect(sql).toContain("DROP TRIGGER IF EXISTS trg_gift_seed_referral ON public.gift_seeds;");
  });

  it("modifies no existing rows", () => {
    expect(sql).not.toMatch(/\b(DELETE FROM|TRUNCATE|DROP TABLE|DROP FUNCTION)\b/i);
    // The only UPDATEs are the ones consume_invitation performs for the redeeming pair.
    expect(sql.match(/^\s*UPDATE public\.(\w+)/gim)?.map((u) => u.trim())).toEqual([
      "UPDATE public.profiles", "UPDATE public.profiles", "UPDATE public.invite_links",
    ]);
  });
});
