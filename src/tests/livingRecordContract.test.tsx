import { useEffect, useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { resolveRecordIdentity, resolveIdentityRelationship, type IdentityRef, type IdentityDescriptor, type IdentitySources } from "@/lib/library/recordIdentity";
import { contextualReturnTarget, identityOpening, parseAppearance, parseReturnContext, returnContextParams, restoreAppearanceFocus, treeReturnContext, type ContextualAppearance } from "@/lib/library/contextualReturn";
import { parseOrigin, returnPathFor } from "@/lib/library/origin";
import { ROUTES } from "@/lib/routes";

// TEST ONLY. No Circle 236 record or runtime source is created by this fixture.
const genus: IdentityRef = { source: "notion", id: "3f315b58-480d-814c-a056-cb6c7b4f7f33" };
const species: IdentityRef = { source: "species-index", id: "496f464d-7f8e-4501-8313-f638a8498550", speciesKey: "betula-pendula" };
const individual: IdentityRef = { source: "trees", id: "abb025be-1ea7-48be-8a21-d7daf90e4c21" };
const descriptors: IdentityDescriptor[] = [
  { ref: genus, scope: "genus", label: "Birch", scientificName: "Betula" },
  { ref: species, scope: "species", label: "Silver Birch", scientificName: "Betula pendula" },
  { ref: individual, scope: "individual", label: "Mapped Birch" },
];
const source = async (ref: IdentityRef) => descriptors.find(d => d.ref.source === ref.source && d.ref.id === ref.id) ?? null;
const sources: IdentitySources = { notion: source, "species-index": source, trees: source };
const appearance: ContextualAppearance = {
  id: "test-birch-companion", contextId: "council-of-life/circle-999999", identity: genus,
  contextNote: "Private fixture: this test Circle attends to Birch.",
  returnContext: { route: "council", realm: "canopy", contextId: "council-of-life/circle-999999", appearanceId: "test-birch-companion", mode: "2d", focusTarget: "test-birch-companion" },
};
const returnSources = {
  treeAvailable: (id: string) => id === individual.id,
  councilAppearance: (contextId: string, id: string) => contextId === appearance.contextId && id === appearance.id ? appearance : null,
};
afterEach(cleanup);

describe("identity precision and source ownership", () => {
  it("resolves genus separately from the species strand and maps individuals without Friend promotion", async () => {
    expect(await resolveRecordIdentity(genus, sources)).toEqual({ status: "ready", identity: descriptors[0] });
    expect(await resolveRecordIdentity(species, sources)).toEqual({ status: "ready", identity: descriptors[1] });
    expect(await resolveIdentityRelationship({ kind: "species-strand", from: genus, to: species, evidence: [genus] }, sources)).not.toBeNull();
    expect(await resolveIdentityRelationship({ kind: "individual-of-species", from: species, to: individual, evidence: [individual] }, sources)).not.toBeNull();
    expect(await resolveRecordIdentity(individual, sources)).toEqual({ status: "ready", identity: descriptors[2] });
  });
  it("rejects genus substitution, opaque key alteration, wrong scope, missing evidence and self relations", async () => {
    expect(await resolveRecordIdentity(genus, { notion: async () => descriptors[1] })).toMatchObject({ status: "stop", reason: "identity-mismatch" });
    expect(await resolveRecordIdentity({ ...species, speciesKey: "Betula-Pendula" }, sources)).toMatchObject({ status: "stop" });
    expect(await resolveRecordIdentity(species, { "species-index": async () => ({ ...descriptors[1], scope: "genus" }) })).toMatchObject({ reason: "scope-mismatch" });
    for (const relation of [
      { kind: "species-strand", from: genus, to: species, evidence: [] },
      { kind: "species-strand", from: species, to: genus, evidence: [genus] },
      { kind: "species-strand", from: genus, to: genus, evidence: [genus] },
    ]) expect(await resolveIdentityRelationship(relation, sources)).toBeNull();
  });
  it("fails closed without a source adapter, on lookup errors and on missing/invalid records", async () => {
    expect(await resolveRecordIdentity(genus, {})).toMatchObject({ reason: "source-unavailable" });
    expect(await resolveRecordIdentity(genus, { notion: async () => { throw new Error("private"); } })).toMatchObject({ reason: "source-error" });
    expect(await resolveRecordIdentity(genus, { notion: async () => null })).toMatchObject({ status: "stop" });
    expect(await resolveRecordIdentity({ source: "notion", id: "https://external.test" }, sources)).toMatchObject({ reason: "invalid-reference" });
  });
  it("re-reads the same source rather than storing knowledge on an appearance", async () => {
    let label = "Birch";
    const adapter: IdentitySources = { notion: async () => ({ ...descriptors[0], label }) };
    const opening = identityOpening(appearance)!;
    expect((await resolveRecordIdentity(opening.identity, adapter))).toMatchObject({ identity: { label: "Birch" } });
    label = "Birch — deeper source";
    expect((await resolveRecordIdentity(opening.identity, adapter))).toMatchObject({ identity: { label } });
    expect(parseAppearance({ ...appearance, taxonomy: "copied lore" })).toBeNull();
    expect(parseAppearance({ ...appearance, returnContext: { ...appearance.returnContext, appearanceId: "different" } })).toBeNull();
  });
});

describe("validated contextual return", () => {
  it("round-trips refresh-safe context and rejects malformed, repeated or URL-bearing transport", () => {
    const transported = returnContextParams(appearance.returnContext);
    expect(parseReturnContext(new URLSearchParams(transported.toString()))).toEqual(appearance.returnContext);
    expect(contextualReturnTarget(parseReturnContext(transported), returnSources)).toMatchObject({ pathname: ROUTES.COUNCIL });
    transported.append("recordReturn", transported.get("recordReturn")!);
    expect(parseReturnContext(transported)).toBeNull();
    expect(parseReturnContext(new URLSearchParams({ recordReturn: "{" }))).toBeNull();
    expect(parseReturnContext(new URLSearchParams({ recordReturn: JSON.stringify({ ...appearance.returnContext, url: "//external.test" }) }))).toBeNull();
    expect(parseReturnContext(new URLSearchParams({ recordReturn: "x".repeat(1025) }))).toBeNull();
    expect(returnContextParams({ route: "https://external.test" }).toString()).toBe("");
  });
  it("preserves the legacy individual-tree return and Library fallback", () => {
    const legacy = parseOrigin(new URLSearchParams({ originType: "ancient-friend", originId: individual.id }));
    const context = treeReturnContext(legacy);
    expect(contextualReturnTarget(context, returnSources).pathname).toBe(returnPathFor(legacy, true));
    expect(contextualReturnTarget(context, { ...returnSources, treeAvailable: () => false }).pathname).toBe(ROUTES.LIBRARY);
    expect(treeReturnContext(null)).toBeNull();
  });
  it("accepts only source-registered appearance, matching mode and internally built routes", () => {
    expect(contextualReturnTarget(appearance.returnContext, returnSources)).toMatchObject({ pathname: ROUTES.COUNCIL });
    for (const input of [
      { ...appearance.returnContext, url: "https://external.test" },
      { ...appearance.returnContext, contextId: "council-of-life/circle-236" },
      { ...appearance.returnContext, appearanceId: "unknown" },
      { ...appearance.returnContext, mode: "spatial" },
      { ...appearance.returnContext, focusTarget: "#x[href]" },
      { ...appearance.returnContext, route: "//external.test" },
    ]) expect(contextualReturnTarget(input, returnSources)).toEqual({ pathname: ROUTES.LIBRARY });
    const overridden = contextualReturnTarget({ ...appearance.returnContext, focusTarget: "untrusted-valid-id" }, returnSources);
    expect(overridden.state?.libraryReturn.focusTarget).toBe("test-birch-companion");
  });
  it("supports a source-registered spatial return without building a scene engine", () => {
    const spatial = { ...appearance, returnContext: { ...appearance.returnContext, mode: "spatial" as const } };
    expect(contextualReturnTarget(spatial.returnContext, { ...returnSources, councilAppearance: () => spatial })).toMatchObject({ state: { libraryReturn: { mode: "spatial" } } });
    expect(contextualReturnTarget(appearance.returnContext, { ...returnSources, councilAppearance: () => { throw new Error("unavailable"); } })).toEqual({ pathname: ROUTES.LIBRARY });
  });
});

// An isolated in-memory route harness: not mounted in App.tsx or shipped as Council UI.
function ContractHarness() {
  const navigate = useNavigate(), location = useLocation();
  const [depth, setDepth] = useState<"genus" | "species" | "individual">("genus");
  const [resolved, setResolved] = useState<IdentityDescriptor | null>(null);
  const context = location.state?.returnContext;
  useEffect(() => {
    if (location.pathname === ROUTES.COUNCIL && location.state?.libraryReturn) {
      restoreAppearanceFocus(location.state.libraryReturn);
    }
  }, [location]);
  useEffect(() => {
    let mounted = true;
    resolveRecordIdentity(depth === "genus" ? genus : depth === "species" ? species : individual, sources).then(r => {
      if (mounted) setResolved(r.status === "ready" ? r.identity : null);
    });
    return () => { mounted = false; };
  }, [depth]);
  if (location.pathname === ROUTES.COUNCIL) return <>
    <p>Private fixture only</p>
    <button id={appearance.id} onClick={() => {
      const opening = identityOpening(appearance)!;
      navigate("/test-shared-identity", { state: { returnContext: opening.returnContext } });
    }}>Meet Birch in the test Circle</button>
  </>;
  return <>
    <h1>{resolved?.label ?? "Loading"}</h1>
    <button onClick={() => setDepth("species")}>Species strand</button>
    <button onClick={() => setDepth("individual")}>Mapped individual</button>
    <button onClick={() => setDepth("genus")}>Back to Birch</button>
    <button onClick={() => navigate(contextualReturnTarget(context, returnSources).pathname, { state: contextualReturnTarget(context, returnSources).state })}>Return to the test Circle</button>
  </>;
}
it("private appearance → shared genus → species → mapped individual → genus → exact appearance/focus", async () => {
  render(<MemoryRouter initialEntries={[ROUTES.COUNCIL]}><Routes><Route path="*" element={<ContractHarness />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Meet Birch in the test Circle" }));
  await screen.findByRole("heading", { name: "Birch" });
  fireEvent.click(screen.getByRole("button", { name: "Species strand" }));
  await screen.findByRole("heading", { name: "Silver Birch" });
  fireEvent.click(screen.getByRole("button", { name: "Mapped individual" }));
  await screen.findByRole("heading", { name: "Mapped Birch" });
  fireEvent.click(screen.getByRole("button", { name: "Back to Birch" }));
  await screen.findByRole("heading", { name: "Birch" });
  fireEvent.click(screen.getByRole("button", { name: "Return to the test Circle" }));
  expect(screen.getByRole("button", { name: "Meet Birch in the test Circle" })).toHaveFocus();
});
