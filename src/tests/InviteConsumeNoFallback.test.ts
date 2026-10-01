import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const authPage = readFileSync(resolve(__dirname, "../pages/AuthPage.tsx"), "utf8");

it("AuthPage accepts invitations only through consume_invitation", () => {
  expect(authPage).toContain('"consume_invitation"');
  expect(authPage).not.toMatch(/recordReferral\s*\(/);
  expect(authPage).not.toContain("record_referral_secure");
});

it("a failed consume_invitation is reported, not silently converted into a referral", () => {
  const failureBranch = authPage.slice(authPage.indexOf("invite_consume_failed"));
  const branchEnd = failureBranch.indexOf('localStorage.removeItem("s33d_invite_code")');
  const branch = failureBranch.slice(0, branchEnd);
  expect(branch).not.toMatch(/rpc\(|recordReferral|from\("referrals"\)|from\("profiles"\)/);
});
