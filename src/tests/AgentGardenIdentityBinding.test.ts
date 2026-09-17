import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const service = fs.readFileSync(path.resolve("supabase/functions/api-gateway/services/agentGarden.ts"), "utf8");
const gateway = fs.readFileSync(path.resolve("supabase/functions/api-gateway/index.ts"), "utf8");

describe("Agent Garden identity binding", () => {
  it("binds every Agent Garden write handler to authenticated agent access", () => {
    const writeHandlers = [
      "updateCapabilities", "submitSource", "submitDataset", "submitResearchTreesBulk",
      "submitSpeciesClassification", "submitGeocode", "submitEnrichment",
      "submitDuplicateCheck", "submitCandidate", "submitSpark",
    ];
    for (const handler of writeHandlers) {
      expect(service).toMatch(new RegExp(`function ${handler}\\([^)]*auth: AuthResult[\\s\\S]{0,220}verifyAgentAccess\\(auth,`));
    }
  });

  it("rejects anonymous and mismatched identities while retaining privileged review", () => {
    expect(service).toContain("(!auth.userId && !auth.agentId)");
    expect(service).toContain("auth.agentId === agentId || check.agent.owner_user_id === auth.userId");
    expect(service).toContain('auth.scopes.includes("admin:*")');
    expect(service).toContain('error: "Not authorized for this agent"');
  });

  it("links access keys and registrations to the authenticated owner", () => {
    expect(gateway).toContain('.select("user_id, agent_id, scopes, expires_at")');
    expect(gateway).toContain("agentId: token.agent_id");
    expect(service).toContain("owner_user_id: auth.userId");
  });
});