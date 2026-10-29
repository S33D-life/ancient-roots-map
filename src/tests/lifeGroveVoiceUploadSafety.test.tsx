/**
 * Life Grove voice safety: temporary fail-closed frontend behaviour.
 * Uses fake media components and mocked storage only; no real Supabase requests.
 * This does NOT establish production RLS/storage safety or repair existing media.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LifeGroveOfferingComposer from "@/components/life-groves/LifeGroveOfferingComposer";

const spies = vi.hoisted(() => ({
  recorderMounted: vi.fn(),
  storageFrom: vi.fn(),
  dbFrom: vi.fn(),
  createOffering: vi.fn(),
  listOfferings: vi.fn(),
}));

vi.mock("@/components/offering-kit", () => ({
  PhotoOfferingPicker: () => null,
  PoemOfferingInput: () => null,
  SongOfferingSearch: () => null,
  BookOfferingSearch: () => null,
  VoiceOfferingRecorder: () => {
    spies.recorderMounted();
    return null;
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: { from: spies.storageFrom },
    from: spies.dbFrom,
  },
}));

vi.mock("@/repositories/life-groves", () => ({
  createOffering: spies.createOffering,
  listOfferings: spies.listOfferings,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
});

function openComposer(privacy: "private_family" | "invite_only" | "public") {
  render(
    <LifeGroveOfferingComposer
      open
      onClose={vi.fn()}
      groveId="fictional-grove"
      groveTitle="A fictional Grove"
      grovePrivacy={privacy}
      contributorUserId="fictional-user"
    />,
  );
}

describe("Life Grove voice fail-closed upload gate", () => {
  it.each(["private_family", "invite_only", "public"] as const)(
    "never mounts the shared public voice uploader for a %s Grove",
    (privacy) => {
      openComposer(privacy);
      fireEvent.click(screen.getByRole("button", { name: "Voice note" }));

      expect(screen.getByRole("status")).toHaveTextContent(
        "Voice memories are temporarily unavailable in Life Groves",
      );
      expect(screen.getByRole("button", { name: "Hang voice memory" })).toBeDisabled();
      expect(spies.recorderMounted).not.toHaveBeenCalled();

      // Choosing 'public' must not re-enable a Grove recording.
      fireEvent.click(screen.getByRole("button", { name: "Anyone who wanders past" }));
      expect(screen.getByRole("button", { name: "Hang voice memory" })).toBeDisabled();
      expect(spies.recorderMounted).not.toHaveBeenCalled();
      expect(spies.storageFrom).not.toHaveBeenCalled();
      expect(spies.createOffering).not.toHaveBeenCalled();
    },
  );

  it("leaves ordinary non-voice memory composing available", () => {
    openComposer("private_family");
    fireEvent.click(screen.getByRole("button", { name: "Story" }));
    fireEvent.change(screen.getByPlaceholderText("Tell a memory…"), {
      target: { value: "A fictional story, not personal data." },
    });
    expect(screen.getByRole("button", { name: "Hang memory" })).not.toBeDisabled();
    expect(spies.recorderMounted).not.toHaveBeenCalled();
    expect(spies.storageFrom).not.toHaveBeenCalled();
  });
});
