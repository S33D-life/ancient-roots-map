/**
 * Payload + validation tests for MemorySeedComposer.
 *
 * - Whisper unlock payloads (pure helper) — full matrix.
 * - Default unlock (any_ancient_friend) verified end-to-end through the
 *   component to prove the helper is actually wired into sendWhisper.
 * - Invalid mediaUrl rejected by the shared zod Schema.
 * - Signed-out branch shows sign-in prompt and hides the form.
 * - Placeholder TYPES (voice_note, bloom) marked correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────────

const insertSingle = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({ single: () => insertSingle() }),
      }),
    }),
  },
}));

const sendWhisperMock = vi.fn();
vi.mock("@/hooks/use-whispers", () => ({
  sendWhisper: (...a: unknown[]) => sendWhisperMock(...a),
}));

const useCurrentUserMock = vi.fn();
vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

vi.mock("@/hooks/use-tree-resonance", () => ({
  useTreeResonance: () => ({
    distanceMeters: null,
    nearOfferingRange: true,
    visitedBefore: false,
    staffResonance: null,
    lifeGroveLink: false,
  }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() },
}));

import MemorySeedComposer, {
  buildWhisperDelivery,
  Schema,
  TYPES,
} from "../MemorySeedComposer";

// ── Pure-helper coverage ───────────────────────────────────────────────

describe("buildWhisperDelivery", () => {
  it("any_ancient_friend → ANY_TREE, no anchors", () => {
    expect(
      buildWhisperDelivery("any_ancient_friend", "tree-1", "quercus_robur", "Quercus robur"),
    ).toEqual({
      deliveryScope: "ANY_TREE",
      deliveryTreeId: undefined,
      deliverySpeciesKey: undefined,
    });
  });

  it("same_tree → SPECIFIC_TREE + origin tree id", () => {
    expect(
      buildWhisperDelivery("same_tree", "tree-1", "quercus_robur", "Quercus robur"),
    ).toEqual({
      deliveryScope: "SPECIFIC_TREE",
      deliveryTreeId: "tree-1",
      deliverySpeciesKey: undefined,
    });
  });

  it("same_species → SPECIES_MATCH with treeSpeciesKey when present", () => {
    expect(
      buildWhisperDelivery("same_species", "tree-1", "quercus_robur", "Quercus robur"),
    ).toEqual({
      deliveryScope: "SPECIES_MATCH",
      deliveryTreeId: undefined,
      deliverySpeciesKey: "quercus_robur",
    });
  });

  it("same_species → falls back to raw treeSpecies when no key", () => {
    expect(
      buildWhisperDelivery("same_species", "tree-1", null, "Quercus robur"),
    ).toEqual({
      deliveryScope: "SPECIES_MATCH",
      deliveryTreeId: undefined,
      deliverySpeciesKey: "Quercus robur",
    });
  });

  it("same_species with neither key nor species → undefined speciesKey", () => {
    expect(
      buildWhisperDelivery("same_species", "tree-1", null, null),
    ).toEqual({
      deliveryScope: "SPECIES_MATCH",
      deliveryTreeId: undefined,
      deliverySpeciesKey: undefined,
    });
  });
});

// ── Validation ─────────────────────────────────────────────────────────

describe("Schema (validation)", () => {
  const base = { type: "song" as const, title: "t", body: "b", author: "", note: "" };

  it("rejects an invalid media URL with the expected message", () => {
    const r = Schema.safeParse({ ...base, mediaUrl: "not a url" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/doesn't look like a valid URL/i);
    }
  });

  it("accepts an empty media URL", () => {
    expect(Schema.safeParse({ ...base, mediaUrl: "" }).success).toBe(true);
  });

  it("accepts a valid media URL", () => {
    expect(
      Schema.safeParse({ ...base, mediaUrl: "https://example.com/a.mp3" }).success,
    ).toBe(true);
  });
});

// ── Placeholder TYPES ──────────────────────────────────────────────────

describe("TYPES placeholders", () => {
  it("voice_note is marked placeholder with 'coming soon' hint", () => {
    const t = TYPES.find((x) => x.value === "voice_note");
    expect(t?.placeholder).toBe(true);
    expect(t?.hint.toLowerCase()).toContain("coming soon");
  });
  it("bloom is now an active type, not a placeholder", () => {
    const t = TYPES.find((x) => x.value === "bloom");
    expect(t?.placeholder).toBeFalsy();
    expect(t?.showMediaUrl).toBe(true);
    expect(t?.hint.toLowerCase()).not.toContain("coming soon");
  });
});

// ── End-to-end checks against the component ────────────────────────────

describe("MemorySeedComposer — payload + auth integration", () => {
  beforeEach(() => {
    insertSingle.mockReset();
    sendWhisperMock.mockReset();
    toastError.mockReset();
    useCurrentUserMock.mockReset();
  });

  it("default unlock (any_ancient_friend) passes ANY_TREE delivery to sendWhisper", async () => {
    useCurrentUserMock.mockReturnValue({ userId: "user-1", isLoading: false });
    sendWhisperMock.mockResolvedValue({ data: { id: "w-1" }, error: null });
    render(
      <MemorySeedComposer
        open={true}
        onOpenChange={() => {}}
        treeId="tree-1"
        treeName="Old Oak"
        treeSpecies="Quercus robur"
        treeSpeciesKey="quercus_robur"
      />,
    );
    fireEvent.click(screen.getByText("Send through the roots"));
    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: "T" } });
    fireEvent.change(screen.getByLabelText(/^Body$/i), { target: { value: "B" } });
    fireEvent.click(
      screen.getByRole("button", { name: /Send through the roots/i }),
    );
    await waitFor(() => expect(sendWhisperMock).toHaveBeenCalledTimes(1));
    const payload = sendWhisperMock.mock.calls[0][0];
    expect(payload.deliveryScope).toBe("ANY_TREE");
    expect(payload.deliveryTreeId).toBeUndefined();
    expect(payload.deliverySpeciesKey).toBeUndefined();
    expect(payload.treeAnchorId).toBe("tree-1");
  });

  it("signed-out: shows sign-in prompt, hides the form, no submit possible", () => {
    useCurrentUserMock.mockReturnValue({ userId: null, isLoading: false });
    render(
      <MemorySeedComposer
        open={true}
        onOpenChange={() => {}}
        treeId="tree-1"
        treeName="Old Oak"
      />,
    );
    expect(screen.getByText(/Sign in to leave a memory seed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    // Form fields are absent.
    expect(screen.queryByLabelText(/^Title$/i)).toBeNull();
    expect(screen.queryByLabelText(/^Body$/i)).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Hang in the branches|Send through the roots|Hang & send/ }),
    ).toBeNull();
    expect(insertSingle).not.toHaveBeenCalled();
    expect(sendWhisperMock).not.toHaveBeenCalled();
  });
});
